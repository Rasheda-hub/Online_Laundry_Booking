from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from config import settings
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_server,
    MAIL_FROM_NAME=settings.mail_from_name,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

def create_verification_token(email: str, expires_hours: int = 24) -> str:
    """Create a JWT token for email verification"""
    expire = datetime.utcnow() + timedelta(hours=expires_hours)
    to_encode = {"sub": email, "exp": expire, "type": "email_verification"}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def verify_verification_token(token: str) -> Optional[str]:
    """Verify and decode the email verification token"""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "email_verification":
            return None
        return email
    except Exception:
        return None

async def send_verification_email(email: str, token: str):
    """Send verification email to user"""
    verification_url = f"{settings.frontend_url}/verify-email?token={token}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4F46E5; margin: 0;">✨ LaundryApp</h1>
                </div>
                
                <div style="background-color: #f9fafb; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
                    <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>
                    <p style="font-size: 16px; color: #4b5563;">
                        Thank you for registering with LaundryApp! To complete your registration and start using our services, 
                        please verify your email address by clicking the button below.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_url}" 
                           style="background-color: #4F46E5; color: white; padding: 14px 28px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold; 
                                  display: inline-block; font-size: 16px;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                        Or copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background-color: #fff; 
                              padding: 10px; border-radius: 5px; border: 1px solid #e5e7eb;">
                        {verification_url}
                    </p>
                </div>
                
                <div style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">
                    <p>This verification link will expire in 24 hours.</p>
                    <p>If you didn't create an account with LaundryApp, please ignore this email.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    message = MessageSchema(
        subject="Verify Your Email - LaundryApp",
        recipients=[email],
        body=html_content,
        subtype=MessageType.html
    )
    
    # Only send email if credentials are configured
    if settings.mail_username and settings.mail_password:
        fm = FastMail(conf)
        await fm.send_message(message)
    else:
        # For development: print the verification URL
        print(f"\n{'='*60}")
        print(f"EMAIL VERIFICATION (Development Mode)")
        print(f"{'='*60}")
        print(f"To: {email}")
        print(f"Verification URL: {verification_url}")
        print(f"{'='*60}\n")
