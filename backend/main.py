from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from db import close_driver, get_driver
from auth import router as auth_router
from users import router as users_router
from services import router as services_router
from orders import router as orders_router
from notifications import router as notifications_router
from receipts import router as receipts_router
from routes.admin import router as admin_router
from routes.bookings import router as bookings_router
from routes.categories import router as categories_router
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(services_router)
app.include_router(orders_router)
app.include_router(receipts_router)
app.include_router(bookings_router)
app.include_router(admin_router)
app.include_router(categories_router)
app.include_router(notifications_router)

@app.on_event("startup")
def startup_event():
    # Proactively verify Neo4j connectivity at startup for clear errors
    try:
        get_driver().verify_connectivity()
    except Exception as e:
        # Re-raise so the app fails fast with a clear log
        raise

@app.get("/")
def root():
    return {"message": "LaundryApp API is running"}

@app.on_event("shutdown")
def shutdown_event():
    close_driver()
