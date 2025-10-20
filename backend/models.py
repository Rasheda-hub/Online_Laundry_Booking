from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    admin = "admin"
    customer = "customer"
    provider = "provider"

class UserBase(BaseModel):
    email: EmailStr
    contact_number: str = Field(..., pattern=r"^[0-9+\-()\s]{7,20}$")

class CustomerCreate(UserBase):
    full_name: str
    password: str
    address: str

class ProviderCreate(UserBase):
    shop_name: str
    password: str
    shop_address: str

class ProviderStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    banned = "banned"

class UserPublic(BaseModel):
    id: str
    role: UserRole
    email: EmailStr
    contact_number: str
    full_name: Optional[str] = None
    address: Optional[str] = None
    shop_name: Optional[str] = None
    shop_address: Optional[str] = None
    provider_status: Optional[ProviderStatus] = None
    banned: Optional[bool] = None
    is_available: Optional[bool] = None  # For providers to mark shop open/closed

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_per_kg: float = Field(..., ge=0)

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_kg: Optional[float] = Field(None, ge=0)

class ServicePublic(ServiceBase):
    id: str
    provider_id: str

# New: Category pricing model per provider/shop
class CategoryPricingType(str, Enum):
    fixed = "fixed"
    per_kilo = "per_kilo"

class CategoryBase(BaseModel):
    name: str
    pricing_type: CategoryPricingType
    price: float = Field(..., ge=0)
    min_kilo: Optional[float] = Field(None, ge=0)
    max_kilo: Optional[float] = Field(None, gt=0)

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    pricing_type: Optional[CategoryPricingType] = None
    price: Optional[float] = Field(None, ge=0)
    min_kilo: Optional[float] = Field(None, ge=0)
    max_kilo: Optional[float] = Field(None, gt=0)

class CategoryPublic(CategoryBase):
    id: str
    provider_id: str

class DeliveryOption(str, Enum):
    pickup_delivery = "pickup_delivery"
    dropoff = "dropoff"

class OrderItem(BaseModel):
    service_id: str
    weight_kg: float = Field(..., gt=0)

class OrderCreate(BaseModel):
    provider_id: str
    items: List[OrderItem]
    delivery_option: DeliveryOption
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    items: Optional[List[OrderItem]] = None
    delivery_option: Optional[DeliveryOption] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(pending|confirmed|completed|cancelled)$")

class OrderPublic(BaseModel):
    id: str
    customer_id: str
    provider_id: str
    provider_shop_name: Optional[str] = None
    provider_full_name: Optional[str] = None
    provider_address: Optional[str] = None
    provider_contact: Optional[str] = None
    items: List[OrderItem]
    delivery_option: DeliveryOption
    notes: Optional[str]
    status: str
    total_cost: float
    created_at: datetime

# Auth / security inputs
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# Booking domain (scheduling-based orders)
class BookingStatus(str, Enum):
    pending = "pending"  # Customer submitted, waiting for provider acceptance
    confirmed = "confirmed"  # Provider accepted, waiting for customer payment/delivery
    in_progress = "in_progress"  # Customer paid & delivered, laundry being processed
    ready = "ready"  # Laundry ready for pickup
    completed = "completed"  # Order completed
    rejected = "rejected"  # Provider rejected the booking

class BookingCreate(BaseModel):
    provider_id: str
    category_id: str
    weight_kg: float = Field(..., gt=0)
    # schedule_at will be set by server to now; optional from client
    schedule_at: Optional[datetime] = None
    notes: Optional[str] = None

class CartItem(BaseModel):
    category_id: str
    weight_kg: float = Field(..., gt=0)

class CartBookingCreate(BaseModel):
    provider_id: str
    items: List[CartItem]
    schedule_at: Optional[datetime] = None
    notes: Optional[str] = None

class BookingUpdateStatus(BaseModel):
    status: BookingStatus

class BookingUpdateDetails(BaseModel):
    weight_kg: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = None

class BookingPublic(BaseModel):
    id: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_contact: Optional[str] = None
    provider_id: str
    provider_shop_name: Optional[str] = None
    provider_full_name: Optional[str] = None
    provider_address: Optional[str] = None
    provider_contact: Optional[str] = None
    category_id: str
    category_name: str
    pricing_type: CategoryPricingType
    weight_kg: float
    total_price: float
    schedule_at: datetime
    status: BookingStatus
    notes: Optional[str] = None
    created_at: datetime

class BookingLineItem(BaseModel):
    category_id: str
    category_name: str
    pricing_type: CategoryPricingType
    weight_kg: float
    price_per_unit: float
    subtotal: float

class GroupedBookingPublic(BaseModel):
    id: str
    customer_id: str
    provider_id: str
    provider_name: Optional[str] = None
    items: List[BookingLineItem]
    total_amount: float
    schedule_at: datetime
    status: BookingStatus
    notes: Optional[str] = None
    created_at: datetime

class ReceiptPublic(BaseModel):
    id: str
    order_id: str
    customer_id: str
    provider_id: str
    # Optional enriched fields for provider/customer visibility
    customer_name: Optional[str] = None
    customer_contact: Optional[str] = None
    provider_name: Optional[str] = None
    items: Optional[list[dict]] = None
    subtotal: float
    delivery_fee: float
    total: float
    created_at: datetime

# Reviews
class ReviewCreate(BaseModel):
    provider_id: str
    booking_id: str
    rating: int = Field(..., ge=1, le=5)  # 1-5 stars
    comment: Optional[str] = None

class ReviewPublic(BaseModel):
    id: str
    provider_id: str
    customer_id: str
    customer_name: Optional[str] = None
    booking_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime
