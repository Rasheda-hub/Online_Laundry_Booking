# Email Verification Setup Guide

This application now requires users to verify their email addresses before they can log in and use the system.

## 🔐 How It Works

1. **User Registration**: When a user signs up (customer or provider), their account is created with `email_verified: false`
2. **Verification Email**: A verification email is automatically sent to their email address
3. **Email Verification**: User clicks the link in the email to verify their account
4. **Login Access**: Only after verification can users log in to the application

## 📧 Email Configuration

### For Development (No Email Server Required)

If you don't configure email settings, the system will run in **development mode**:
- Verification links will be printed to the console/terminal
- You can copy the link from the console and paste it in your browser
- No actual emails will be sent

### For Production (Gmail Example)

To send actual verification emails, configure these environment variables in your backend `.env` file:

```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_FROM=noreply@laundryapp.com
MAIL_FROM_NAME=LaundryApp
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

#### Setting Up Gmail App Password

1. Enable 2-Factor Authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new App Password for "Mail"
4. Copy the 16-character password
5. Use this password in `MAIL_PASSWORD` (not your regular Gmail password)

### Other Email Providers

For other SMTP providers, adjust these settings:

**Outlook/Hotmail:**
```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
```

**SendGrid:**
```env
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```env
MAIL_SERVER=smtp.mailgun.org
MAIL_PORT=587
```

## 🚀 Installation

1. Install the new dependency:
```bash
pip install fastapi-mail==1.4.1
```

Or install all dependencies:
```bash
pip install -r backend/requirements.txt
```

2. Configure your `.env` file (see above)

3. Restart your backend server

## 📱 User Flow

### Registration Flow
1. User fills out registration form
2. Account is created with `email_verified: false`
3. Verification email is sent
4. User is redirected to "Check Your Email" page
5. User clicks verification link in email
6. Email is verified (`email_verified: true`)
7. User can now log in

### Login Flow
1. User enters email and password
2. System checks if email is verified
3. If not verified: Error message with link to resend verification email
4. If verified: User is logged in successfully

## 🔗 API Endpoints

### Verify Email
```
GET /users/verify-email?token={verification_token}
```
Verifies the user's email address using the token from the email link.

### Resend Verification Email
```
POST /users/resend-verification?email={user_email}
```
Sends a new verification email to the user.

## 🎨 Frontend Pages

- `/verify-email-notice` - Shows after registration, prompts user to check email
- `/verify-email` - Handles the verification link from email
- Updated `/login` - Shows helpful message if email not verified
- Updated `/register` - Redirects to verification notice after signup

## 🔧 Testing

### Development Mode (No Email Server)
1. Register a new account
2. Check your backend console/terminal
3. Copy the verification URL printed in the console
4. Paste it in your browser
5. Your email will be verified

### Production Mode (With Email Server)
1. Register a new account with a real email
2. Check your email inbox (and spam folder)
3. Click the verification link
4. You'll be redirected to the success page

## ⚠️ Important Notes

- **Admin Account**: The hardcoded admin account (`admin@laundry.com`) bypasses email verification
- **OAuth Users**: Users who sign up via Google OAuth should be automatically verified (you may want to set `email_verified: true` in the OAuth callback)
- **Token Expiry**: Verification tokens expire after 24 hours
- **Existing Users**: Users created before this feature will need their `email_verified` field set to `true` manually in the database

## 🗄️ Database Migration

For existing users in your database, run this Cypher query in Neo4j:

```cypher
MATCH (u:User)
WHERE u.email_verified IS NULL
SET u.email_verified = true
```

This sets all existing users as verified so they can continue logging in.

## 🐛 Troubleshooting

**Problem**: Verification emails not sending
- **Solution**: Check your email credentials in `.env`
- **Solution**: Check console for error messages
- **Solution**: Verify your email provider's SMTP settings

**Problem**: "Invalid or expired verification token"
- **Solution**: Token may have expired (24 hours), request a new verification email
- **Solution**: Check that JWT_SECRET in `.env` hasn't changed

**Problem**: Can't log in after registration
- **Solution**: Check your email for the verification link
- **Solution**: Check spam folder
- **Solution**: Use "Resend verification email" button

## 📝 Security Considerations

- Verification tokens are JWT tokens signed with your `JWT_SECRET`
- Tokens expire after 24 hours for security
- Email verification prevents spam accounts
- Users cannot access the system until verified
- App passwords are more secure than regular passwords for email
