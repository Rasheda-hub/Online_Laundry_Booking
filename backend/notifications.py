from fastapi import APIRouter, Depends, HTTPException
from models import UserPublic
from auth import get_current_user
from db import get_session

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/mine")
def list_my_notifications(current_user: UserPublic = Depends(get_current_user)):
    with get_session() as session:
        result = session.run(
            """
            MATCH (n:Notification)-[:FOR_USER]->(u:User {id: $uid})
            RETURN n { .id, .type, .message, .created_at, .read } AS n
            ORDER BY n.created_at DESC
            """,
            uid=current_user.id,
        )
        return [rec["n"] for rec in result]

@router.patch("/{notif_id}/read")
def mark_notification_read(notif_id: str, current_user: UserPublic = Depends(get_current_user)):
    with get_session() as session:
        rec = session.run(
            """
            MATCH (n:Notification {id: $id})-[:FOR_USER]->(u:User {id: $uid})
            SET n.read = true
            RETURN n { .id, .type, .message, .created_at, .read } AS n
            """,
            id=notif_id,
            uid=current_user.id,
        ).single()
        if not rec:
            raise HTTPException(status_code=404, detail="Notification not found")
        return rec["n"]
