from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from config import settings
from db import get_session
from auth import create_access_token
from models import UserRole
import uuid
import httpx

router = APIRouter(prefix="/oauth", tags=["oauth"])

# Initialize OAuth
oauth = OAuth()

# Google OAuth Configuration
oauth.register(
    name='google',
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# Facebook OAuth Configuration
oauth.register(
    name='facebook',
    client_id=settings.facebook_client_id,
    client_secret=settings.facebook_client_secret,
    authorize_url='https://www.facebook.com/v18.0/dialog/oauth',
    access_token_url='https://graph.facebook.com/v18.0/oauth/access_token',
    client_kwargs={'scope': 'email public_profile'}
)


def get_or_create_oauth_user(email: str, full_name: str, provider: str, provider_id: str):
    """Get existing user or create new customer account from OAuth"""
    with get_session() as session:
        # Check if user exists
        result = session.run(
            """
            MATCH (u:User {email: $email})
            RETURN u { .id, .role, .email, .contact_number, .full_name, .address, 
                      .shop_name, .shop_address, .provider_status, .banned, .is_available } AS user
            """,
            email=email
        ).single()
        
        if result:
            # User exists, return their info
            return result["user"]
        
        # Create new customer account
        user_id = str(uuid.uuid4())
        session.run(
            """
            CREATE (u:User {
                id: $id,
                role: 'customer',
                email: $email,
                contact_number: 'Not provided',
                full_name: $full_name,
                address: 'Not provided',
                banned: false,
                email_verified: true,
                oauth_provider: $provider,
                oauth_id: $provider_id
            })
            RETURN u
            """,
            id=user_id,
            email=email,
            full_name=full_name,
            provider=provider,
            provider_id=provider_id
        )
        
        return {
            "id": user_id,
            "role": "customer",
            "email": email,
            "contact_number": "Not provided",
            "full_name": full_name,
            "address": "Not provided",
            "banned": False
        }


@router.get("/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    redirect_uri = f"{settings.backend_url}/oauth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request):
    """Handle Google OAuth callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
        
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        google_id = user_info.get('sub')
        
        # Get or create user
        user = get_or_create_oauth_user(email, name, 'google', google_id)
        
        # Check if banned
        if user.get('banned'):
            return RedirectResponse(
                url=f"{settings.frontend_url}/login?error=User is banned",
                status_code=302
            )
        
        # Create JWT token
        access_token = create_access_token({"sub": user['id'], "role": user['role']})
        
        # Redirect to frontend with token
        return RedirectResponse(
            url=f"{settings.frontend_url}/oauth/callback?token={access_token}&provider=google",
            status_code=302
        )
        
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error={str(e)}",
            status_code=302
        )


@router.get("/facebook/login")
async def facebook_login(request: Request):
    """Initiate Facebook OAuth login"""
    redirect_uri = f"{settings.backend_url}/oauth/facebook/callback"
    return await oauth.facebook.authorize_redirect(request, redirect_uri)


@router.get("/facebook/callback")
async def facebook_callback(request: Request):
    """Handle Facebook OAuth callback"""
    try:
        token = await oauth.facebook.authorize_access_token(request)
        
        # Get user info from Facebook Graph API
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                'https://graph.facebook.com/me',
                params={
                    'fields': 'id,name,email',
                    'access_token': token['access_token']
                }
            )
            user_info = resp.json()
        
        if not user_info.get('email'):
            raise HTTPException(status_code=400, detail="Email not provided by Facebook")
        
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        facebook_id = user_info.get('id')
        
        # Get or create user
        user = get_or_create_oauth_user(email, name, 'facebook', facebook_id)
        
        # Check if banned
        if user.get('banned'):
            return RedirectResponse(
                url=f"{settings.frontend_url}/login?error=User is banned",
                status_code=302
            )
        
        # Create JWT token
        access_token = create_access_token({"sub": user['id'], "role": user['role']})
        
        # Redirect to frontend with token
        return RedirectResponse(
            url=f"{settings.frontend_url}/oauth/callback?token={access_token}&provider=facebook",
            status_code=302
        )
        
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error={str(e)}",
            status_code=302
        )
