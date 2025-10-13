# 📋 Final Booking Flow - Direct Booking System

## Overview

Customers book services **directly** from the provider's shop page. No cart system. Each booking is created immediately and independently.

---

## 🎯 Key Features

### **1. Direct Booking (No Cart)**
- ❌ No shopping cart
- ✅ Book services directly from provider shop page
- ✅ Each service booking is independent
- ✅ Can book multiple services from same provider (one at a time)

### **2. Pricing Logic**

#### **Per-Kilo Categories:**
```
Price = price_per_kg × weight
```

**Example:**
- Wash & Fold: ₱50/kg
- Customer orders 5kg
- **Total: ₱250**

#### **Fixed Price Categories:**
```
Price = fixed_price (regardless of weight)
```

**Example:**
- Dry Clean: ₱180 fixed
- Min: 3kg
- Customer can order ANY weight ≥ 3kg
- Order 3kg → **₱180**
- Order 10kg → **₱180**
- Order 50kg → **₱180**

**Key Points:**
- ✅ Must meet minimum weight requirement
- ✅ No maximum weight limit
- ✅ Price stays the same regardless of weight
- ✅ Customer specifies weight for tracking purposes

---

## 📱 User Flow

### **Customer Journey:**

1. **Browse Providers**
   - Go to Customer Dashboard
   - See list of approved providers
   - Click on provider to visit shop

2. **View Services**
   - See all available services/categories
   - Each service shows:
     - Name
     - Pricing type (per-kilo or fixed)
     - Price
     - Minimum weight (if any)

3. **Book a Service**
   - Enter weight (kg) - **required**
   - Add special instructions (optional)
   - See calculated price
   - Click "Book Now"
   - Booking created immediately (status: PENDING)

4. **Book More Services (Optional)**
   - Can book additional services from same provider
   - Each creates a separate booking
   - All bookings are independent

5. **Wait for Provider Acceptance**
   - Provider reviews booking
   - Provider accepts or rejects

6. **After Acceptance (CONFIRMED)**
   - Receipt generated
   - Customer sees total amount to pay
   - Customer brings laundry to shop + pays cash

7. **Provider Confirms Payment**
   - Status updates to IN_PROGRESS
   - Provider processes laundry

8. **Laundry Ready**
   - Status: READY
   - Customer receives notification

9. **Pickup**
   - Customer picks up
   - Status: COMPLETED

---

## 🏪 Provider Journey:

1. **Receive Booking Notification**
   - "New booking for [Service] from [Customer]. Total: ₱XXX"

2. **Review Booking**
   - See service details
   - See weight
   - See customer notes
   - See total price

3. **Accept or Reject**
   - Click "Accept" → Receipt generated
   - Click "Reject" → Customer notified

4. **Receive Laundry & Payment**
   - Customer arrives with laundry
   - Collect cash payment
   - Confirm payment in app
   - Status: IN_PROGRESS

5. **Process & Complete**
   - Update to READY when done
   - Customer picks up
   - Mark COMPLETED

---

## 💰 Pricing Examples

### **Scenario 1: Per-Kilo Service**
```
Service: Wash & Fold
Price: ₱50/kg
Customer orders: 7kg

Calculation: ₱50 × 7 = ₱350
Total: ₱350
```

### **Scenario 2: Fixed Price (Within Min)**
```
Service: Dry Clean
Price: ₱180 fixed
Min: 3kg
Customer orders: 5kg

Calculation: Fixed price
Total: ₱180
```

### **Scenario 3: Fixed Price (Large Order)**
```
Service: Dry Clean
Price: ₱180 fixed
Min: 3kg
Customer orders: 20kg

Calculation: Fixed price (no batch multiplication)
Total: ₱180
```

### **Scenario 4: Multiple Bookings**
```
Customer books from "CleanPro Laundry":

Booking #1:
- Service: Wash & Fold (₱50/kg)
- Weight: 5kg
- Total: ₱250

Booking #2:
- Service: Dry Clean (₱180 fixed)
- Weight: 10kg
- Total: ₱180

Booking #3:
- Service: Iron Only (₱60 fixed)
- Weight: 3kg
- Total: ₱60

Grand Total: ₱490 (3 separate bookings)
```

---

## 🗄️ Database Structure

