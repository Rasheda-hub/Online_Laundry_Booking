# 🔔 Notification Flow - Complete Guide

## Overview

Notifications are sent to both customers and providers at key points in the booking lifecycle.

---

## 📱 Notification Types & Flow

### **1. New Booking Created**

**When:** Customer books a service

**Customer receives:**
```
Type: booking_created
Message: "Your booking for [Service] has been submitted. Waiting for provider confirmation."
Links to: Booking ID
```

**Provider receives:**
```
Type: new_booking
Message: "New booking received for [Service] from [Customer Name]. Total: ₱[Amount]"
Links to: Booking ID
Action: Click "View Order" → Goes to Provider Dashboard (Bookings tab)
```

---

### **2. Booking Accepted (Receipt Generated)**

**When:** Provider clicks "Accept" on a pending booking

**What happens:**
1. Booking status → `confirmed`
2. Order created
3. Receipt generated
4. Notifications sent to both parties

**Customer receives:**
```
Type: booking_accepted
Message: "Your booking for [Service] has been accepted by [Shop Name]. Receipt generated. Please pay ₱[Amount] in cash when you deliver your laundry."
Links to: Booking ID + Receipt ID
Action: Click "View Receipt" → Opens receipt details
```

**Provider receives:**
```
Type: receipt_generated
Message: "Receipt generated for [Service] booking from [Customer Name]. Amount: ₱[Amount]. Waiting for customer payment and delivery."
Links to: Booking ID + Receipt ID
Action: Click "View Receipt" → Opens receipt details
```

---

### **3. Booking Rejected**

**When:** Provider clicks "Reject" on a pending booking

**Customer receives:**
```
Type: booking_rejected
Message: "Your booking for [Service] has been rejected by [Shop Name]."
Links to: Booking ID
```

**Provider receives:**
```
No notification (they initiated the action)
```

---

### **4. Payment Confirmed**

**When:** Provider clicks "Confirm Payment Received" (customer paid & delivered laundry)

**What happens:**
1. Booking status → `in_progress`
2. Order status → `in_progress`
3. Notification sent to customer

**Customer receives:**
```
Type: payment_confirmed
Message: "Payment confirmed! Your laundry for [Service] is now being processed."
Links to: Booking ID
```

**Provider receives:**
```
No notification (they initiated the action)
```

---

### **5. Status Updates**

**When:** Provider updates booking status (in_progress → ready → completed)

**Customer receives:**
```
Type: status_update
Messages:
- "Your laundry is now being processed" (in_progress)
- "Your laundry is ready for pickup!" (ready)
- "Your order has been completed. Thank you!" (completed)
Links to: Booking ID
```

**Provider receives:**
```
No notification (they initiated the action)
```

---

## 🎯 Notification Actions

### **Customer Actions:**

| Notification Type | Button | Action |
|------------------|--------|--------|
| `booking_created` | 📦 View Order | → `/customer/orders` |
| `booking_accepted` | 🧾 View Receipt | → `/receipts?rid=[receipt_id]` |
| `booking_rejected` | 📦 View Order | → `/customer/orders` |
| `payment_confirmed` | 📦 View Order | → `/customer/orders` |
| `status_update` | 📦 View Order | → `/customer/orders` |

### **Provider Actions:**

| Notification Type | Button | Action |
|------------------|--------|--------|
| `new_booking` | 📦 View Order | → `/provider?tab=bookings` |
| `receipt_generated` | 🧾 View Receipt | → `/receipts?rid=[receipt_id]` |

---

## 📊 Complete Booking Lifecycle with Notifications

```
1. CUSTOMER BOOKS SERVICE
   ├─ Customer: "Booking submitted, waiting for confirmation"
   └─ Provider: "New booking from [Customer]"
   
2. PROVIDER ACCEPTS
   ├─ Booking: pending → confirmed
   ├─ Receipt: Generated
   ├─ Customer: "Booking accepted! Receipt generated. Pay ₱X when delivering"
   └─ Provider: "Receipt generated for [Customer]. Amount: ₱X. Waiting for payment"
   
3. CUSTOMER PAYS & DELIVERS LAUNDRY
   (Customer brings laundry to shop + pays cash)
   
4. PROVIDER CONFIRMS PAYMENT
   ├─ Booking: confirmed → in_progress
   ├─ Order: confirmed → in_progress
   └─ Customer: "Payment confirmed! Laundry being processed"
   
5. PROVIDER PROCESSES LAUNDRY
   └─ Customer: "Your laundry is now being processed"
   
6. LAUNDRY READY
   ├─ Booking: in_progress → ready
   └─ Customer: "Your laundry is ready for pickup!"
   
7. CUSTOMER PICKS UP
   
8. PROVIDER MARKS COMPLETED
   ├─ Booking: ready → completed
   └─ Customer: "Your order has been completed. Thank you!"
```

---

## 🔄 Notification Polling

**Frontend automatically polls for new notifications:**
- **Interval:** Every 30 seconds
- **Unread count:** Displayed as badge on notification icon
- **Auto-refresh:** When user opens notifications page

---

## 💾 Database Structure

### **Notification Node:**
```cypher
(n:Notification {
  id: "uuid",
  type: "booking_accepted",
  message: "Your booking has been accepted...",
  created_at: "2025-10-13T21:00:00",
  read: false,
  booking_id: "booking-uuid",  // optional
  receipt_id: "receipt-uuid"   // optional
})
```

### **Relationships:**
```cypher
(n:Notification)-[:FOR_USER]->(u:User)
```

---

## 🎨 UI Features

### **Notification Badge:**
- Red badge with unread count
- Shows on bottom nav notification icon
- Updates every 30 seconds

### **Notification Card:**
- **Unread:** Purple gradient background + "NEW" badge
- **Read:** White background
- **Timestamp:** Shows date and time
- **Action buttons:** "View Receipt" or "View Order" or "Mark Read"

### **Mark as Read:**
- Individual: Click "Mark Read" button
- Bulk: Click "Mark All Read" button
- Auto: Automatically marked when clicking action buttons

---

## ✅ Implementation Complete!

Both customers and providers now receive appropriate notifications at each stage of the booking process:

✅ **Customer notified** when:
- Booking submitted
- Booking accepted (with receipt)
- Booking rejected
- Payment confirmed
- Status changes (in_progress, ready, completed)

✅ **Provider notified** when:
- New booking received
- Receipt generated (after accepting booking)

✅ **Navigation works correctly:**
- Providers → Dashboard bookings tab
- Customers → Orders page
- Both → Receipt details (when applicable)

🎉 **All notifications working as expected!**
