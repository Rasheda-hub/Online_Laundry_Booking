# Quick OAuth Setup Guide

## 📋 Step 1: Copy the Environment File

```powershell
cd c:\Users\Jiji\Desktop\LaundryApp3\backend
copy .env.example .env
```

Then edit `.env` file and fill in your credentials.

---

## 🔑 Step 2: Get Google OAuth Credentials (5 minutes)

### A. Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Click **Select a project** → **New Project**
3. Project name: `LaundryApp` → Click **Create**

### B. Enable Google+ API
1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

### C. Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Configure Consent Screen**
   - User Type: **External** → Click **Create**
   - App name: `LaundryApp`
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** (skip scopes)
   - Click **Save and Continue** (skip test users)
   - Click **Back to Dashboard**

3. Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `LaundryApp Web Client`
   
4. **Authorized JavaScript origins**:
   - Click **Add URI**
   - Enter: `http://localhost:5173`
   
5. **Authorized redirect URIs**:
   - Click **Add URI**
   - Enter: `http://localhost:8000/oauth/google/callback`
   
6. Click **Create**

7. **Copy the credentials:**
   - Copy **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - Copy **Client secret** (looks like: `GOCSPX-abc123`)

8. **Paste into `.env` file:**
   ```env
   GOOGLE_CLIENT_ID=paste-your-client-id-here
   GOOGLE_CLIENT_SECRET=paste-your-client-secret-here
   ```

---

## 📘 Step 3: Get Facebook OAuth Credentials (5 minutes)

### A. Create Facebook App
1. Open: https://developers.facebook.com/
2. Click **My Apps** → **Create App**
3. Select **Consumer** → Click **Next**
4. App Display Name: `LaundryApp`
5. App Contact Email: Your email
6. Click **Create App**

### B. Set up Facebook Login
1. In the dashboard, find **Facebook Login** → Click **Set Up**
2. Select **Web** platform
3. Site URL: `http://localhost:5173`
4. Click **Save** → **Continue**

### C. Configure OAuth Settings
1. In left sidebar: **Facebook Login** → **Settings**
2. **Valid OAuth Redirect URIs**:
   - Enter: `http://localhost:8000/oauth/facebook/callback`
3. Click **Save Changes**

### D. Get App Credentials
1. Go to **Settings** → **Basic**
2. **Copy the credentials:**
   - Copy **App ID** (this is your Client ID)
   - Click **Show** next to App Secret
   - Copy **App Secret** (this is your Client Secret)

3. **Paste into `.env` file:**
   ```env
   FACEBOOK_CLIENT_ID=paste-your-app-id-here
   FACEBOOK_CLIENT_SECRET=paste-your-app-secret-here
   ```

### E. Add Test Users (Important!)
Since your app is in development mode, only test users can login.

1. Go to **Roles** → **Test Users**
2. Click **Add** → Create test users
3. Use these test accounts to login during development

**OR** add yourself as a test user:
1. Go to **Roles** → **Roles**
2. Add your Facebook account as a **Developer** or **Tester**

---

## ✅ Step 4: Verify Your .env File

Your `.env` file should look like this:

```env
# JWT Settings
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXP_MINUTES=60

# Neo4j Database (your existing values)
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-actual-password
NEO4J_DATABASE=neo4j

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# OAuth - Google (paste your actual values)
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz

# OAuth - Facebook (paste your actual values)
FACEBOOK_CLIENT_ID=1234567890123456
FACEBOOK_CLIENT_SECRET=abcdef1234567890abcdef1234567890

# URLs for OAuth redirects
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

---

## 🚀 Step 5: Restart Backend Server

```powershell
cd c:\Users\Jiji\Desktop\LaundryApp3\backend
uvicorn main:app --reload
```

---

## 🧪 Step 6: Test OAuth Login

1. Go to: http://localhost:5173/login
2. Click **"Sign in with Google"**
   - You should be redirected to Google
   - Sign in with your Google account
   - Authorize the app
   - You should be redirected back and logged in!

3. Click **"Sign in with Facebook"**
   - You should be redirected to Facebook
   - Sign in with your Facebook test account
   - Authorize the app
   - You should be redirected back and logged in!

---

## ⚠️ Common Issues

### Google: "Error 400: redirect_uri_mismatch"
**Fix:** Make sure the redirect URI in Google Console exactly matches:
```
http://localhost:8000/oauth/google/callback
```
No trailing slash, exact match!

### Facebook: "URL Blocked"
**Fix:** 
1. Go to Facebook App Settings → Basic
2. Add `localhost` to **App Domains**
3. Make sure redirect URI is exactly: `http://localhost:8000/oauth/facebook/callback`

### Facebook: "This app is in development mode"
**Fix:** Add yourself as a test user:
1. Go to **Roles** → **Roles**
2. Add your Facebook account

### Backend Error: "invalid_client"
**Fix:** Double-check your Client ID and Client Secret in `.env` file

---

## 📝 Checklist

- [ ] Created `.env` file from `.env.example`
- [ ] Got Google Client ID and Secret
- [ ] Got Facebook App ID and Secret
- [ ] Pasted credentials into `.env` file
- [ ] Restarted backend server
- [ ] Tested Google login
- [ ] Tested Facebook login
- [ ] Both logins work successfully!

---

## 🎉 Success!

Once both OAuth logins work, you're all set! Users can now sign in with:
- ✅ Email & Password (existing)
- ✅ Google Account (new!)
- ✅ Facebook Account (new!)

---

## 📞 Need Help?

If you get stuck:
1. Check the browser console for errors
2. Check backend terminal for error messages
3. Verify redirect URIs match exactly
4. Make sure you're using test users for Facebook
5. Try in incognito/private browsing mode

---

**Estimated Setup Time:** 10-15 minutes total
