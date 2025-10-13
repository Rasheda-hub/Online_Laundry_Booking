# 🛒 Cart-Based Booking Flow Documentation

## Overview

The new cart-based booking system allows customers to add multiple laundry services from a provider to their cart, review the total, and place a single order. Receipts are generated only after the provider accepts the booking.

---

## 🔄 Complete Booking Flow

```
Customer                    System                      Provider
   │                           │                            │
   │ 1. Browse providers        │                            │
   │──────────────────────────>│                            │
   │                           │                            │
   │ 2. Click on shop          │                            │
   │──────────────────────────>│                            │
   │                           │                            │
   │ 3. View services/categories│                            │
   │<──────────────────────────│                            │
   │                           │                            │
   │ 4. Add items to cart      │                            │
   │   (multiple services)     │                            │
   │──────────────────────────>│                            │
   │                           │                            │
   │ 5. Review cart & total    │                            │
   │──────────────────────────>│                            │
   │                           │                            │
   │ 6. Confirm order          │                            │
   │──────────────────────────>│                            │
   │                           │                            │
   │                           │ 7. Create bookings         │
   │                           │    (one per cart item)     │
   │                           │    Status: PENDING         │
   │                           │                            │
   │                           │ 8. Notify provider         │
   │                           │───────────────────────────>│
   │                           │                            │
   │ 9. Order confirmation     │                            │
   │<──────────────────────────│                            │
   │                           │                            │
   │                           │ 10. Provider reviews       │
   │                           │<───────────────────────────│
   │                           │                            │
   │                           │ 11. Accept/Reject          │
   │                           │<───────────────────────────│
   │                           │                            │
   │                           │ 12. Generate receipt       │
   │                           │    (if accepted)           │
   │                           │                            │
   │ 13. Notification + Receipt│                            │
   │<──────────────────────────│                            │
   │                           │                            │
   │ 14. Pay cash & deliver    │                            │
   │    laundry                │                            │
   │                           │                            │
   │                           │ 15. Confirm payment        │
   │                           │<───────────────────────────│
   │                           │                            │
   │ 16. Status: IN_PROGRESS   │                            │
   │<──────────────────────────│                            │
   │                           │                            │
   │                           │ 17. Update: READY          │
   │                           │<───────────────────────────│
   │                           │                            │
   │ 18. Pickup notification   │                            │
   │<──────────────────────────│                            │
   │                           │                            │
   │ 19. Pickup laundry        │                            │
   │                           │                            │
   │                           │ 20. Mark COMPLETED         │
   │                           │<───────────────────────────│
   │                           │                            │
   │ 21. Completion notification│                            │
   │<──────────────────────────│                            │
```

---

## 📱 Frontend Components

### 1. **Customer Dashboard** (`/customer`)
- Displays list of approved providers
- Shows provider status (Open/Closed)
- Click on provider → Navigate to shop page

### 2. **Provider Shop Page** (`/customer/shop/:providerId`)
- **Features:**
  - Display shop info (name, address, contact, status)
  - List all available services/categories
  - For each service:
    - Name, pricing type, price
    - Weight input (for per-kilo services)
    - "Add to Cart" button
  - Cart badge showing item count
  - "View Cart" button

- **Cart Logic:**
  - Can only have items from ONE provider at a time
  - If adding from different provider, prompt to clear cart
  - Items stored in localStorage
  - Real-time price calculation

### 3. **Cart Page** (`/customer/cart`)
- **Features:**
  - List all cart items with:
    - Service name
    - Weight (editable)
    - Price per item
    - Remove button
  - Order details form:
    - Pickup date & time
    - Special instructions
  - Order summary:
    - Subtotal
    - Service fee (₱0.00)
    - Total amount
  - Payment info: Cash on Delivery
  - "Confirm Order" button

- **Validation:**
  - Must select pickup date/time
  - Cart must not be empty
  - Provider must be available (open)

### 4. **Orders Page** (`/customer/orders`)
- Shows all bookings grouped by provider
- Each booking displays:
  - Service name
  - Weight, price
  - Status badge
  - Receipt link (if accepted)
  - Scheduled date

---

## 🔧 Backend Endpoints

### 1. **Create Cart Booking**
```
POST /bookings/cart
```

