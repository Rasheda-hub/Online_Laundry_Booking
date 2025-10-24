# Quick Start: Email Verification

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd backend
pip install fastapi-mail==1.4.1
```

### Step 2: Choose Your Mode

#### Option A: Development Mode (Easiest - No Email Setup)
Just start your backend server. Verification links will print to the console.

```bash
# Start backend
cd backend
python main.py

# When users register, you'll see output like:
# ============================================================
# EMAIL VERIFICATION (Development Mode)
# ============================================================
# To: user@example.com
# Verification URL: http://localhost:5173/verify-email?token=...
# ============================================================
```

Copy the URL and paste it in your browser to verify accounts.

#### Option B: Production Mode (Send Real Emails)

1. **For Gmail Users:**
   - Enable 2-Factor Authentication on your Google account
   - Go to https://myaccount.google.com/apppasswords
   - Generate an App Password for "Mail"
   - Add to `backend/.env`:

```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM=noreply@laundryapp.com
MAIL_FROM_NAME=LaundryApp
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

2. **For Other Email Providers:**
   See `EMAIL_VERIFICATION_SETUP.md` for Outlook, SendGrid, Mailgun configurations.

### Step 3: Update Existing Users (If Any)

If you have existing users in your database, they need to be marked as verified:

```cypher
// Run this in Neo4j Browser
MATCH (u:User)
WHERE u.email_verified IS NULL
SET u.email_verified = true
```

## ✅ That's It!

Your app now requires email verification for all new signups!

## 🧪 Test It Out

1. **Register a new account** at http://localhost:5173/register
2. **Check for verification link:**
   - Dev mode: Look in your backend console
   - Prod mode: Check your email inbox
3. **Click the verification link**
4. **Log in with your verified account**

## 🔍 What Changed?

- ✅ Users must verify email before logging in
- ✅ Verification emails sent automatically on signup
- ✅ Beautiful verification pages added
- ✅ Resend verification option available
- ✅ OAuth users (Google/Facebook) auto-verified
- ✅ Admin account bypasses verification

## 📚 Need More Info?

- **Full Setup Guide:** `EMAIL_VERIFICATION_SETUP.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Environment Variables:** `backend/.env.example`

## 🆘 Troubleshooting

**Can't log in after registering?**
→ Check your email (or console in dev mode) for verification link

**Not receiving emails?**
→ Check spam folder or verify your SMTP settings in `.env`

**"Invalid or expired token" error?**
→ Token expired (24 hours). Click "Resend verification email"

**Existing users can't log in?**
→ Run the Cypher query above to mark them as verified
