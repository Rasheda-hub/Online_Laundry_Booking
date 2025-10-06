from fastapi import APIRouter, Depends, HTTPException
from models import (
    CategoryCreate,
    CategoryUpdate,
    CategoryPublic,
    CategoryPricingType,
    UserPublic,
    UserRole,
    ProviderStatus,
)
from auth import get_current_user
from db import get_session
import uuid

router = APIRouter(prefix="/categories", tags=["categories"]) 


def _to_public(rec: dict) -> CategoryPublic:
    c = rec["category"]
    return CategoryPublic(
        id=c.get("id"),
        provider_id=c.get("provider_id"),
        name=c.get("name"),
        pricing_type=c.get("pricing_type"),
        price=float(c.get("price", 0)),
        min_kilo=c.get("min_kilo"),
        max_kilo=c.get("max_kilo"),
    )


@router.post("/", response_model=CategoryPublic)
def create_category(payload: CategoryCreate, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can create categories")
    if current_user.provider_status != ProviderStatus.approved:
        raise HTTPException(status_code=403, detail="Provider not approved by admin")
    cid = str(uuid.uuid4())
    with get_session() as session:
        session.run(
            """
            MATCH (p:User {id: $pid, role: 'provider'})
            CREATE (c:Category {
              id: $id, name: $name, pricing_type: $ptype, price: $price,
              min_kilo: $min_kilo, max_kilo: $max_kilo
            })-[:OFFERED_BY]->(p)
            """,
            pid=current_user.id,
            id=cid,
            name=payload.name,
            ptype=payload.pricing_type.value,
            price=payload.price,
            min_kilo=payload.min_kilo,
            max_kilo=payload.max_kilo,
        )
        rec = session.run(
            """
            MATCH (c:Category {id: $id})-[:OFFERED_BY]->(p:User)
            RETURN c { .id, .name, .pricing_type, .price, .min_kilo, .max_kilo, provider_id: p.id } AS category
            """,
            id=cid,
        ).single()
    return _to_public(rec)


@router.get("/mine", response_model=list[CategoryPublic])
def list_my_categories(current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can list their categories")
    with get_session() as session:
        result = session.run(
            """
            MATCH (c:Category)-[:OFFERED_BY]->(p:User {id: $pid})
            RETURN c { .id, .name, .pricing_type, .price, .min_kilo, .max_kilo, provider_id: p.id } AS category
            ORDER BY c.name
            """,
            pid=current_user.id,
        )
        return [_to_public(rec) for rec in result]


@router.get("/provider/{provider_id}", response_model=list[CategoryPublic])
def list_categories_by_provider(provider_id: str):
    with get_session() as session:
        result = session.run(
            """
            MATCH (c:Category)-[:OFFERED_BY]->(p:User {id: $pid})
            RETURN c { .id, .name, .pricing_type, .price, .min_kilo, .max_kilo, provider_id: p.id } AS category
            ORDER BY c.name
            """,
            pid=provider_id,
        )
        return [_to_public(rec) for rec in result]


@router.patch("/{category_id}", response_model=CategoryPublic)
def update_category(category_id: str, payload: CategoryUpdate, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can update categories")
    if current_user.provider_status != ProviderStatus.approved:
        raise HTTPException(status_code=403, detail="Provider not approved by admin")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if "pricing_type" in updates:
        updates["pricing_type"] = updates["pricing_type"].value
    with get_session() as session:
        rec = session.run(
            """
            MATCH (c:Category {id: $id})-[:OFFERED_BY]->(p:User {id: $pid})
            SET c += $updates
            RETURN c { .id, .name, .pricing_type, .price, .min_kilo, .max_kilo, provider_id: p.id } AS category
            """,
            id=category_id,
            pid=current_user.id,
            updates=updates,
        ).single()
        if not rec:
            raise HTTPException(status_code=404, detail="Category not found or not owned by provider")
    return _to_public(rec)


@router.delete("/{category_id}")
def delete_category(category_id: str, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can delete categories")
    if current_user.provider_status != ProviderStatus.approved:
        raise HTTPException(status_code=403, detail="Provider not approved by admin")
    with get_session() as session:
        res = session.run(
            "MATCH (c:Category {id: $id})-[:OFFERED_BY]->(p:User {id: $pid}) DETACH DELETE c RETURN 1 AS ok",
            id=category_id,
            pid=current_user.id,
        ).single()
        if not res:
            raise HTTPException(status_code=404, detail="Category not found or not owned by provider")
    return {"detail": "deleted", "id": category_id}
