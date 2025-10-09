from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException
from neo4j.exceptions import ServiceUnavailable
from models import ReceiptPublic, UserPublic, UserRole
from auth import get_current_user
from db import get_session
import uuid

# Philippine timezone
PH_TZ = ZoneInfo('Asia/Manila')

def get_ph_now():
    """Get current time in Philippine timezone"""
    return datetime.now(PH_TZ)

router = APIRouter(prefix="/receipts", tags=["receipts"])

DELIVERY_FEE = 2.5  # flat for pickup/delivery; 0 for dropoff


def _generate_for_order(session, order_id: str):
    # build breakdown with minimal retry for transient Neo4j resets
    attempts = 0
    while True:
        try:
            od = session.run(
        """
        MATCH (o:Order {id: $id})-[:PLACED_BY]->(c:User)
        MATCH (o)-[:FOR_PROVIDER]->(p:User)
        OPTIONAL MATCH (o)-[hi:HAS_ITEM]->(s:Service)
        RETURN o { .id, .total_cost, .delivery_option, .created_at } AS o,
               c.id AS customer_id, c.full_name AS customer_name, c.contact_number AS customer_contact,
               p.id AS provider_id, p.shop_name AS provider_name,
               collect({service_id: s.id, weight_kg: hi.weight_kg, service_name: s.name}) AS items
        """,
        id=order_id,
            ).single()
            break
        except ServiceUnavailable:
            attempts += 1
            if attempts >= 2:
                raise
    if not od:
        raise HTTPException(status_code=404, detail="Order not found")
    o = od["o"]
    items = [it for it in od["items"] if it.get("service_id") is not None]
    subtotal = float(o.get("total_cost", 0.0))
    delivery_fee = DELIVERY_FEE if o.get("delivery_option") == "pickup_delivery" else 0.0
    total = subtotal + delivery_fee

    # create receipt node if not exists
    rec = session.run("MATCH (r:Receipt)-[:FOR_ORDER]->(:Order {id: $id}) RETURN r", id=order_id).single()
    if rec:
        rid = rec[0]["id"]
    else:
        rid = str(uuid.uuid4())
        session.run(
            """
            MATCH (o:Order {id: $oid})-[:PLACED_BY]->(c:User)
            MATCH (o)-[:FOR_PROVIDER]->(p:User)
            CREATE (r:Receipt {
                id: $id, subtotal: $subtotal, delivery_fee: $delivery_fee, total: $total, created_at: $created_at
            })-[:FOR_ORDER]->(o)
            CREATE (r)-[:FOR_CUSTOMER]->(c)
            CREATE (r)-[:FOR_PROVIDER]->(p)
            """,
            oid=order_id,
            id=rid,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total=total,
            created_at=get_ph_now().isoformat(),
        )
    return {
        "id": rid,
        "order_id": o.get("id"),
        "customer_id": od["customer_id"],
        "customer_name": od.get("customer_name"),
        "customer_contact": od.get("customer_contact"),
        "provider_id": od["provider_id"],
        "provider_name": od.get("provider_name"),
        "items": [{"service_id": it.get("service_id"), "service_name": it.get("service_name"), "weight_kg": it.get("weight_kg")} for it in items],
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "total": total,
        "created_at": datetime.fromisoformat(o.get("created_at")),
    }

@router.post("/generate/{order_id}", response_model=ReceiptPublic)
def generate_receipt(order_id: str, current_user: UserPublic = Depends(get_current_user)):
    with get_session() as session:
        data = session.run("MATCH (o:Order {id: $id}) RETURN o", id=order_id).single()
        if not data:
            raise HTTPException(status_code=404, detail="Order not found")
        # authorize
        od = session.run(
            "MATCH (o:Order {id: $id})-[:PLACED_BY]->(c:User) MATCH (o)-[:FOR_PROVIDER]->(p:User) RETURN c.id AS cid, p.id AS pid",
            id=order_id,
        ).single()
        if current_user.role == UserRole.customer and od["cid"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if current_user.role == UserRole.provider and od["pid"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        return _generate_for_order(session, order_id)

@router.get("/mine", response_model=list[ReceiptPublic])
def list_my_receipts(current_user: UserPublic = Depends(get_current_user)):
    with get_session() as session:
        if current_user.role == UserRole.customer:
            q = "MATCH (r:Receipt)-[:FOR_CUSTOMER]->(c:User {id: $id}) RETURN r.id AS id ORDER BY r.created_at DESC"
        else:
            q = "MATCH (r:Receipt)-[:FOR_PROVIDER]->(p:User {id: $id}) RETURN r.id AS id ORDER BY r.created_at DESC"
        # minimal retry for transient errors
        attempts = 0
        while True:
            try:
                ids = [r["id"] for r in session.run(q, id=current_user.id)]
                break
            except ServiceUnavailable:
                attempts += 1
                if attempts >= 2:
                    raise
        out = []
        for rid in ids:
            # retry per-receipt fetch
            attempts = 0
            while True:
                try:
                    data = session.run(
                """
                MATCH (r:Receipt {id: $id})-[:FOR_ORDER]->(o:Order)
                MATCH (r)-[:FOR_CUSTOMER]->(c:User)
                MATCH (r)-[:FOR_PROVIDER]->(p:User)
                OPTIONAL MATCH (o)-[hi:HAS_ITEM]->(s:Service)
                RETURN r { .id, .subtotal, .delivery_fee, .total, .created_at } AS r,
                       o.id AS order_id,
                       c.id AS customer_id, c.full_name AS customer_name, c.contact_number AS customer_contact, c.address AS customer_address,
                       p.id AS provider_id, p.shop_name AS provider_name, p.contact_number AS provider_contact, p.shop_address AS provider_address,
                       collect({service_id: s.id, weight_kg: hi.weight_kg, service_name: s.name}) AS items
                """,
                id=rid,
                    ).single()
                    break
                except ServiceUnavailable:
                    attempts += 1
                    if attempts >= 2:
                        raise
            if not data:
                continue  # Skip this receipt if not found
            r = data["r"]
            items = [it for it in data["items"] if it.get("service_id") is not None]
            if not items:
                # fallback: derive single item from booking linked to the order (FROM_BOOKING)
                fb = session.run(
                    """
                    MATCH (r:Receipt {id: $id})-[:FOR_ORDER]->(o:Order)-[:FROM_BOOKING]->(b:Booking)
                    MATCH (b)-[:OF_CATEGORY]->(cat:Category)
                    RETURN {service_id: cat.id, weight_kg: b.weight_kg, service_name: cat.name} AS item
                    """,
                    id=rid,
                ).single()
                if fb and fb.get("item"):
                    items = [fb["item"]]
            out.append({
                "id": r.get("id"),
                "order_id": data["order_id"],
                "customer_id": data["customer_id"],
                "customer_name": data.get("customer_name"),
                "customer_contact": data.get("customer_contact"),
                "customer_address": data.get("customer_address"),
                "provider_id": data["provider_id"],
                "provider_name": data.get("provider_name"),
                "provider_contact": data.get("provider_contact"),
                "provider_address": data.get("provider_address"),
                "items": items,
                "subtotal": float(r.get("subtotal")),
                "delivery_fee": float(r.get("delivery_fee")),
                "total": float(r.get("total")),
                "created_at": datetime.fromisoformat(r.get("created_at")),
            })
        return out
