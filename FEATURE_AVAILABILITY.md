# Shop Availability Feature

## Overview
Providers can now mark their shop as **Open** or **Closed** to let customers know if they're currently accepting bookings.

---

## What Changed

### Backend Changes

#### 1. **Database Model** (`backend/models.py`)
- Added `is_available: Optional[bool]` field to `UserPublic` model
- Defaults to `true` when provider registers

#### 2. **User Registration** (`backend/users.py`)
- New providers are created with `is_available: true` by default

#### 3. **New API Endpoint** (`backend/users.py`)
```python
POST /users/toggle_availability
```
- **Auth Required**: Yes (Provider only)
- **Description**: Toggles the provider's availability status (open ↔ closed)
- **Response**: `{"is_available": true/false}`

#### 4. **Updated Queries** (`backend/users.py`, `backend/auth.py`)
- All user queries now include `is_available` field
- Provider search results include availability status

---

### Frontend Changes

#### 1. **API Client** (`frontend-react/src/api/users.js`)
- Added `toggleAvailability(token)` function

#### 2. **Customer Dashboard** (`frontend-react/src/pages/customer/Dashboard.jsx`)
- **Visual Indicator**: Shows 🟢 Open or 🔴 Closed badge on each provider
- **Styling**: Closed shops appear slightly dimmed (60% opacity)
- **Color Coding**:
  - Open: Green badge
  - Closed: Red badge

#### 3. **Provider Dashboard** (`frontend-react/src/pages/provider/Dashboard.jsx`)
- **Toggle Button**: Large button at the top to change availability
- **Button States**:
  - When Open: Green button "🟢 Shop Open - Click to Close"
  - When Closed: Red button "🔴 Shop Closed - Click to Open"
- **Action**: Clicking toggles status and refreshes the page

---

## How It Works

### For Providers:
1. Log in to provider dashboard
2. See current status at the top (Open/Closed)
3. Click the button to toggle availability
4. Status updates immediately and customers see the change

### For Customers:
1. Browse providers on customer dashboard
2. See real-time availability status (🟢 Open / 🔴 Closed)
3. Can still select closed shops, but visual indicator shows they're closed
4. Closed shops appear dimmed to indicate unavailability

---

## Business Logic

### Default Behavior:
- New providers start as **Open** (`is_available: true`)
- Existing providers without this field are treated as **Open** (via `coalesce(u.is_available, true)`)

### Toggle Logic:
```cypher
SET u.is_available = NOT coalesce(u.is_available, true)
```
- If `is_available` is `true` → becomes `false`
- If `is_available` is `false` → becomes `true`
- If `is_available` is `null` → becomes `false`

### Booking Restrictions:
- ✅ **Implemented**: Customers cannot book from closed shops
- Backend validation: Returns 400 error if shop is closed
- Frontend prevention: "Book Now" button disabled for closed shops
- Warning message displayed when viewing closed shop's categories

---

## UI/UX Details

### Customer View:

**Provider List:**
```
┌─────────────────────────────────┐
│  🏪 Clean Laundry Shop    🟢 Open │
│  📍 123 Main St                  │
│  📞 09XX XXX XXXX                │
└─────────────────────────────────┘

┌─────────────────────────────────┐ (dimmed 60%)
│  🏪 Quick Wash Shop    🔴 Closed │
│  📍 456 Oak Ave                  │
│  📞 09YY YYY YYYY                │
└─────────────────────────────────┘
```

**When Closed Shop Selected:**
```
┌────────────────────────────────────────────┐
│  ⚠️ Shop Currently Closed                  │
│  This shop is not accepting bookings at    │
│  the moment. Please check back later or    │
│  choose another provider.                  │
└────────────────────────────────────────────┘

┌──────────────────────┐ (dimmed)
│  🧺 Wash & Fold      │
│  ₱50 / kg            │
│  [🔒 Shop Closed]    │ (button disabled)
└──────────────────────┘
```

### Provider View:
```
┌────────────────────────────────────────────────┐
│  Provider Dashboard                            │
│                                                │
│  [🟢 Shop Open - Click to Close]              │
└────────────────────────────────────────────────┘

or

┌────────────────────────────────────────────────┐
│  Provider Dashboard                            │
│                                                │
│  [🔴 Shop Closed - Click to Open]             │
└────────────────────────────────────────────────┘
```

---

## Testing

### Test Cases:

1. **Provider Registration**
   - ✅ New provider should have `is_available: true` by default

2. **Toggle Availability**
   - ✅ Provider clicks button → status changes
   - ✅ Page refreshes → new status persists
   - ✅ Customer dashboard immediately shows updated status

3. **Customer View - Open Shop**
   - ✅ Open shops show green badge
   - ✅ "Book Now" button is enabled
   - ✅ Can successfully create bookings

4. **Customer View - Closed Shop**
   - ✅ Closed shops show red badge and appear dimmed (60% opacity)
   - ✅ Warning message displayed when shop is selected
   - ✅ "Book Now" button shows "🔒 Shop Closed" and is disabled
   - ✅ Clicking disabled button shows alert message
   - ✅ Backend rejects booking attempts with 400 error

5. **Edge Cases**
   - ✅ Old providers without `is_available` field → treated as open
   - ✅ Multiple rapid toggles → last toggle wins
   - ✅ Direct API calls to create booking → blocked by backend validation

---

## Future Enhancements

### Recommended Improvements:

1. ~~**Prevent Bookings When Closed**~~ ✅ **COMPLETED**
   - ✅ Validation added in `BookingCreate` endpoint
   - ✅ Warning message shown to customers
   - ✅ "Book Now" button disabled for closed shops

2. **Operating Hours**
   - Add `operating_hours` field (e.g., "9:00 AM - 6:00 PM")
   - Auto-toggle based on time
   - Show hours on customer dashboard

3. **Temporary Closure**
   - Add "Closed until [date]" feature
   - Show estimated reopening time

4. **Notification**
   - Notify customers if their selected provider closes
   - Alert provider when toggling during active bookings

5. **Analytics**
   - Track open/closed hours
   - Show uptime statistics
   - Report on availability patterns

---

## Database Migration

### For Existing Providers:
If you have existing providers in the database without the `is_available` field, they will automatically be treated as **open** due to the `coalesce(u.is_available, true)` logic.

To explicitly set all existing providers to open:
```cypher
MATCH (u:User {role: 'provider'})
WHERE u.is_available IS NULL
SET u.is_available = true
```

---

## API Documentation

### Toggle Availability

**Endpoint**: `POST /users/toggle_availability`

**Authentication**: Required (Bearer token)

**Authorization**: Provider role only

**Request Body**: None

**Response**:
```json
{
  "is_available": true
}
```

**Errors**:
- `403 Forbidden`: If user is not a provider
- `401 Unauthorized`: If token is invalid

**Example**:
```javascript
const response = await fetch('/users/toggle_availability', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(data.is_available); // true or false
```

---

## Summary

✅ **Implemented**:
- Database field for availability
- API endpoint to toggle status
- Provider UI to change availability
- Customer UI to see availability status
- Visual indicators (badges, colors, opacity)
- **Backend validation to prevent bookings when closed**
- **Frontend UI prevention (disabled buttons, warnings)**
- **Error handling for closed shop booking attempts**

🔄 **Recommended Next Steps**:
- Add operating hours feature (auto-toggle based on time)
- Add temporary closure with reopening date
- Improve UX with real-time notifications

---

**Feature Status**: ✅ Complete and Ready to Use
