from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from models import OrderCreate, OrderUpdate, OrderPublic, UserPublic, UserRole
from auth import get_current_user
from db import get_session
import uuid

router = APIRouter(prefix="/orders", tags=["orders"])


def _calculate_total(session, items):
    total = 0.0
    for item in items:
        rec = session.run("MATCH (s:Service {id: $id}) RETURN s.price_per_kg AS price", id=item.service_id).single()
        if not rec:
            raise HTTPException(status_code=400, detail=f"Service not found: {item.service_id}")
        price = rec["price"]
        total += price * item.weight_kg
    return total

@router.post("/", response_model=OrderPublic)
def create_order(payload: OrderCreate, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != UserRole.customer:
        raise HTTPException(status_code=403, detail="Only customers can create orders")
    # use session bound to configured database
    order_id = str(uuid.uuid4())
    created_at = datetime.utcnow()
    with get_session() as session:
        # validate provider exists
        prov = session.run("MATCH (p:User {id: $pid, role: 'provider'}) RETURN p", pid=payload.provider_id).single()
        if not prov:
            raise HTTPException(status_code=400, detail="Provider not found")
        total = _calculate_total(session, payload.items)
        session.run(
            """
            MATCH (c:User {id: $cid, role: 'customer'}), (p:User {id: $pid, role: 'provider'})
            CREATE (o:Order {
                id: $id, status: 'pending', delivery_option: $delivery_option, notes: $notes,
                total_cost: $total_cost, created_at: $created_at
            })-[:PLACED_BY]->(c)
            WITH o, p
            CREATE (o)-[:FOR_PROVIDER]->(p)
            """,
            cid=current_user.id,
            pid=payload.provider_id,
            id=order_id,
            delivery_option=payload.delivery_option.value,
            notes=payload.notes,
            total_cost=total,
            created_at=created_at.isoformat(),
        )
        # attach items as relationships for traceability
        for it in payload.items:
            session.run(
                """
                MATCH (o:Order {id: $oid}), (s:Service {id: $sid})
                CREATE (o)-[:HAS_ITEM {weight_kg: $w}]->(s)
                """,
                oid=order_id, sid=it.service_id, w=it.weight_kg
            )
    return get_order(order_id, current_user)


def _order_to_public(session, oid: str):
    rec = session.run(
        """
        MATCH (o:Order {id: $id})-[:PLACED_BY]->(c:User)
        MATCH (o)-[:FOR_PROVIDER]->(p:User)
        OPTIONAL MATCH (o)-[hi:HAS_ITEM]->(s:Service)
        RETURN o { .id, .status, .delivery_option, .notes, .total_cost, .created_at },
               c.id AS customer_id, 
               p.id AS provider_id,
               p.shop_name AS provider_shop_name,
               p.full_name AS provider_full_name,
               p.shop_address AS provider_address,
               p.contact_number AS provider_contact,
               collect({service_id: s.id, weight_kg: hi.weight_kg}) AS items
        """,
        id=oid,
    ).single()
    if not rec:
        return None
    o = rec[0]
    items = [
        {"service_id": it.get("service_id"), "weight_kg": it.get("weight_kg")}
        for it in rec["items"] if it.get("service_id") is not None
    ]
    return {
        "id": o.get("id"),
        "customer_id": rec["customer_id"],
        "provider_id": rec["provider_id"],
        "provider_shop_name": rec.get("provider_shop_name"),
        "provider_full_name": rec.get("provider_full_name"),
        "provider_address": rec.get("provider_address"),
        "provider_contact": rec.get("provider_contact"),
        "items": items,
        "delivery_option": o.get("delivery_option"),
        "notes": o.get("notes"),
        "status": o.get("status"),
        "total_cost": float(o.get("total_cost")),
        "created_at": datetime.fromisoformat(o.get("created_at")),
    }

@router.get("/{order_id}", response_model=OrderPublic)
def get_order(order_id: str, current_user: UserPublic = Depends(get_current_user)):
    with get_session() as session:
        data = _order_to_public(session, order_id)
        if not data:
            raise HTTPException(status_code=404, detail="Order not found")
        # authorization: customers only own their orders; providers only see orders for them
        if current_user.role == UserRole.customer and data["customer_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if current_user.role == UserRole.provider and data["provider_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        return data

@router.get("/mine/list", response_model=list[OrderPublic])
def list_my_orders(current_user: UserPublic = Depends(get_current_user)):
    with get_session() as session:
        if current_user.role == UserRole.customer:
            q = (
                "MATCH (o:Order)-[:PLACED_BY]->(c:User {id: $id}) RETURN o.id AS id ORDER BY o.created_at DESC"
            )
        else:
            q = (
                "MATCH (o:Order)-[:FOR_PROVIDER]->(p:User {id: $id}) RETURN o.id AS id ORDER BY o.created_at DESC"
            )
        ids = [r["id"] for r in session.run(q, id=current_user.id)]
        out: list[OrderPublic] = []
        for oid in ids:
            data = _order_to_public(session, oid)
            if not data:
                # Order might have been deleted or is incomplete; skip
                continue
            out.append(OrderPublic(**data))
        return out

@router.patch("/{order_id}", response_model=OrderPublic)
def update_order(order_id: str, payload: OrderUpdate, current_user: UserPublic = Depends(get_current_user)):
    with get_session() as session:
        data = _order_to_public(session, order_id)
        if not data:
            raise HTTPException(status_code=404, detail="Order not found")
        if current_user.role == UserRole.customer and data["customer_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if current_user.role == UserRole.provider and data["provider_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        # update items implies recalculation
        if payload.items is not None:
            # delete existing item rels
            session.run("MATCH (:Order {id: $id})-[r:HAS_ITEM]->() DELETE r", id=order_id)
            for it in payload.items:
                session.run(
                    "MATCH (o:Order {id: $oid}), (s:Service {id: $sid}) CREATE (o)-[:HAS_ITEM {weight_kg: $w}]->(s)",
                    oid=order_id, sid=it.service_id, w=it.weight_kg
                )
            new_total = _calculate_total(session, payload.items)
            session.run("MATCH (o:Order {id: $id}) SET o.total_cost = $t", id=order_id, t=new_total)
        # update other fields
        updates = {k: v for k, v in payload.model_dump(exclude_none=True, exclude={"items"}).items()}
        if updates:
            session.run("MATCH (o:Order {id: $id}) SET o += $u", id=order_id, u=updates)
        return get_order(order_id, current_user)
