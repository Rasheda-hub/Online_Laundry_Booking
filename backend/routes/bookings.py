from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException
from models import (
    BookingCreate,
    CartBookingCreate,
    BookingUpdateStatus,
    BookingUpdateDetails,
    BookingPublic,
    BookingStatus,
    CategoryPricingType,
    UserPublic,
    UserRole,
    ProviderStatus,
)
from auth import get_current_user
from neo4j.exceptions import ServiceUnavailable
from db import get_session
import uuid

# Philippine timezone
PH_TZ = ZoneInfo('Asia/Manila')

def get_ph_now():
    """Get current time in Philippine timezone"""
    return datetime.now(PH_TZ)

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _booking_to_public(session, bid: str) -> dict | None:
    # retry to mitigate transient Aura resets
    attempts = 0
    while True:
        try:
            rec = session.run(
        """
        MATCH (b:Booking {id: $id})-[:BY_CUSTOMER]->(c:User)
        MATCH (b)-[:FOR_PROVIDER]->(p:User)
        MATCH (b)-[:OF_CATEGORY]->(cat:Category)
        RETURN b { .id, .schedule_at, .status, .notes, .created_at, .weight_kg, .total_price } AS b,
               c.id AS customer_id, 
               p.id AS provider_id,
               p.shop_name AS provider_shop_name,
               p.full_name AS provider_full_name,
               p.shop_address AS provider_address,
               p.contact_number AS provider_contact,
               cat { .id, .name, .pricing_type } AS cat
        """,
        id=bid,
            ).single()
            break
        except ServiceUnavailable:
            attempts += 1
            if attempts >= 2:
                raise
    if not rec:
        return None
    b = rec["b"]
    cat = rec["cat"]
    return {
        "id": b.get("id"),
        "customer_id": rec["customer_id"],
        "provider_id": rec["provider_id"],
        "provider_shop_name": rec.get("provider_shop_name"),
        "provider_full_name": rec.get("provider_full_name"),
        "provider_address": rec.get("provider_address"),
        "provider_contact": rec.get("provider_contact"),
        "category_id": cat.get("id"),
        "category_name": cat.get("name"),
        "pricing_type": cat.get("pricing_type"),
        "weight_kg": float(b.get("weight_kg")),
        "total_price": float(b.get("total_price")),
        "schedule_at": datetime.fromisoformat(b.get("schedule_at")),
        "status": b.get("status"),
        "notes": b.get("notes"),
        "created_at": datetime.fromisoformat(b.get("created_at")),
    }


