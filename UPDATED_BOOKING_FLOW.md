# 📋 Updated Booking Flow - Final Version

## Overview

Customers can place **multiple separate bookings** (one per category) from a single provider's shop. Each booking is independent but placed together as a cart order.

---

## 🔄 Key Changes

### **1. No Grouped Booking**
- ❌ No single "GroupedBooking" node
- ✅ Each cart item creates a **separate Booking** node
- ✅ Customer can order multiple categories from same provider
- ✅ Each booking has its own status, receipt, and tracking

### **2. Fixed Price Categories - Weight Input Required**
- ✅ ALL categories (per-kilo AND fixed) require weight input
- ✅ Fixed price categories can accept weight **above max**
- ✅ If weight > max, price multiplies by number of batches

**Example:**
```
Service: Dry Clean (Fixed)
Price: ₱180 per batch
Max: 5kg per batch

Customer orders 12kg:
- Batches needed: 12kg ÷ 5kg = 2.4 → rounds up to 3 batches
- Total price: ₱180 × 3 = ₱540
```

### **3. Real-Time Booking**
- ❌ No schedule/pickup date picker
- ✅ Order placed immediately with current timestamp
- ✅ Customer can drop off laundry anytime during shop hours
- ✅ `schedule_at` = `created_at` (same timestamp)

### **4. Payment-Based Status Updates**
```
PENDING → Order placed, waiting for provider acceptance
   ↓
CONFIRMED → Provider accepted, receipt generated
   ↓
IN_PROGRESS → Customer paid cash & delivered laundry
   ↓
READY → Laundry ready for pickup
   ↓
COMPLETED → Customer picked up laundry
```

---

## 📱 Complete User Flow

### **Customer Journey:**

1. **Browse Providers**
   - Go to Customer Dashboard
   - See list of approved providers
   - Click on a provider to visit their shop

2. **Add Items to Cart**
   - View all available services/categories
   - For each service:
     - Enter weight (kg) - **required for all types**
     - See real-time price calculation
     - Click "Add to Cart"
   - Can add multiple different services
   - All items must be from same provider

3. **Review Cart**
   - Click cart icon (shows item count)
   - See all items with:
     - Service name
     - Weight (editable)
     - Price per item
     - Subtotal
   - See total amount
   - Add special instructions (optional)

4. **Place Order**
   - Click "Place Order Now"
   - Creates **separate bookings** for each cart item
   - All bookings start with status: **PENDING**
   - Cart is cleared
   - Notification sent to provider

5. **Wait for Provider Acceptance**
   - Provider reviews all bookings
   - Provider can accept or reject each booking individually
   - Customer receives notification when provider accepts

6. **After Acceptance (CONFIRMED)**
   - Receipt is generated for each accepted booking
   - Customer sees total amount to pay
   - Customer brings laundry to shop + pays cash

7. **Provider Confirms Payment**
   - Provider marks payment received
   - Status updates to **IN_PROGRESS**
   - Provider starts processing laundry

8. **Laundry Ready**
   - Provider updates status to **READY**
   - Customer receives notification

9. **Pickup**
   - Customer picks up clean laundry
   - Provider marks **COMPLETED**

---

## 🏪 Provider Journey:

1. **Receive Order Notification**
   - "New order with 3 items from Maria. Total: ₱850"
   - Opens Provider Dashboard

2. **Review Bookings**
   - Sees 3 separate pending bookings:
     - Wash & Fold - 5kg - ₱250
     - Dry Clean - 12kg (3 batches) - ₱540
     - Iron Only - 2kg - ₱60
   - Can accept/reject each individually

3. **Accept Bookings**
   - Clicks "Accept" on each booking
   - Receipt auto-generated for each
   - Customer notified

4. **Receive Laundry & Payment**
   - Customer arrives with laundry
   - Collects ₱850 cash
   - Confirms payment in app
   - All bookings update to IN_PROGRESS

5. **Process Laundry**
   - Works on the laundry
   - Updates each booking to READY when done

6. **Customer Pickup**
   - Customer picks up
   - Marks all bookings as COMPLETED

---

## 💰 Pricing Logic

### **Per-Kilo Categories:**
```javascript
price = price_per_kilo × weight
```

**Example:**
- Wash & Fold: ₱50/kg
- Weight: 5kg
- Total: ₱50 × 5 = ₱250

### **Fixed Price Categories:**

**Case 1: Weight ≤ Max**
```javascript
price = fixed_price
```

**Example:**
- Dry Clean: ₱180 fixed
- Max: 5kg per batch
- Weight: 3kg
- Total: ₱180 (1 batch)

**Case 2: Weight > Max**
```javascript
batches = Math.ceil(weight / max_kilo)
price = fixed_price × batches
```

**Example:**
- Dry Clean: ₱180 fixed
- Max: 5kg per batch
- Weight: 12kg
- Batches: Math.ceil(12 / 5) = 3
- Total: ₱180 × 3 = ₱540

---

## 🗄️ Database Structure

### **Booking Node:**
```cypher
(b:Booking {
  id: "uuid",
  schedule_at: "2025-10-13T20:00:00",  // same as created_at
  status: "pending",
  notes: "Cart order",
  created_at: "2025-10-13T20:00:00",
  weight_kg: 5.0,
  total_price: 250.00
})
```

