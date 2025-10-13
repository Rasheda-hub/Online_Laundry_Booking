# OAuth Login Setup Guide (Google & Facebook)

## Overview
This guide will help you set up Google and Facebook OAuth login for your LaundryApp.

---

## 🔧 What Was Added

### Backend:
1. **New dependencies** (`requirements.txt`):
   - `httpx==0.27.0` - HTTP client for API calls
   - `authlib==1.3.0` - OAuth library

2. **New file** (`backend/oauth.py`):
   - Google OAuth endpoints
   - Facebook OAuth endpoints
   - Auto-create customer accounts from OAuth

3. **Updated** (`backend/config.py`):
   - OAuth client credentials
   - Frontend/backend URLs for redirects

4. **Updated** (`backend/main.py`):
   - Registered OAuth router

### Frontend:
1. **New page** (`frontend-react/src/pages/OAuthCallback.jsx`):
   - Handles OAuth redirect
   - Processes JWT token

2. **Updated** (`frontend-react/src/pages/Login.jsx`):
   - Added Google login button
   - Added Facebook login button

3. **Updated** (`frontend-react/src/App.jsx`):
   - Added `/oauth/callback` route

---

## 📋 Step 1: Install Backend Dependencies

```powershell
cd c:\Users\Jiji\Desktop\LaundryApp3\backend
pip install httpx==0.27.0 authlib==1.3.0
```

---

## 🔑 Step 2: Get Google OAuth Credentials

### A. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**

### B. Create OAuth 2.0 Client ID
1. Click **Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `LaundryApp`
4. **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - `https://your-frontend-url.com` (production)

5. **Authorized redirect URIs**:
   - `http://localhost:8000/oauth/google/callback` (development)
   - `https://your-backend-url.com/oauth/google/callback` (production)

6. Click **Create**
7. Copy **Client ID** and **Client Secret**

---

## 📘 Step 3: Get Facebook OAuth Credentials

### A. Go to Facebook Developers
1. Visit: https://developers.facebook.com/
2. Click **My Apps** → **Create App**
3. Select **Consumer** → **Next**
4. App name: `LaundryApp`
5. Click **Create App**

### B. Set up Facebook Login
1. In your app dashboard, click **Add Product**
2. Find **Facebook Login** → Click **Set Up**
3. Select **Web** platform
4. Site URL: `http://localhost:5173` (development)

### C. Configure OAuth Settings
1. Go to **Facebook Login** → **Settings**
2. **Valid OAuth Redirect URIs**:
   - `http://localhost:8000/oauth/facebook/callback` (development)
   - `https://your-backend-url.com/oauth/facebook/callback` (production)

3. Save changes

### D. Get Credentials
1. Go to **Settings** → **Basic**
2. Copy **App ID** (this is your Client ID)
3. Copy **App Secret** (this is your Client Secret)

---

## 🔐 Step 4: Configure Environment Variables

Create or update `.env` file in the `backend/` directory:

```env
# Existing variables
JWT_SECRET=your-secret-key-here
NEO4J_URI=your-neo4j-uri
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# URLs (Development)
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# URLs (Production - update these when deploying)
# BACKEND_URL=https://your-backend-url.com
# FRONTEND_URL=https://your-frontend-url.com
```

---

## 🚀 Step 5: Update Frontend URLs (Production)

When deploying to production, update the OAuth button URLs in `Login.jsx`:

```javascript
// Development
onClick={() => window.location.href = 'http://localhost:8000/oauth/google/login'}

// Production (replace with your actual backend URL)
onClick={() => window.location.href = 'https://your-backend-url.com/oauth/google/login'}
```

Or better, create an environment variable:

```javascript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

onClick={() => window.location.href = `${BACKEND_URL}/oauth/google/login`}
```

---

## 🧪 Step 6: Test OAuth Login

### Start Backend:
```powershell
cd c:\Users\Jiji\Desktop\LaundryApp3\backend
uvicorn main:app --reload
```

### Start Frontend:
```powershell
cd c:\Users\Jiji\Desktop\LaundryApp3\frontend-react
npm run dev
```

### Test Flow:
1. Go to `http://localhost:5173/login`
2. Click **Sign in with Google** or **Sign in with Facebook**
3. Authorize the app
4. You should be redirected back and logged in
5. Check that a new customer account was created