@router.post("/", response_model=BookingPublic)
def create_booking(payload: BookingCreate, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != UserRole.customer:
        raise HTTPException(status_code=403, detail="Only customers can create bookings")
    with get_session() as session:
        # validate provider & category
        prov = session.run(
            "MATCH (p:User {id: $pid, role: 'provider'}) RETURN p.provider_status AS st, coalesce(p.is_available, true) AS is_available",
            pid=payload.provider_id,
        ).single()
        if not prov:
            raise HTTPException(status_code=400, detail="Provider not found")
        if prov["st"] != ProviderStatus.approved.value:
            raise HTTPException(status_code=400, detail="Provider not approved")
        if not prov["is_available"]:
            raise HTTPException(status_code=400, detail="This shop is currently closed and not accepting bookings")
        cat = session.run(
            "MATCH (cat:Category {id: $cid})-[:OFFERED_BY]->(p:User {id: $pid}) RETURN cat { .id, .name, .pricing_type, .price, .min_kilo, .max_kilo } AS cat",
            cid=payload.category_id,
            pid=payload.provider_id,
        ).single()
        if not cat:
            raise HTTPException(status_code=400, detail="Category not found for provider")
        catd = cat["cat"]
        pricing_type = catd.get("pricing_type")
        price = float(catd.get("price"))
        weight = float(payload.weight_kg)
        total = 0.0
        if pricing_type == CategoryPricingType.per_kilo.value:
            total = price * weight
        else:
            # Fixed pricing: charge fixed price, multiply if weight exceeds max
            min_k = float(catd.get("min_kilo")) if catd.get("min_kilo") is not None else None
            max_k = float(catd.get("max_kilo")) if catd.get("max_kilo") is not None else None
            
            # Check minimum weight requirement
            if min_k is not None and weight < min_k:
                raise HTTPException(status_code=400, detail=f"Weight must be at least {min_k} kg for this service")
            
            # If weight exceeds max, multiply price by number of batches
            if max_k is not None and weight > max_k:
                import math
                num_batches = math.ceil(weight / max_k)
                total = price * num_batches
            else:
                total = price

        bid = str(uuid.uuid4())
        now = get_ph_now().isoformat()
        # schedule_at is set by server to now (real-time), ignoring client-provided values
        schedule_at = now
        session.run(
            """
            MATCH (c:User {id: $cid, role: 'customer'})
            MATCH (p:User {id: $pid, role: 'provider'})
            MATCH (cat:Category {id: $catid})
            CREATE (b:Booking {
              id: $id, schedule_at: $schedule_at, status: 'pending', notes: $notes, created_at: $created_at,
              weight_kg: $w, total_price: $total
            })-[:BY_CUSTOMER]->(c)
            WITH b, p, cat
            CREATE (b)-[:FOR_PROVIDER]->(p)
            CREATE (b)-[:OF_CATEGORY]->(cat)
            """,
            cid=current_user.id,
            pid=payload.provider_id,
            catid=payload.category_id,
            id=bid,
            schedule_at=schedule_at,
            notes=payload.notes,
            created_at=now,
            w=weight,
            total=total,
        )
        
        # Notify provider about new booking (receipt will be generated when provider accepts)
        session.run(
            """
            MATCH (b:Booking {id: $bid})-[:BY_CUSTOMER]->(c:User)
            MATCH (b)-[:FOR_PROVIDER]->(p:User)
            MATCH (b)-[:OF_CATEGORY]->(cat:Category)
            CREATE (nc:Notification {
              id: randomUUID(), 
              type: 'booking_created', 
              message: 'Your booking for ' + cat.name + ' has been submitted. Waiting for provider confirmation.', 
              created_at: $now, 
              read: false, 
              booking_id: $bid
            })-[:FOR_USER]->(c)
            CREATE (np:Notification {
              id: randomUUID(), 
              type: 'new_booking', 
              message: 'New booking received for ' + cat.name + ' from ' + c.full_name + '. Total: ₱' + toString(b.total_price), 
              created_at: $now, 
              read: false, 
              booking_id: $bid
            })-[:FOR_USER]->(p)
            """,
            bid=bid,
            now=now,
        )
        
        data = _booking_to_public(session, bid)
    return data  # type: ignore


# Removed cart endpoint - using direct booking only


@router.get("/mine", response_model=list[BookingPublic])
def list_my_bookings(current_user: UserPublic = Depends(get_current_user)):
    with get_session() as session:
        # build query per role
        if current_user.role == UserRole.customer:
            q = "MATCH (b:Booking)-[:BY_CUSTOMER]->(c:User {id: $id}) RETURN b.id AS id ORDER BY b.created_at DESC"
            params = {"id": current_user.id}
        elif current_user.role == UserRole.provider:
            q = "MATCH (b:Booking)-[:FOR_PROVIDER]->(p:User {id: $id}) RETURN b.id AS id ORDER BY b.created_at DESC"
            params = {"id": current_user.id}
        else:
            # admin can see all
            q = "MATCH (b:Booking) RETURN b.id AS id ORDER BY b.created_at DESC"
            params = {}
        # retry fetching ids
        attempts = 0
        while True:
            try:
                ids = [r["id"] for r in session.run(q, **params)]
                break
            except ServiceUnavailable:
                attempts += 1
                if attempts >= 2:
                    raise
        out = []
        for bid in ids:
            data = _booking_to_public(session, bid)
            if not data:
                # skip missing/incomplete records to avoid 500s
                continue
            out.append(BookingPublic(**data))
        return out


@router.post("/{booking_id}/accept", response_model=BookingPublic)
def accept_booking(booking_id: str, current_user: UserPublic = Depends(get_current_user)):
    """Provider accepts a pending booking, changes status to 'confirmed', generates receipt, and notifies customer"""
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can accept bookings")
    with get_session() as session:
        # Check booking exists and is pending
        check = session.run(
            "MATCH (b:Booking {id: $id})-[:FOR_PROVIDER]->(p:User {id: $pid}) RETURN b.status AS status",
            id=booking_id,
            pid=current_user.id,
        ).single()
        if not check:
            raise HTTPException(status_code=404, detail="Booking not found or not for this provider")
        if check["status"] != BookingStatus.pending.value:
            raise HTTPException(status_code=400, detail="Only pending bookings can be accepted")
        
        # Update status to confirmed
        session.run(
            "MATCH (b:Booking {id: $id})-[:FOR_PROVIDER]->(p:User {id: $pid}) SET b.status = 'confirmed' RETURN b",
            id=booking_id,
            pid=current_user.id,
        )
        
        # Generate receipt now that booking is accepted
        now = get_ph_now().isoformat()
        receipt_id = str(uuid.uuid4())
        order_id = str(uuid.uuid4())
        
        session.run(
            """
            MATCH (b:Booking {id: $bid})-[:BY_CUSTOMER]->(c:User)
            MATCH (b)-[:FOR_PROVIDER]->(p:User)
            MATCH (b)-[:OF_CATEGORY]->(cat:Category)
            CREATE (o:Order {id: $oid, status: 'confirmed', created_at: $now})-[:FROM_BOOKING]->(b)
            CREATE (r:Receipt {
              id: $rid, 
              subtotal: b.total_price, 
              delivery_fee: 0.0, 
              total: b.total_price, 
              created_at: $now
            })-[:FOR_ORDER]->(o)
            CREATE (r)-[:FOR_CUSTOMER]->(c)
            CREATE (r)-[:FOR_PROVIDER]->(p)
            """,
            bid=booking_id,
            oid=order_id,
            rid=receipt_id,
            now=now,
        )
        
        # Notify both customer and provider about the acceptance and receipt
        session.run(
            """
            MATCH (b:Booking {id: $bid})-[:BY_CUSTOMER]->(c:User)
            MATCH (b)-[:OF_CATEGORY]->(cat:Category)
            MATCH (b)-[:FOR_PROVIDER]->(p:User)
            CREATE (nc:Notification {
              id: randomUUID(),
              type: 'booking_accepted',
              message: 'Your booking for ' + cat.name + ' has been accepted by ' + p.shop_name + '. Receipt generated. Please pay ₱' + toString(b.total_price) + ' in cash when you deliver your laundry.',
              created_at: $now,
              read: false,
              booking_id: $bid,
              receipt_id: $rid
            })-[:FOR_USER]->(c)
            CREATE (np:Notification {
              id: randomUUID(),
              type: 'receipt_generated',
              message: 'Receipt generated for ' + cat.name + ' booking from ' + c.full_name + '. Amount: ₱' + toString(b.total_price) + '. Waiting for customer payment and delivery.',
              created_at: $now,
              read: false,
              booking_id: $bid,
              receipt_id: $rid
            })-[:FOR_USER]->(p)
            """,
            bid=booking_id,
            rid=receipt_id,
            now=now,
        )
        
        return BookingPublic(**_booking_to_public(session, booking_id))


@router.post("/{booking_id}/reject", response_model=BookingPublic)
def reject_booking(booking_id: str, current_user: UserPublic = Depends(get_current_user)):
    """Provider rejects a pending booking and notifies customer"""
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can reject bookings")
    with get_session() as session:
        # Check booking exists and is pending
        check = session.run(
            "MATCH (b:Booking {id: $id})-[:FOR_PROVIDER]->(p:User {id: $pid}) RETURN b.status AS status",
            id=booking_id,
            pid=current_user.id,
        ).single()
        if not check:
            raise HTTPException(status_code=404, detail="Booking not found or not for this provider")
        if check["status"] != BookingStatus.pending.value:
            raise HTTPException(status_code=400, detail="Only pending bookings can be rejected")
        
        # Update status to rejected
        session.run(
            "MATCH (b:Booking {id: $id})-[:FOR_PROVIDER]->(p:User {id: $pid}) SET b.status = 'rejected' RETURN b",
            id=booking_id,
            pid=current_user.id,
        )
        
        # Notify customer that booking is rejected
        now = get_ph_now().isoformat()
        session.run(
            """
            MATCH (b:Booking {id: $bid})-[:BY_CUSTOMER]->(c:User)
            MATCH (b)-[:OF_CATEGORY]->(cat:Category)
            MATCH (b)-[:FOR_PROVIDER]->(p:User)
            CREATE (n:Notification {
              id: randomUUID(),
              type: 'booking_rejected',
              message: 'Your booking for ' + cat.name + ' has been rejected by ' + p.shop_name + '.',
              created_at: $now,
              read: false,
              booking_id: $bid
            })-[:FOR_USER]->(c)
            """,
            bid=booking_id,
            now=now,
        )
        
        # Update associated Order status to cancelled
        session.run(
            """
            MATCH (b:Booking {id: $bid})<-[:FROM_BOOKING]-(o:Order)
            SET o.status = 'cancelled'
            """,
            bid=booking_id,
        )
        
        return BookingPublic(**_booking_to_public(session, booking_id))


@router.post("/{booking_id}/confirm-payment", response_model=BookingPublic)
def confirm_payment(booking_id: str, current_user: UserPublic = Depends(get_current_user)):
    """Provider confirms customer payment and laundry delivery, changes status to 'in_progress'"""
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can confirm payment")
    with get_session() as session:
        # Check booking exists, belongs to provider, and is confirmed
        check = session.run(
            "MATCH (b:Booking {id: $id})-[:FOR_PROVIDER]->(p:User {id: $pid}) RETURN b.status AS status",
            id=booking_id,
            pid=current_user.id,
        ).single()
        if not check:
            raise HTTPException(status_code=404, detail="Booking not found or not for this provider")
        if check["status"] != BookingStatus.confirmed.value:
            raise HTTPException(status_code=400, detail="Only confirmed bookings can be marked as paid")
        
        # Update status to in_progress
        session.run(
            "MATCH (b:Booking {id: $id})-[:FOR_PROVIDER]->(p:User {id: $pid}) SET b.status = 'in_progress' RETURN b",
            id=booking_id,
            pid=current_user.id,
        )
        
        # Notify customer that payment is confirmed and laundry is being processed
        now = get_ph_now().isoformat()
        session.run(
            """
            MATCH (b:Booking {id: $bid})-[:BY_CUSTOMER]->(c:User)
            MATCH (b)-[:OF_CATEGORY]->(cat:Category)
            CREATE (n:Notification {
              id: randomUUID(),
              type: 'payment_confirmed',
              message: 'Payment confirmed! Your laundry for ' + cat.name + ' is now being processed.',
              created_at: $now,
              read: false,
              booking_id: $bid
            })-[:FOR_USER]->(c)
            """,
            bid=booking_id,
            now=now,
        )
        
        # Update associated Order status to in_progress
        session.run(
            """
            MATCH (b:Booking {id: $bid})<-[:FROM_BOOKING]-(o:Order)
            SET o.status = 'in_progress'
            """,
            bid=booking_id,
        )
        
        return BookingPublic(**_booking_to_public(session, booking_id))


@router.patch("/{booking_id}/status", response_model=BookingPublic)
def update_status(booking_id: str, payload: BookingUpdateStatus, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can update booking status")
    with get_session() as session:
        rec = session.run(
            "MATCH (b:Booking {id: $id})-[:FOR_PROVIDER]->(p:User {id: $pid}) SET b.status = $st RETURN b",
            id=booking_id,
            pid=current_user.id,
            st=payload.status.value,
        ).single()
        if not rec:
            raise HTTPException(status_code=404, detail="Booking not found or not for this provider")
        
        # Send notification to customer about status update
        now = get_ph_now().isoformat()
        status_messages = {
            'confirmed': 'Your booking has been accepted. Please pay and deliver your laundry.',
            'in_progress': 'Your laundry is now being processed',
            'ready': 'Your laundry is ready for pickup!',
            'completed': 'Your order has been completed. Thank you!',
            'rejected': 'Your booking has been rejected'
        }
        message = status_messages.get(payload.status.value, f'Your booking status updated to {payload.status.value}')
        
        session.run(
            """
            MATCH (b:Booking {id: $bid})-[:BY_CUSTOMER]->(c:User)
            MATCH (b)-[:OF_CATEGORY]->(cat:Category)
            CREATE (n:Notification {
              id: randomUUID(),
              type: 'status_update',
              message: $message + ' - ' + cat.name,
              created_at: $now,
              read: false,
              booking_id: $bid
            })-[:FOR_USER]->(c)
            """,
            bid=booking_id,
            message=message,
            now=now,
        )
        
        # If completed, update the existing Order status (created during booking)
        if payload.status.value == BookingStatus.completed.value:
            now = get_ph_now().isoformat()
            # Update existing order status to completed
            session.run(
                """
                MATCH (b:Booking {id: $bid})<-[:FROM_BOOKING]-(o:Order)
                SET o.status = 'completed'
                """,
                bid=booking_id,
            )
        return BookingPublic(**_booking_to_public(session, booking_id))


@router.patch("/{booking_id}/details", response_model=BookingPublic)
def update_booking_details(booking_id: str, payload: BookingUpdateDetails, current_user: UserPublic = Depends(get_current_user)):
    """Provider updates booking details (weight, notes) and recalculates total price. Notifies customer."""
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can update booking details")
    
    with get_session() as session:
        # Check booking exists and belongs to provider
        check = session.run(
            """
            MATCH (b:Booking {id: $id})-[:FOR_PROVIDER]->(p:User {id: $pid})
            MATCH (b)-[:OF_CATEGORY]->(cat:Category)
            RETURN b.status AS status, b.weight_kg AS old_weight, b.total_price AS old_total,
                   cat.pricing_type AS pricing_type, cat.price AS price, 
                   cat.min_kilo AS min_kilo, cat.max_kilo AS max_kilo
            """,
            id=booking_id,
            pid=current_user.id,
        ).single()
        
        if not check:
            raise HTTPException(status_code=404, detail="Booking not found or not for this provider")
        
        # Don't allow editing completed or rejected bookings
        if check["status"] in [BookingStatus.completed.value, BookingStatus.rejected.value]:
            raise HTTPException(status_code=400, detail="Cannot edit completed or rejected bookings")
        
        # Prepare update fields
        updates = {}
        notification_parts = []
        
        # Update weight and recalculate total if weight changed
        if payload.weight_kg is not None:
            old_weight = float(check["old_weight"])
            new_weight = float(payload.weight_kg)
            
            if new_weight != old_weight:
                pricing_type = check["pricing_type"]
                price = float(check["price"])
                
                # Recalculate total based on pricing type
                if pricing_type == CategoryPricingType.per_kilo.value:
                    new_total = price * new_weight
                else:
                    # Fixed pricing
                    min_k = float(check["min_kilo"]) if check["min_kilo"] is not None else None
                    max_k = float(check["max_kilo"]) if check["max_kilo"] is not None else None
                    
                    if min_k is not None and new_weight < min_k:
                        raise HTTPException(status_code=400, detail=f"Weight must be at least {min_k} kg for this service")
                    
                    if max_k is not None and new_weight > max_k:
                        import math
                        num_batches = math.ceil(new_weight / max_k)
                        new_total = price * num_batches
                    else:
                        new_total = price
                
                updates["weight_kg"] = new_weight
                updates["total_price"] = new_total
                notification_parts.append(f"Weight updated from {old_weight} kg to {new_weight} kg. New total: ₱{new_total:.2f}")
        
        # Update notes if provided
        if payload.notes is not None:
            updates["notes"] = payload.notes
            notification_parts.append(f"Notes updated: {payload.notes}")
        
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")
        
        # Build SET clause dynamically
        set_clauses = [f"b.{key} = ${key}" for key in updates.keys()]
        set_query = ", ".join(set_clauses)
        
        # Update the booking
        session.run(
            f"MATCH (b:Booking {{id: $id}})-[:FOR_PROVIDER]->(p:User {{id: $pid}}) SET {set_query} RETURN b",
            id=booking_id,
            pid=current_user.id,
            **updates
        )
        
        # Notify customer about the changes
        now = get_ph_now().isoformat()
        notification_message = "Provider updated your booking details: " + "; ".join(notification_parts)
        
        session.run(
            """
            MATCH (b:Booking {id: $bid})-[:BY_CUSTOMER]->(c:User)
            MATCH (b)-[:OF_CATEGORY]->(cat:Category)
            MATCH (b)-[:FOR_PROVIDER]->(p:User)
            CREATE (n:Notification {
              id: randomUUID(),
              type: 'booking_updated',
              message: $message,
              created_at: $now,
              read: false,
              booking_id: $bid
            })-[:FOR_USER]->(c)
            """,
            bid=booking_id,
            message=notification_message,
            now=now,
        )
        
        # Update receipt if it exists (for confirmed+ bookings)
        if "total_price" in updates:
            session.run(
                """
                MATCH (b:Booking {id: $bid})<-[:FROM_BOOKING]-(o:Order)<-[:FOR_ORDER]-(r:Receipt)
                SET r.subtotal = $new_total, r.total = $new_total
                """,
                bid=booking_id,
                new_total=updates["total_price"],
            )
        
        return BookingPublic(**_booking_to_public(session, booking_id))