### **Booking Node:**
```cypher
(b:Booking {
  id: "uuid",
  schedule_at: "2025-10-13T21:00:00",  // real-time timestamp
  status: "pending",
  notes: "Please handle with care",
  created_at: "2025-10-13T21:00:00",
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

## 🔧 API Endpoints

### **POST /bookings**

**Request:**
```json
{
  "provider_id": "uuid",
  "category_id": "uuid",
  "weight_kg": 5.0,
  "notes": "Please handle with care"
}
```

**Response:**
```json
{
  "id": "booking-uuid",
  "customer_id": "customer-uuid",
  "provider_id": "provider-uuid",
  "category_id": "category-uuid",
  "category_name": "Wash & Fold",
  "pricing_type": "per_kilo",
  "weight_kg": 5.0,
  "total_price": 250.00,
  "schedule_at": "2025-10-13T21:00:00",
  "status": "pending",
  "notes": "Please handle with care",
  "created_at": "2025-10-13T21:00:00"
}
```

**What Happens:**
1. Validates provider is approved and available
2. Validates category exists for provider
3. Calculates price:
   - Per-kilo: price × weight
   - Fixed: fixed price (regardless of weight)
4. Creates Booking node
5. Sends notifications to customer and provider

### **POST /bookings/{id}/accept**

**What Happens:**
1. Validates booking is pending
2. Updates status to "confirmed"
3. Generates Order and Receipt nodes
4. Notifies customer with receipt

### **POST /bookings/{id}/reject**

**What Happens:**
1. Updates status to "rejected"
2. Notifies customer
3. No receipt generated

### **POST /bookings/{id}/confirm-payment**

**What Happens:**
1. Validates booking is confirmed
2. Updates status to "in_progress"
3. Notifies customer

---

## 🎨 UI Components

### **Provider Shop Page**

Each service card shows:
- **Service name**
- **Pricing info:**
  - Per-kilo: "₱50 per kilo"
  - Fixed: "₱180 fixed price"
- **Weight requirements:**
  - Per-kilo: "Min: 1kg"
  - Fixed: "Min: 3kg (any weight above min accepted)"
- **Booking form:**
  - Weight input (required)
  - Notes textarea (optional)
  - Price display (auto-calculated)
  - "Book Now" button

---

## ✅ Validation Rules

### **Per-Kilo Categories:**
- ✅ Weight must be > 0
- ✅ Price = price_per_kg × weight

### **Fixed Price Categories:**
- ✅ Weight must be ≥ min_kilo (if set)
- ✅ No maximum weight limit
- ✅ Price = fixed_price (always)

---

## 🧪 Test Scenarios

### **Test 1: Per-Kilo Booking**
1. Go to provider shop
2. Find "Wash & Fold" (₱50/kg)
3. Enter 5kg
4. Should show: ₱250
5. Add note: "Separate whites"
6. Click "Book Now"
7. Success message appears
8. Booking created with status: PENDING

### **Test 2: Fixed Price Booking (Normal Weight)**
1. Find "Dry Clean" (₱180 fixed, min 3kg)
2. Enter 5kg
3. Should show: ₱180
4. Click "Book Now"
5. Booking created: ₱180

### **Test 3: Fixed Price Booking (Heavy Weight)**
1. Find "Dry Clean" (₱180 fixed, min 3kg)
2. Enter 50kg
3. Should show: ₱180 (not multiplied!)
4. Click "Book Now"
5. Booking created: ₱180

### **Test 4: Multiple Bookings**
1. Book "Wash & Fold" 5kg → ₱250
2. Book "Dry Clean" 10kg → ₱180
3. Book "Iron Only" 3kg → ₱60
4. Check orders page
5. Should see 3 separate bookings
6. Each with own status

### **Test 5: Provider Acceptance**
1. Login as provider
2. See pending bookings
3. Accept one booking
4. Receipt should be generated
5. Customer receives notification

---

## 🚀 Implementation Complete!

The direct booking system is fully implemented with:
- ✅ No cart system
- ✅ Direct booking from shop page
- ✅ Fixed price (no batch multiplication)
- ✅ Per-kilo pricing
- ✅ Real-time booking
- ✅ Weight tracking for all categories
- ✅ Independent bookings
- ✅ Receipt generation on acceptance
- ✅ Payment confirmation flow

**Ready to use!** 🎉
