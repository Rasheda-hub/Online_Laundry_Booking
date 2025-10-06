from fastapi import FastAPI
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

# Serve static files - Mount both assets and static directories
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
def startup_event():
    # Proactively verify Neo4j connectivity at startup for clear errors
    try:
        get_driver().verify_connectivity()
    except Exception as e:
        # Re-raise so the app fails fast with a clear log
        raise

# Serve the main React page
@app.get("/")
async def root():
    return FileResponse("static/index.html")

# Catch-all route for React Router
@app.get("/{path_name:path}")
async def catch_all(path_name: str):
    return FileResponse("static/index.html")

@app.on_event("shutdown")
def shutdown_event():
    close_driver()