**Request Body:**
```json
{
  "provider_id": "uuid",
  "items": [
    {
      "category_id": "uuid",
      "weight_kg": 5.0
    },
    {
      "category_id": "uuid",
      "weight_kg": 3.5
    }
  ],
  "schedule_at": "2025-10-15T10:00:00",
  "notes": "Please handle with care"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully! 2 items added.",
  "booking_ids": ["uuid1", "uuid2"],
  "total_amount": 450.00,
  "status": "pending"
}
```

**What Happens:**
1. Validates provider is approved and available
2. For each cart item:
   - Validates category exists
   - Calculates price based on pricing type
   - Creates individual Booking node
3. Creates notification for provider
4. Returns success with booking IDs

### 2. **Accept Booking**
```
POST /bookings/{booking_id}/accept
```

**What Happens:**
1. Validates booking is pending
2. Updates status to "confirmed"
3. **Generates receipt** (Order + Receipt nodes)
4. Notifies customer with receipt link
5. Customer can now pay and deliver laundry

### 3. **Reject Booking**
```
POST /bookings/{booking_id}/reject
```

**What Happens:**
1. Updates status to "rejected"
2. Notifies customer
3. No receipt generated

---

## 🗄️ Database Schema

### **Nodes:**

```cypher
// Booking (one per cart item)
(b:Booking {
  id: "uuid",
  schedule_at: "2025-10-15T10:00:00",
  status: "pending|confirmed|in_progress|ready|completed|rejected",
  notes: "Customer notes",
  created_at: "2025-10-13T20:00:00",
  weight_kg: 5.0,
  total_price: 250.00
})

// Order (created when booking is accepted)
(o:Order {
  id: "uuid",
  status: "confirmed",
  created_at: "2025-10-13T20:05:00"
})

// Receipt (created when booking is accepted)
(r:Receipt {
  id: "uuid",
  subtotal: 250.00,
  delivery_fee: 0.00,
  total: 250.00,
  created_at: "2025-10-13T20:05:00"
})
```

### **Relationships:**

```cypher
(b:Booking)-[:BY_CUSTOMER]->(c:User)
(b:Booking)-[:FOR_PROVIDER]->(p:User)
(b:Booking)-[:OF_CATEGORY]->(cat:Category)

// Created when provider accepts
(o:Order)-[:FROM_BOOKING]->(b:Booking)
(r:Receipt)-[:FOR_ORDER]->(o:Order)
(r:Receipt)-[:FOR_CUSTOMER]->(c:User)
(r:Receipt)-[:FOR_PROVIDER]->(p:User)
```

---

## 📊 Booking Status Flow

```
PENDING
   ↓
   ├─→ CONFIRMED (provider accepts) → Receipt generated
   │      ↓
   │   IN_PROGRESS (customer paid & delivered)
   │      ↓
   │   READY (laundry ready for pickup)
   │      ↓
   │   COMPLETED
   │
   └─→ REJECTED (provider rejects) → No receipt
```

---

## 💰 Payment Flow

### **Cash on Delivery:**

1. **Booking Created:**
   - Status: PENDING
   - No payment yet
   - No receipt yet

2. **Provider Accepts:**
   - Status: CONFIRMED
   - Receipt generated with total amount
   - Customer sees: "Please pay ₱XXX in cash when you deliver"

3. **Customer Delivers Laundry:**
   - Brings laundry to shop
   - Pays cash amount shown on receipt
   - Provider confirms payment

4. **Provider Confirms Payment:**
   - Updates status to IN_PROGRESS
   - Starts processing laundry

5. **Receipt Validation:**
   - Both customer and provider have access to receipt
   - Receipt shows:
     - Items ordered
     - Individual prices
     - Total amount
     - Payment method: Cash
     - Date & time

---

## 🔐 Security & Validation

### **Cart Validation:**
- ✅ Provider must be approved
- ✅ Provider must be available (shop open)
- ✅ Categories must belong to provider
- ✅ Weight must meet min/max requirements
- ✅ Cart cannot be empty

### **Booking Validation:**
- ✅ Only customers can create bookings
- ✅ Only providers can accept/reject bookings
- ✅ Only pending bookings can be accepted/rejected
- ✅ Booking must belong to provider

### **Receipt Generation:**
- ✅ Only generated when provider accepts
- ✅ Linked to both customer and provider
- ✅ Immutable once created
- ✅ Accessible by both parties

---

## 🎯 Key Features

