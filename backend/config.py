import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

def _get_list_env(name: str, default: List[str] | None = None) -> List[str]:
    val = os.getenv(name)
    if not val:
        return default or []
    # Accept JSON-like list or comma-separated
    v = val.strip()
    if v.startswith("[") and v.endswith("]"):
        # naive split for simple lists
        v = v[1:-1]
    return [s.strip().strip('"\'') for s in v.split(',') if s.strip()]

class Settings(BaseModel):
    app_name: str = "LaundryApp API"
    # Support both JWT_SECRET and JWT_SECRET_KEY envs
    jwt_secret: str = os.getenv("JWT_SECRET") or os.getenv("JWT_SECRET_KEY", "changeme-super-secret")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    # Support both JWT_EXP_MINUTES and JWT_EXPIRATION_MINUTES
    jwt_exp_minutes: int = int(os.getenv("JWT_EXP_MINUTES") or os.getenv("JWT_EXPIRATION_MINUTES", "60"))

    # Neo4j: support both NEO4J_USER and NEO4J_USERNAME
    neo4j_uri: str = os.getenv("NEO4J_URI", "neo4j+s://<your-aura-uri>")
    neo4j_user: str = os.getenv("NEO4J_USER") or os.getenv("NEO4J_USERNAME", "neo4j")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD", "password")
    neo4j_database: str = os.getenv("NEO4J_DATABASE", "neo4j")

    cors_origins: List[str] = _get_list_env("CORS_ORIGINS", ["*"])
    
    # OAuth Settings
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    facebook_client_id: str = os.getenv("FACEBOOK_CLIENT_ID", "")
    facebook_client_secret: str = os.getenv("FACEBOOK_CLIENT_SECRET", "")
    
    # URLs for OAuth redirects
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

settings = Settings()