### **Relationships:**
```cypher
(b:Booking)-[:BY_CUSTOMER]->(c:User)
(b:Booking)-[:FOR_PROVIDER]->(p:User)
(b:Booking)-[:OF_CATEGORY]->(cat:Category)

// After provider accepts:
(o:Order)-[:FROM_BOOKING]->(b:Booking)
(r:Receipt)-[:FOR_ORDER]->(o:Order)
```

### **Multiple Bookings from Cart:**
```
Cart with 3 items → Creates 3 separate Booking nodes
Each booking:
- Has its own ID
- Links to same customer
- Links to same provider
- Links to different category
- Has independent status
- Gets separate receipt when accepted
```

---

## 🔧 API Endpoints

### **POST /bookings/cart**

**Request:**
```json
{
  "provider_id": "uuid",
  "items": [
    {
      "category_id": "uuid-wash-fold",
      "weight_kg": 5.0
    },
    {
      "category_id": "uuid-dry-clean",
      "weight_kg": 12.0
    },
    {
      "category_id": "uuid-iron",
      "weight_kg": 2.0
    }
  ],
  "notes": "Please handle with care"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully placed 3 orders!",
  "booking_ids": [
    "booking-uuid-1",
    "booking-uuid-2",
    "booking-uuid-3"
  ],
  "total_amount": 850.00,
  "status": "pending"
}
```

**What Happens:**
1. Validates provider is approved and available
2. For each item:
   - Validates category exists
   - Calculates price (handles fixed price batches)
   - Creates individual Booking node
3. Sends notifications to customer and provider
4. Returns list of booking IDs

### **POST /bookings/{id}/accept**

**What Happens:**
1. Validates booking is pending
2. Updates status to "confirmed"
3. Generates Order and Receipt nodes
4. Notifies customer with receipt

### **POST /bookings/{id}/confirm-payment**

**What Happens:**
1. Validates booking is confirmed
2. Updates status to "in_progress"
3. Notifies customer that processing has started

---

## ✅ Implementation Checklist

- [x] Remove schedule picker from cart
- [x] Use real-time timestamp for bookings
- [x] Add weight input for ALL categories
- [x] Calculate fixed price with batch multiplier
- [x] Create separate bookings (not grouped)
- [x] Update cart context price calculation
- [x] Update provider shop price display
- [x] Backend creates individual Booking nodes
- [x] Backend handles fixed price batch calculation
- [x] Notifications for cart orders
- [x] Receipt generation on acceptance

---

## 🧪 Test Scenarios

### **Scenario 1: Per-Kilo Service**
1. Add "Wash & Fold" (₱50/kg)
2. Enter 5kg
3. Should show: ₱250
4. Add to cart
5. Place order
6. Provider accepts
7. Receipt shows: ₱250

### **Scenario 2: Fixed Price Within Max**
1. Add "Dry Clean" (₱180 fixed, max 5kg)
2. Enter 3kg
3. Should show: ₱180 (1 batch)
4. Add to cart
5. Place order
6. Provider accepts
7. Receipt shows: ₱180

### **Scenario 3: Fixed Price Exceeds Max**
1. Add "Dry Clean" (₱180 fixed, max 5kg)
2. Enter 12kg
3. Should show: ₱540 (3 batches)
4. Add to cart
5. Place order
6. Provider accepts
7. Receipt shows: ₱540

### **Scenario 4: Multiple Items**
1. Add "Wash & Fold" 5kg → ₱250
2. Add "Dry Clean" 12kg → ₱540
3. Add "Iron Only" 2kg → ₱60
4. Cart total: ₱850
5. Place order
6. Creates 3 separate bookings
7. Provider can accept each individually
8. Each gets own receipt

---

## 🎯 Key Features

✅ **Separate Bookings** - Each category is independent
✅ **Batch Pricing** - Fixed price multiplies for heavy loads
✅ **Real-Time Orders** - No scheduling needed
✅ **Payment Confirmation** - Status updates when paid
✅ **Multiple Services** - Order many categories at once
✅ **Individual Receipts** - Each booking gets own receipt
✅ **Flexible Acceptance** - Provider can accept/reject individually

---

## 📊 Example Order

**Customer: Maria**
**Provider: CleanPro Laundry**
**Order Time: 2025-10-13 20:00:00**

| Service | Weight | Type | Price | Batches | Total |
|---------|--------|------|-------|---------|-------|
| Wash & Fold | 5kg | Per-kilo (₱50/kg) | - | - | ₱250 |
| Dry Clean | 12kg | Fixed (₱180, max 5kg) | ₱180 | 3 | ₱540 |
| Iron Only | 2kg | Fixed (₱60, max 3kg) | ₱60 | 1 | ₱60 |

**Grand Total: ₱850**

**Bookings Created:**
- Booking #1: Wash & Fold - ₱250 - PENDING
- Booking #2: Dry Clean - ₱540 - PENDING
- Booking #3: Iron Only - ₱60 - PENDING

**After Provider Accepts All:**
- Booking #1: CONFIRMED - Receipt #1 generated
- Booking #2: CONFIRMED - Receipt #2 generated
- Booking #3: CONFIRMED - Receipt #3 generated

**After Customer Pays & Delivers:**
- All bookings: IN_PROGRESS

**After Laundry Ready:**
- All bookings: READY

**After Customer Picks Up:**
- All bookings: COMPLETED

---

## 🚀 Ready to Use!

The updated booking flow is complete and ready for testing. All changes have been implemented in both frontend and backend.
