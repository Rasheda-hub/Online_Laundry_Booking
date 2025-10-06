from fastapi import APIRouter, Depends, HTTPException
from models import UserPublic, UserRole, ProviderStatus
from auth import get_current_user
from db import get_session

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current: UserPublic = Depends(get_current_user)) -> UserPublic:
    if current.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return current

@router.post("/providers/{provider_id}/approve")
def approve_provider(provider_id: str, _: UserPublic = Depends(require_admin)):
    with get_session() as session:
        res = session.run(
            "MATCH (u:User {id: $id, role: 'provider'}) SET u.provider_status = 'approved' RETURN u.id AS id",
            id=provider_id,
        ).single()
        if not res:
            raise HTTPException(status_code=404, detail="Provider not found")
    return {"detail": "approved", "id": provider_id}

@router.post("/providers/{provider_id}/reject")
def reject_provider(provider_id: str, _: UserPublic = Depends(require_admin)):
    with get_session() as session:
        res = session.run(
            "MATCH (u:User {id: $id, role: 'provider'}) SET u.provider_status = 'rejected' RETURN u.id AS id",
            id=provider_id,
        ).single()
        if not res:
            raise HTTPException(status_code=404, detail="Provider not found")
    return {"detail": "rejected", "id": provider_id}

@router.get("/providers/pending")
def list_pending_providers(_: UserPublic = Depends(require_admin)):
    with get_session() as session:
        result = session.run(
            """
            MATCH (u:User {role: 'provider'})
            WHERE coalesce(u.provider_status,'pending') = 'pending'
            RETURN u { .id, .email, .contact_number, .shop_name, .shop_address, .provider_status } AS u
            ORDER BY u.shop_name
            """
        )
        return [r["u"] for r in result]

@router.post("/users/{user_id}/ban")
def ban_user(user_id: str, _: UserPublic = Depends(require_admin)):
    with get_session() as session:
        res = session.run(
            "MATCH (u:User {id: $id}) SET u.banned = true RETURN u.id AS id",
            id=user_id,
        ).single()
        if not res:
            raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "banned", "id": user_id}

@router.post("/users/{user_id}/unban")
def unban_user(user_id: str, _: UserPublic = Depends(require_admin)):
    with get_session() as session:
        res = session.run(
            "MATCH (u:User {id: $id}) SET u.banned = false RETURN u.id AS id",
            id=user_id,
        ).single()
        if not res:
            raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "unbanned", "id": user_id}

@router.delete("/users/{user_id}")
def delete_user(user_id: str, _: UserPublic = Depends(require_admin)):
    with get_session() as session:
        # Also delete their orders/bookings/services relationships
        session.run("MATCH (u:User {id: $id}) DETACH DELETE u", id=user_id)
    return {"detail": "deleted", "id": user_id}

@router.get("/users")
def list_users(_: UserPublic = Depends(require_admin)):
    with get_session() as session:
        result = session.run(
            """
            MATCH (u:User)
            RETURN u { .id, .email, .contact_number, .role, .full_name, .address, .shop_name, .shop_address, .provider_status, .banned } AS u
            ORDER BY u.role, coalesce(u.full_name,u.shop_name,u.email)
            """
        )
        return [r["u"] for r in result]

@router.get("/stats")
def stats(_: UserPublic = Depends(require_admin)):
    with get_session() as session:
        users = session.run("MATCH (u:User) RETURN count(u) AS c").single()["c"]
        providers = session.run("MATCH (u:User {role: 'provider'}) RETURN count(u) AS c").single()["c"]
        bookings = session.run("MATCH (b:Booking) RETURN count(b) AS c").single()["c"]
    return {"total_users": users, "total_providers": providers, "total_bookings": bookings}
