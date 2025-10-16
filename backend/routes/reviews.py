from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException
from models import ReviewCreate, ReviewPublic, UserPublic, UserRole, BookingStatus
from auth import get_current_user
from db import get_session
import uuid

# Philippine timezone
PH_TZ = ZoneInfo('Asia/Manila')

def get_ph_now():
    """Get current time in Philippine timezone"""
    return datetime.now(PH_TZ)

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/", response_model=ReviewPublic)
def create_review(payload: ReviewCreate, current_user: UserPublic = Depends(get_current_user)):
    """Customer creates a review for a provider after completing a booking"""
    if current_user.role != UserRole.customer:
        raise HTTPException(status_code=403, detail="Only customers can create reviews")
    
    with get_session() as session:
        # Check if booking exists, belongs to customer, and is completed
        booking_check = session.run(
            """
            MATCH (b:Booking {id: $bid})-[:BY_CUSTOMER]->(c:User {id: $cid})
            MATCH (b)-[:FOR_PROVIDER]->(p:User {id: $pid})
            RETURN b.status AS status
            """,
            bid=payload.booking_id,
            cid=current_user.id,
            pid=payload.provider_id,
        ).single()
        
        if not booking_check:
            raise HTTPException(status_code=404, detail="Booking not found or not authorized")
        
        if booking_check["status"] != BookingStatus.completed.value:
            raise HTTPException(status_code=400, detail="Can only review completed bookings")
        
        # Check if review already exists for this booking
        existing = session.run(
            "MATCH (r:Review)-[:FOR_BOOKING]->(b:Booking {id: $bid}) RETURN r.id AS id",
            bid=payload.booking_id,
        ).single()
        
        if existing:
            raise HTTPException(status_code=400, detail="Review already exists for this booking")
        
        # Create review
        review_id = str(uuid.uuid4())
        now = get_ph_now().isoformat()
        
        session.run(
            """
            MATCH (c:User {id: $cid}), (p:User {id: $pid}), (b:Booking {id: $bid})
            CREATE (r:Review {
                id: $rid,
                rating: $rating,
                comment: $comment,
                created_at: $now
            })-[:BY_CUSTOMER]->(c)
            CREATE (r)-[:FOR_PROVIDER]->(p)
            CREATE (r)-[:FOR_BOOKING]->(b)
            """,
            cid=current_user.id,
            pid=payload.provider_id,
            bid=payload.booking_id,
            rid=review_id,
            rating=payload.rating,
            comment=payload.comment,
            now=now,
        )

        # Update provider aggregate fields (average and count)
        session.run(
            """
            MATCH (p:User {id: $pid, role: 'provider'})
            OPTIONAL MATCH (p)<-[:FOR_PROVIDER]-(r:Review)
            WITH p, count(r) AS total_reviews, avg(r.rating) AS avg_rating
            SET p.review_count = total_reviews,
                p.avg_rating = coalesce(round(10 * avg_rating) / 10.0, 0.0)
            """,
            pid=payload.provider_id,
        )
        
        # Notify provider about new review
        session.run(
            """
            MATCH (p:User {id: $pid}), (c:User {id: $cid})
            CREATE (n:Notification {
                id: randomUUID(),
                type: 'new_review',
                message: c.full_name + ' left a ' + toString($rating) + '-star review for your shop.',
                created_at: $now,
                read: false
            })-[:FOR_USER]->(p)
            """,
            pid=payload.provider_id,
            cid=current_user.id,
            rating=payload.rating,
            now=now,
        )
        
        return get_review(review_id, current_user)


@router.patch("/{review_id}", response_model=ReviewPublic)
def update_review(review_id: str, payload: dict, current_user: UserPublic = Depends(get_current_user)):
    """Update an existing review (rating and/or comment).
    Only the customer who created the review can update it.
    """
    with get_session() as session:
        # Ensure the review exists and belongs to current user
        rec = session.run(
            """
            MATCH (r:Review {id: $rid})-[:BY_CUSTOMER]->(c:User {id: $cid})
            MATCH (r)-[:FOR_PROVIDER]->(p:User)
            RETURN r.id AS id, p.id AS provider_id
            """,
            rid=review_id,
            cid=current_user.id,
        ).single()

        if not rec:
            raise HTTPException(status_code=404, detail="Review not found or not authorized")

        updates = {}
        if "rating" in payload:
            r = payload["rating"]
            if not isinstance(r, int) or r < 1 or r > 5:
                raise HTTPException(status_code=400, detail="Rating must be an integer 1-5")
            updates["rating"] = r
        if "comment" in payload:
            updates["comment"] = payload["comment"]

        if not updates:
            # No-op, return current state
            data = _review_to_public(session, review_id)
            if not data:
                raise HTTPException(status_code=404, detail="Review not found")
            return data

        session.run(
            """
            MATCH (r:Review {id: $rid})
            SET r += $updates
            """,
            rid=review_id,
            updates=updates,
        )

        # Update provider aggregates
        session.run(
            """
            MATCH (p:User {id: $pid, role: 'provider'})
            OPTIONAL MATCH (p)<-[:FOR_PROVIDER]-(r:Review)
            WITH p, count(r) AS total_reviews, avg(r.rating) AS avg_rating
            SET p.review_count = total_reviews,
                p.avg_rating = coalesce(round(10 * avg_rating) / 10.0, 0.0)
            """,
            pid=rec["provider_id"],
        )

        data = _review_to_public(session, review_id)
        if not data:
            raise HTTPException(status_code=404, detail="Review not found")
        return data


