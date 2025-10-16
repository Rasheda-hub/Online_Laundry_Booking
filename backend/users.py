from fastapi import APIRouter, Depends, HTTPException
from models import CustomerCreate, ProviderCreate, UserPublic, UserRole, ProviderStatus, ChangePasswordRequest
from db import get_session
from auth import get_password_hash, get_current_user, verify_password
import uuid

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register/customer", response_model=UserPublic)
def register_customer(payload: CustomerCreate):
    with get_session() as session:
        exists = session.run("MATCH (u:User {email: $email}) RETURN u", email=payload.email).single()
        if exists:
            raise HTTPException(status_code=400, detail="Email already registered")
        user_id = str(uuid.uuid4())
        session.run(
            """
            CREATE (u:User {
                id: $id, role: $role, email: $email, contact_number: $contact_number,
                full_name: $full_name, address: $address, hashed_password: $hashed_password,
                banned: false
            })
            RETURN u
            """,
            id=user_id,
            role=UserRole.customer.value,
            email=payload.email,
            contact_number=payload.contact_number,
            full_name=payload.full_name,
            address=payload.address,
            hashed_password=get_password_hash(payload.password),
        )
        return UserPublic(
            id=user_id,
            role=UserRole.customer,
            email=payload.email,
            contact_number=payload.contact_number,
            full_name=payload.full_name,
            address=payload.address,
        )

@router.post("/register/provider", response_model=UserPublic)
def register_provider(payload: ProviderCreate):
    with get_session() as session:
        exists = session.run("MATCH (u:User {email: $email}) RETURN u", email=payload.email).single()
        if exists:
            raise HTTPException(status_code=400, detail="Email already registered")
        user_id = str(uuid.uuid4())
        session.run(
            """
            CREATE (u:User {
                id: $id, role: $role, email: $email, contact_number: $contact_number,
                shop_name: $shop_name, shop_address: $shop_address, hashed_password: $hashed_password,
                provider_status: 'pending', banned: false, is_available: true
            })
            RETURN u
            """,
            id=user_id,
            role=UserRole.provider.value,
            email=payload.email,
            contact_number=payload.contact_number,
            shop_name=payload.shop_name,
            shop_address=payload.shop_address,
            hashed_password=get_password_hash(payload.password),
        )
        return UserPublic(
            id=user_id,
            role=UserRole.provider,
            email=payload.email,
            contact_number=payload.contact_number,
            shop_name=payload.shop_name,
            shop_address=payload.shop_address,
            provider_status=ProviderStatus.pending,
        )

@router.get("/me", response_model=UserPublic)
def get_profile(current_user: UserPublic = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=UserPublic)
def get_user_by_id(user_id: str, current_user: UserPublic = Depends(get_current_user)):
    """Get user details by ID (for viewing provider info)"""
    with get_session() as session:
        result = session.run(
            """
            MATCH (u:User {id: $id})
            RETURN u { .id, .role, .email, .contact_number, .full_name, .address, 
                      .shop_name, .shop_address, .provider_status, .banned, .is_available } AS user
            """,
            id=user_id
        ).single()
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = result["user"]
        return UserPublic(**user_data)

# Public: list approved providers (id, shop_name, contact, shop_address)
@router.get("/providers/approved")
def list_approved_providers():
    from neo4j.exceptions import ServiceUnavailable
    attempts = 0
    while attempts < 3:
        try:
            with get_session() as session:
                result = session.run(
                    """
                    MATCH (u:User {role: 'provider'})
                    WHERE u.provider_status = 'approved'
                    RETURN u { .id, .email, .contact_number, .shop_name, .shop_address, .is_available } AS provider
                    ORDER BY u.shop_name
                    """
                )
                return [r["provider"] for r in result]
        except ServiceUnavailable:
            attempts += 1
            if attempts >= 3:
                print(f"Neo4j unavailable after {attempts} attempts")
                return []
        except Exception as e:
            print(f"Error fetching approved providers: {e}")
            # Return empty list instead of 500 error
            return []
    return []

@router.get("/providers/search")
def search_providers(q: str = ""):
    term = (q or "").strip()
    with get_session() as session:
        if not term:
            # fallback to approved list when query empty
            result = session.run(
                """
                MATCH (u:User {role: 'provider'})
                WHERE u.provider_status = 'approved'
                RETURN u { .id, .email, .contact_number, .shop_name, .shop_address, .is_available } AS provider
                ORDER BY u.shop_name
                """
            )
            return [r["provider"] for r in result]
        result = session.run(
            """
            MATCH (u:User {role: 'provider'})
            WHERE u.provider_status = 'approved'
              AND (
                toLower(coalesce(u.shop_name,'')) CONTAINS toLower($q)
                OR toLower(coalesce(u.shop_address,'')) CONTAINS toLower($q)
                OR toLower(coalesce(u.email,'')) CONTAINS toLower($q)
              )
            RETURN u { .id, .email, .contact_number, .shop_name, .shop_address, .is_available } AS provider
            ORDER BY u.shop_name
            """,
            q=term,
        )
        return [r["provider"] for r in result]

@router.patch("/me", response_model=UserPublic)
def update_profile(payload: dict, current_user: UserPublic = Depends(get_current_user)):
    allowed = {}
    if current_user.role == UserRole.customer:
        # Customer editable fields
        for f in ["full_name", "contact_number", "address"]:
            if f in payload and payload[f] is not None:
                allowed[f] = payload[f]
    elif current_user.role == UserRole.provider:
        # Provider editable fields
        for f in ["shop_name", "contact_number", "shop_address"]:
            if f in payload and payload[f] is not None:
                allowed[f] = payload[f]
    else:
        # admin can update nothing for now
        allowed = {}
    if not allowed:
        # Return current state
        return current_user
    with get_session() as session:
        rec = session.run(
            """
            MATCH (u:User {id: $id})
            SET u += $updates
            RETURN u { .id, .role, .email, .contact_number, .full_name, .address, .shop_name, .shop_address, .provider_status, .banned, .is_available } AS user
            """,
            id=current_user.id,
            updates=allowed,
        ).single()
        return UserPublic(**rec["user"]) if rec else current_user

@router.post("/change_password")
def change_password(payload: ChangePasswordRequest, current_user: UserPublic = Depends(get_current_user)):
    if current_user.id == "admin":
        raise HTTPException(status_code=400, detail="Admin password cannot be changed here")
    with get_session() as session:
        rec = session.run("MATCH (u:User {id: $id}) RETURN u.hashed_password AS hp", id=current_user.id).single()
        if not rec or not rec["hp"]:
            raise HTTPException(status_code=404, detail="User not found")
        if not verify_password(payload.current_password, rec["hp"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        new_hp = get_password_hash(payload.new_password)
        session.run("MATCH (u:User {id: $id}) SET u.hashed_password = $hp", id=current_user.id, hp=new_hp)
    return {"detail": "password_changed"}

@router.post("/toggle_availability")
def toggle_availability(current_user: UserPublic = Depends(get_current_user)):
    """Provider endpoint to toggle shop availability (open/closed)"""
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can toggle availability")
    with get_session() as session:
        rec = session.run(
            """
            MATCH (u:User {id: $id})
            SET u.is_available = NOT coalesce(u.is_available, true)
            RETURN u.is_available AS is_available
            """,
            id=current_user.id
        ).single()
        return {"is_available": rec["is_available"] if rec else True}
