from fastapi import APIRouter, Depends, HTTPException
from models import ServiceCreate, ServiceUpdate, ServicePublic, UserPublic, UserRole, ProviderStatus
from auth import get_current_user
from db import get_session
import uuid

router = APIRouter(prefix="/services", tags=["services"])

@router.post("/", response_model=ServicePublic)
def create_service(payload: ServiceCreate, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can create services")
    if current_user.provider_status != ProviderStatus.approved:
        raise HTTPException(status_code=403, detail="Provider not approved by admin")
    # use session bound to configured database
    service_id = str(uuid.uuid4())
    with get_session() as session:
        session.run(
            """
            MATCH (p:User {id: $provider_id, role: 'provider'})
            CREATE (s:Service {id: $id, name: $name, description: $description, price_per_kg: $price_per_kg})-[:OFFERED_BY]->(p)
            """,
            provider_id=current_user.id,
            id=service_id,
            name=payload.name,
            description=payload.description,
            price_per_kg=payload.price_per_kg,
        )
    return ServicePublic(id=service_id, provider_id=current_user.id, **payload.model_dump())

@router.get("/provider/{provider_id}", response_model=list[ServicePublic])
def list_services_by_provider(provider_id: str):
    with get_session() as session:
        result = session.run(
            """
            MATCH (s:Service)-[:OFFERED_BY]->(p:User {id: $provider_id})
            RETURN s { .id, .name, .description, .price_per_kg, provider_id: p.id } AS service
            """,
            provider_id=provider_id,
        )
        return [ServicePublic(**rec["service"]) for rec in result]

@router.patch("/{service_id}", response_model=ServicePublic)
def update_service(service_id: str, payload: ServiceUpdate, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can update services")
    if current_user.provider_status != ProviderStatus.approved:
        raise HTTPException(status_code=403, detail="Provider not approved by admin")
    with get_session() as session:
        rec = session.run(
            """
            MATCH (s:Service {id: $sid})-[:OFFERED_BY]->(p:User {id: $pid})
            SET s += $updates
            RETURN s { .id, .name, .description, .price_per_kg, provider_id: p.id } AS service
            """,
            sid=service_id,
            pid=current_user.id,
            updates={k: v for k, v in payload.model_dump(exclude_none=True).items()},
        ).single()
        if not rec:
            raise HTTPException(status_code=404, detail="Service not found or not owned by provider")
        return ServicePublic(**rec["service"])

@router.delete("/{service_id}")
def delete_service(service_id: str, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can delete services")
    if current_user.provider_status != ProviderStatus.approved:
        raise HTTPException(status_code=403, detail="Provider not approved by admin")
    with get_session() as session:
        res = session.run(
            """
            MATCH (s:Service {id: $sid})-[:OFFERED_BY]->(p:User {id: $pid})
            DETACH DELETE s
            RETURN count(*) AS c
            """,
            sid=service_id,
            pid=current_user.id,
        ).single()
        if not res or res["c"] == 0:
            raise HTTPException(status_code=404, detail="Service not found or not owned by provider")
    return {"detail": "deleted"}

@router.get("/", response_model=list[ServicePublic])
def list_all_services():
    with get_session() as session:
        result = session.run(
            """
            MATCH (s:Service)-[:OFFERED_BY]->(p:User)
            RETURN s { .id, .name, .description, .price_per_kg, provider_id: p.id } AS service
            ORDER BY s.name
            """
        )
        return [ServicePublic(**rec["service"]) for rec in result]
