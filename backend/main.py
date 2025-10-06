from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
import os

load_dotenv()
app = FastAPI(title=settings.app_name)

# CORS for local development (when running React dev server separately)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your API routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(services_router)
app.include_router(orders_router)
app.include_router(receipts_router)
app.include_router(bookings_router)
app.include_router(admin_router)
app.include_router(categories_router)
app.include_router(notifications_router)

# Serve static files (React build)
try:
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
except RuntimeError:
    pass  # Directory doesn't exist yet (dev mode)

try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
except RuntimeError:
    pass  # Directory doesn't exist yet (dev mode)

@app.on_event("startup")
def startup_event():
    # Proactively verify Neo4j connectivity at startup for clear errors
    try:
        get_driver().verify_connectivity()
    except Exception as e:
        # Re-raise so the app fails fast with a clear log
        raise

# Serve the main React page (only if static files exist)
@app.get("/")
async def root():
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "API is running. Build frontend and place in static/ folder."}

# Catch-all route for React Router (must be last, only for non-API routes)
@app.get("/{path_name:path}")
async def catch_all(path_name: str, request: Request):
    # Don't catch API routes - let them 404 properly
    if path_name.startswith(("auth/", "users/", "services/", "orders/", "receipts/", "bookings/", "admin/", "categories/", "notifications/", "docs", "openapi.json")):
        return {"detail": "Not found"}
    
    # Serve React app for all other routes
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "API is running. Build frontend and place in static/ folder."}

@app.on_event("shutdown")
def shutdown_event():
    close_driver()