def _review_to_public(session, review_id: str) -> dict | None:
    """Convert review node to public dict"""
    rec = session.run(
        """
        MATCH (r:Review {id: $id})-[:BY_CUSTOMER]->(c:User)
        MATCH (r)-[:FOR_PROVIDER]->(p:User)
        MATCH (r)-[:FOR_BOOKING]->(b:Booking)
        RETURN r {.id, .rating, .comment, .created_at} AS r,
               c.id AS customer_id, c.full_name AS customer_name,
               p.id AS provider_id,
               b.id AS booking_id
        """,
        id=review_id,
    ).single()
    
    if not rec:
        return None
    
    r = rec["r"]
    return {
        "id": r.get("id"),
        "provider_id": rec["provider_id"],
        "customer_id": rec["customer_id"],
        "customer_name": rec.get("customer_name"),
        "booking_id": rec["booking_id"],
        "rating": int(r.get("rating")),
        "comment": r.get("comment"),
        "created_at": datetime.fromisoformat(r.get("created_at")),
    }


@router.get("/{review_id}", response_model=ReviewPublic)
def get_review(review_id: str, current_user: UserPublic = Depends(get_current_user)):
    """Get a specific review"""
    with get_session() as session:
        data = _review_to_public(session, review_id)
        if not data:
            raise HTTPException(status_code=404, detail="Review not found")
        return data


@router.get("/provider/{provider_id}", response_model=list[ReviewPublic])
def list_provider_reviews(provider_id: str):
    """Get all reviews for a provider (public endpoint)"""
    with get_session() as session:
        # Get all review IDs for this provider
        ids = [
            r["id"]
            for r in session.run(
                "MATCH (r:Review)-[:FOR_PROVIDER]->(p:User {id: $pid}) RETURN r.id AS id ORDER BY r.created_at DESC",
                pid=provider_id,
            )
        ]
        
        reviews = []
        for rid in ids:
            data = _review_to_public(session, rid)
            if data:
                reviews.append(ReviewPublic(**data))
        
        return reviews


@router.get("/provider/{provider_id}/stats")
def get_provider_rating_stats(provider_id: str):
    """Get rating statistics for a provider"""
    with get_session() as session:
        stats = session.run(
            """
            MATCH (r:Review)-[:FOR_PROVIDER]->(p:User {id: $pid})
            RETURN 
                count(r) AS total_reviews,
                avg(r.rating) AS average_rating,
                sum(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS five_star,
                sum(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) AS four_star,
                sum(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) AS three_star,
                sum(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) AS two_star,
                sum(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) AS one_star
            """,
            pid=provider_id,
        ).single()
        
        if not stats or stats["total_reviews"] == 0:
            return {
                "total_reviews": 0,
                "average_rating": 0.0,
                "rating_distribution": {
                    "5": 0,
                    "4": 0,
                    "3": 0,
                    "2": 0,
                    "1": 0,
                }
            }
        
        return {
            "total_reviews": stats["total_reviews"],
            "average_rating": round(float(stats["average_rating"]), 1),
            "rating_distribution": {
                "5": stats["five_star"],
                "4": stats["four_star"],
                "3": stats["three_star"],
                "2": stats["two_star"],
                "1": stats["one_star"],
            }
        }


@router.get("/booking/{booking_id}/check")
def check_booking_review(booking_id: str, current_user: UserPublic = Depends(get_current_user)):
    """Check if a booking has been reviewed"""
    with get_session() as session:
        review = session.run(
            """
            MATCH (r:Review)-[:FOR_BOOKING]->(b:Booking {id: $bid})
            RETURN r.id AS id
            """,
            bid=booking_id,
        ).single()
        
        return {
            "has_review": review is not None,
            "review_id": review["id"] if review else None
        }