---

## 🔄 How OAuth Flow Works

```
1. User clicks "Sign in with Google/Facebook"
   ↓
2. Redirected to Google/Facebook login page
   ↓
3. User authorizes the app
   ↓
4. Google/Facebook redirects to: /oauth/google/callback or /oauth/facebook/callback
   ↓
5. Backend receives authorization code
   ↓
6. Backend exchanges code for access token
   ↓
7. Backend fetches user info (email, name)
   ↓
8. Backend checks if user exists in database
   ↓
9. If not exists: Create new customer account
   ↓
10. Backend generates JWT token
   ↓
11. Backend redirects to: /oauth/callback?token=<jwt>&provider=google
   ↓
12. Frontend OAuthCallback page receives token
   ↓
13. Frontend stores token in localStorage
   ↓
14. Frontend redirects to customer dashboard
```

---

## 📊 Database Changes

OAuth users are created with these fields:

```javascript
{
  id: "uuid",
  role: "customer",
  email: "user@gmail.com",
  contact_number: "Not provided",
  full_name: "John Doe",
  address: "Not provided",
  banned: false,
  oauth_provider: "google" or "facebook",
  oauth_id: "google-user-id" or "facebook-user-id"
}
```

**Note**: OAuth users don't have a password (no `hashed_password` field).

---

## 🛡️ Security Features

1. **Auto-create customer accounts only** - OAuth users are created as customers, not providers
2. **Email verification** - Google/Facebook already verified the email
3. **JWT tokens** - Same authentication system as regular login
4. **Banned user check** - OAuth login respects ban status
5. **No password required** - OAuth users can't use regular login (no password set)

---

## ⚠️ Important Notes

### For Development:
- Use `http://localhost:8000` and `http://localhost:5173`
- OAuth providers require exact URL matches

### For Production:
1. Update redirect URIs in Google/Facebook consoles
2. Update `.env` with production URLs
3. Update frontend OAuth button URLs
4. Use HTTPS (required by OAuth providers)

### Facebook App Review:
- For production, you need to submit your app for review
- During development, only test users can login
- Add test users in Facebook App Dashboard → Roles → Test Users

### Google OAuth Consent Screen:
- Configure consent screen in Google Cloud Console
- Add logo, privacy policy, terms of service
- For production, submit for verification

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that redirect URI in code matches exactly what's in Google/Facebook console
- Include `http://` or `https://`
- No trailing slashes

### Error: "invalid_client"
- Check Client ID and Client Secret in `.env`
- Make sure no extra spaces

### Error: "Email not provided by Facebook"
- User declined email permission
- Check Facebook app permissions

### OAuth button doesn't work:
- Check backend is running on port 8000
- Check CORS settings in `main.py`
- Check browser console for errors

### User created but can't login with email/password:
- OAuth users don't have passwords
- They must always use OAuth to login
- To enable email/password login, they need to set a password (future feature)

---

## 🎯 Future Enhancements

1. **Link OAuth to existing accounts**
   - Allow users to link Google/Facebook to existing email/password account

2. **Provider OAuth registration**
   - Allow providers to register via OAuth
   - Require additional shop information after OAuth

3. **Multiple OAuth providers per account**
   - Link both Google and Facebook to same account

4. **Password reset for OAuth users**
   - Allow OAuth users to set a password for email/password login

5. **Profile completion**
   - Prompt OAuth users to complete profile (phone, address)

---

## ✅ Testing Checklist

- [ ] Backend dependencies installed
- [ ] Google OAuth credentials obtained
- [ ] Facebook OAuth credentials obtained
- [ ] `.env` file configured
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Google login button appears on login page
- [ ] Facebook login button appears on login page
- [ ] Google login works and creates account
- [ ] Facebook login works and creates account
- [ ] User is redirected to customer dashboard
- [ ] User info is displayed correctly
- [ ] Logout works
- [ ] Re-login with OAuth works
- [ ] Banned user cannot login via OAuth

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs for errors
3. Verify OAuth credentials are correct
4. Ensure redirect URIs match exactly
5. Test with a different browser/incognito mode

---

**Status**: ✅ OAuth Login Implementation Complete!
