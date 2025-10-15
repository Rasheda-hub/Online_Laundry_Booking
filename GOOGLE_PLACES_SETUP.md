# Google Places API Setup Guide

The address autocomplete feature uses Google Places API for accurate Philippine address suggestions.

## Setup Instructions

### 1. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Places API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### 2. Restrict API Key (Recommended)

For security, restrict your API key:

1. Click on your API key in the Credentials page
2. Under "API restrictions":
   - Select "Restrict key"
   - Choose "Places API"
3. Under "Application restrictions":
   - For development: Choose "None" or "HTTP referrers" with your localhost
   - For production: Add your domain

### 3. Configure Backend

Add your API key to the backend environment:

**Option A: Using .env file (Recommended)**

Create or edit `.env` file in the `backend` directory:

```env
GOOGLE_PLACES_API_KEY=your_api_key_here
```

**Option B: Using environment variable**

Windows (PowerShell):
```powershell
$env:GOOGLE_PLACES_API_KEY="your_api_key_here"
```

Linux/Mac:
```bash
export GOOGLE_PLACES_API_KEY="your_api_key_here"
```

### 4. Install Required Python Package

The backend needs `httpx` for making HTTP requests:

```bash
cd backend
pip install httpx
```

Or add to `requirements.txt`:
```
httpx>=0.24.0
```

### 5. Restart Backend Server

After setting the API key, restart your FastAPI backend:

```bash
cd backend
uvicorn main:app --reload
```

## How It Works

1. User types address in signup form
2. Frontend sends request to `/places/autocomplete` endpoint
3. Backend proxies request to Google Places API (prevents CORS issues)
4. Results are filtered for Philippine addresses only
5. User selects from dropdown suggestions

## Pricing

- **Free tier**: 
  - First $200/month credit (covers ~28,000 autocomplete requests)
  - After that: $2.83 per 1,000 requests

- **Session tokens**: 
  - We use session tokens to optimize billing
  - Autocomplete + Place Details = charged as single request

## Testing

1. Start backend server
2. Go to signup page
3. Type at least 3 characters in address field
4. You should see Philippine address suggestions

## Troubleshooting

**"Google Places API key not configured"**
- Make sure `GOOGLE_PLACES_API_KEY` is set in backend `.env` file
- Restart the backend server after adding the key

**"Failed to fetch addresses"**
- Check if Places API is enabled in Google Cloud Console
- Verify API key is correct
- Check API key restrictions

**CORS errors**
- The backend proxy should handle CORS automatically
- Make sure you're calling `/places/autocomplete` not the Google API directly

## Alternative: Free Option

If you don't want to use Google Places API, the component can fall back to OpenStreetMap (free but less accurate). Just don't set the `GOOGLE_PLACES_API_KEY` environment variable.
