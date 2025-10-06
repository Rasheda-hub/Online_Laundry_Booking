from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from config import settings
from db import get_driver, get_session
from neo4j.exceptions import ServiceUnavailable
from models import Token, LoginRequest, UserPublic, UserRole, ProviderStatus

router = APIRouter(prefix="/auth", tags=["auth"])

# Use PBKDF2-SHA256 to avoid bcrypt backend issues on some Windows setups
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_minutes: int = settings.jwt_exp_minutes) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_user_by_email(email: str) -> Optional[UserPublic]:
    # minimal retry for transient Aura connection resets
    attempts = 0
    while True:
        try:
            with get_session() as session:
                result = session.run(
                    """
                    MATCH (u:User {email: $email})
                    RETURN u { .id, .role, .email, .contact_number,
                               .full_name, .address, .shop_name, .shop_address,
                               .provider_status, .banned,
                               hashed_password: u.hashed_password } AS user
                    """,
                    email=email,
                )
                rec = result.single()
                break
        except ServiceUnavailable:
            attempts += 1
            if attempts >= 2:
                raise
            continue
    if not rec:
        return None
    u = rec["user"]
    public = UserPublic(
        id=u.get("id"),
        role=u.get("role"),
        email=u.get("email"),
        contact_number=u.get("contact_number"),
        full_name=u.get("full_name"),
        address=u.get("address"),
        shop_name=u.get("shop_name"),
        shop_address=u.get("shop_address"),
        provider_status=u.get("provider_status"),
        banned=u.get("banned"),
    )
    return public


def get_current_user(token: str = Depends(oauth2_scheme)) -> UserPublic:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Hardcoded admin shortcut
    if user_id == "admin":
        return UserPublic(
            id="admin",
            role=UserRole.admin,
            email="admin@laundry.com",
            contact_number="N/A",
        )
    with get_session() as session:
        rec = session.run(
            "MATCH (u:User {id: $id}) RETURN u { .id, .role, .email, .contact_number, .full_name, .address, .shop_name, .shop_address, .provider_status, .banned } AS user",
            id=user_id,
        ).single()
        if not rec:
            raise credentials_exception
        u = rec["user"]
        return UserPublic(**u)


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # OAuth2PasswordRequestForm expects username, password
    email = form_data.username
    # Hardcoded admin auth
    if email == "admin@laundry.com" and form_data.password == "admin123":
        access_token = create_access_token({"sub": "admin", "role": UserRole.admin})
        return Token(access_token=access_token)
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if getattr(user, "banned", False):
        raise HTTPException(status_code=403, detail="User is banned")

    # fetch hashed password separately
    with get_session() as session:
        hp = session.run("MATCH (u:User {id: $id}) RETURN u.hashed_password AS hp", id=user.id).single()
        hashed_password = hp["hp"] if hp else None
    if not hashed_password or not verify_password(form_data.password, hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = create_access_token({"sub": user.id, "role": user.role})
    return Token(access_token=access_token)


@router.get("/me", response_model=UserPublic)
def me(current_user: UserPublic = Depends(get_current_user)):
    return current_user

# Optional JSON-based login for clients sending JSON instead of form-url-encoded
@router.post("/login_json", response_model=Token)
def login_json(payload: LoginRequest):
    # payload has email & password
    if payload.email == "admin@laundry.com" and payload.password == "admin123":
        access_token = create_access_token({"sub": "admin", "role": UserRole.admin})
        return Token(access_token=access_token)
    user = get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if getattr(user, "banned", False):
        raise HTTPException(status_code=403, detail="User is banned")
    with get_session() as session:
        hp = session.run("MATCH (u:User {id: $id}) RETURN u.hashed_password AS hp", id=user.id).single()
        hashed_password = hp["hp"] if hp else None
    if not hashed_password or not verify_password(payload.password, hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token({"sub": user.id, "role": user.role})
    return Token(access_token=access_token)