### **1. Multi-Item Cart**
- Add multiple services from same provider
- Real-time price calculation
- Editable quantities (weight)
- Persistent cart (localStorage)

### **2. Provider Confirmation Required**
- Providers must explicitly accept bookings
- Prevents automatic orders
- Allows providers to manage capacity

### **3. Receipt on Acceptance**
- Receipt only generated after provider accepts
- Ensures both parties agree on order
- Serves as payment validation document

### **4. Cash Payment**
- No online payment required
- Pay when delivering laundry
- Receipt shows exact amount to pay

### **5. Order Tracking**
- Real-time status updates
- Notifications at each step
- View receipt anytime

---

## 📝 Example User Journey

### **Customer: Maria**

1. **Browse Shops:**
   - Opens app → Customer Dashboard
   - Sees "CleanPro Laundry" (Open)
   - Clicks on shop

2. **Add to Cart:**
   - Sees services:
     - Wash & Fold: ₱50/kg
     - Dry Clean: ₱150 fixed
   - Adds 5kg Wash & Fold → ₱250
   - Adds 1 Dry Clean → ₱150
   - Cart total: ₱400

3. **Review & Confirm:**
   - Goes to cart
   - Selects pickup: Tomorrow 10:00 AM
   - Adds note: "Separate whites"
   - Confirms order

4. **Wait for Acceptance:**
   - Receives notification: "Order submitted"
   - Status: PENDING
   - Waits for provider

5. **Provider Accepts:**
   - Receives notification: "Order accepted! Receipt generated."
   - Views receipt: Total ₱400
   - Sees: "Pay ₱400 cash when you deliver"

6. **Deliver & Pay:**
   - Brings laundry tomorrow at 10 AM
   - Pays ₱400 cash
   - Provider confirms payment
   - Status: IN_PROGRESS

7. **Pickup:**
   - Receives notification: "Laundry ready!"
   - Picks up clean laundry
   - Order completed

### **Provider: CleanPro**

1. **Receive Order:**
   - Notification: "New cart order with 2 items from Maria. Total: ₱400"
   - Opens provider dashboard
   - Sees pending booking

2. **Review Order:**
   - Checks items:
     - 5kg Wash & Fold
     - 1 Dry Clean
   - Checks schedule: Tomorrow 10 AM
   - Checks capacity

3. **Accept Order:**
   - Clicks "Accept"
   - Receipt auto-generated
   - Customer notified

4. **Receive Laundry:**
   - Maria arrives at 10 AM
   - Collects ₱400 cash
   - Confirms payment in app
   - Starts processing

5. **Complete Order:**
   - Finishes laundry
   - Updates status: READY
   - Maria picks up
   - Marks COMPLETED

---

## 🚀 Testing Checklist

- [ ] Add single item to cart
- [ ] Add multiple items to cart
- [ ] Edit item weight in cart
- [ ] Remove item from cart
- [ ] Clear entire cart
- [ ] Try adding from different provider (should prompt)
- [ ] Submit cart order
- [ ] Provider receives notification
- [ ] Provider accepts booking
- [ ] Receipt is generated
- [ ] Customer receives receipt
- [ ] Provider rejects booking
- [ ] No receipt generated for rejected
- [ ] View orders page
- [ ] Track booking status
- [ ] Complete full order flow

---

## 📈 Future Enhancements

1. **Bulk Accept/Reject:**
   - Accept all items from same cart order at once

2. **Partial Acceptance:**
   - Provider can accept some items, reject others

3. **Price Adjustments:**
   - Provider can adjust price after inspection

4. **Delivery Options:**
   - Add pickup/delivery service
   - Additional delivery fee

5. **Payment Methods:**
   - Add online payment (GCash, PayMaya)
   - Payment on pickup option

6. **Discounts & Promos:**
   - Apply discount codes
   - Loyalty points

7. **Recurring Orders:**
   - Save cart as template
   - Schedule recurring bookings

---

## ✅ Implementation Complete!

The cart-based booking system is now fully functional with:
- ✅ Shopping cart functionality
- ✅ Multi-item orders
- ✅ Provider shop pages
- ✅ Cart review & checkout
- ✅ Provider acceptance workflow
- ✅ Receipt generation on acceptance
- ✅ Cash payment validation
- ✅ Order tracking
- ✅ Notifications

**Ready for testing!** 🎉
