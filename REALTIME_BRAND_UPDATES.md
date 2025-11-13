# 🔄 Real-Time Brand Updates - Implementation Guide

## 📋 Overview

This document describes the implementation of **real-time brand synchronization** between the AdminJS web panel and the mobile app. When an admin creates, updates, or deletes a brand in the web panel, the mobile app automatically refreshes the brand list without requiring a manual refresh.

---

## ✅ **PROBLEM SOLVED**

### **Before:**
- ❌ Mobile app had **hardcoded brands** (`['Samsung', 'LG', 'Whirlpool', 'Oppo']`)
- ❌ New brands added in AdminJS were **not visible** in mobile app
- ❌ Required **app restart** or **manual code update** to add new brands
- ❌ No real-time synchronization

### **After:**
- ✅ Mobile app **fetches brands dynamically** from API
- ✅ New brands appear **instantly** in mobile app via Socket.IO
- ✅ Brand updates/deletions reflected **in real-time**
- ✅ No app restart or manual refresh needed

---

## 🏗️ **ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Admin Creates/Updates Brand in AdminJS                      │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. AdminJS Action Hook (after: callback)                       │
│     - Saves brand to MongoDB                                    │
│     - Emits Socket.IO event                                     │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. Socket.IO Server Broadcasts Event                           │
│     - Event: "brandCreated" / "brandUpdated" / "brandDeleted"   │
│     - Payload: { brandId, name, logo, isActive, ... }           │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. Mobile App Receives Socket.IO Event                         │
│     - BookingFormScreen listens to brand events                 │
│     - Automatically calls fetchBrands()                         │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. Mobile App Fetches Updated Brands                           │
│     - GET /api/v1/brands                                        │
│     - Updates brand picker dropdown                             │
│     - User sees new brand immediately                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **IMPLEMENTATION DETAILS**

### **1. Backend - AdminJS Action Hooks**

**File:** `backend/src/admin/admin.js`

Added Socket.IO event emission in Brand resource actions:

```javascript
{
  resource: Brand,
  options: {
    // ... properties configuration ...
    actions: {
      new: {
        after: async (response, request, context) => {
          const io = context.h?.app?.get("io");
          if (io && response.record) {
            const brand = response.record.params;
            io.emit("brandCreated", {
              brandId: brand._id,
              name: brand.name,
              logo: brand.logo,
              isActive: brand.isActive,
              createdAt: brand.createdAt,
            });
            console.log("⚡ Socket event emitted: brandCreated -", brand.name);
          }
          return response;
        },
      },
      edit: {
        after: async (response, request, context) => {
          const io = context.h?.app?.get("io");
          if (io && response.record) {
            const brand = response.record.params;
            io.emit("brandUpdated", {
              brandId: brand._id,
              name: brand.name,
              logo: brand.logo,
              isActive: brand.isActive,
              updatedAt: brand.updatedAt,
            });
            console.log("⚡ Socket event emitted: brandUpdated -", brand.name);
          }
          return response;
        },
      },
      delete: {
        after: async (response, request, context) => {
          const io = context.h?.app?.get("io");
          if (io && response.record) {
            const brand = response.record.params;
            io.emit("brandDeleted", {
              brandId: brand._id,
              name: brand.name,
            });
            console.log("⚡ Socket event emitted: brandDeleted -", brand.name);
          }
          return response;
        },
      },
    },
  },
}
```

---

### **2. Mobile App - Dynamic Brand Fetching**

**File:** `mobile/src/screens/BookingFormScreen.tsx`

#### **Added State Management:**
```typescript
const [brands, setBrands] = useState<Brand[]>([]);
const [loadingBrands, setLoadingBrands] = useState(true);
const [brandOptions, setBrandOptions] = useState<string[]>([]);
```

#### **Fetch Brands Function:**
```typescript
const fetchBrands = async () => {
  try {
    setLoadingBrands(true);
    const response = await axios.get(`${API_BASE_URL}/brands`);
    
    if (response.data.success && response.data.data) {
      const fetchedBrands: Brand[] = response.data.data;
      setBrands(fetchedBrands);
      
      // Extract brand names for picker
      const names = fetchedBrands
        .filter((brand) => brand.isActive)
        .map((brand) => brand.name);
      setBrandOptions(names);
      
      console.log('✅ Brands loaded:', names);
    }
  } catch (error: any) {
    console.error('❌ Error fetching brands:', error);
    setBrandOptions([]);
  } finally {
    setLoadingBrands(false);
  }
};
```

#### **Socket.IO Listeners:**
```typescript
useEffect(() => {
  // Initial fetch
  fetchBrands();

  // Setup Socket.IO listeners
  const handleBrandCreated = (data: any) => {
    console.log('⚡ New brand created:', data);
    fetchBrands(); // Refresh brands list
  };

  const handleBrandUpdated = (data: any) => {
    console.log('⚡ Brand updated:', data);
    fetchBrands(); // Refresh brands list
  };

  const handleBrandDeleted = (data: any) => {
    console.log('⚡ Brand deleted:', data);
    fetchBrands(); // Refresh brands list
  };

  socketService.on('brandCreated', handleBrandCreated);
  socketService.on('brandUpdated', handleBrandUpdated);
  socketService.on('brandDeleted', handleBrandDeleted);

  // Cleanup listeners on unmount
  return () => {
    socketService.off('brandCreated', handleBrandCreated);
    socketService.off('brandUpdated', handleBrandUpdated);
    socketService.off('brandDeleted', handleBrandDeleted);
  };
}, []);
```

---

## 📡 **SOCKET.IO EVENTS**

### **Events Emitted by Backend**

| Event | Description | Payload | Trigger |
|-------|-------------|---------|---------|
| `brandCreated` | New brand created | `{ brandId, name, logo, isActive, createdAt }` | AdminJS new action |
| `brandUpdated` | Brand updated | `{ brandId, name, logo, isActive, updatedAt }` | AdminJS edit action |
| `brandDeleted` | Brand deleted | `{ brandId, name }` | AdminJS delete action |

### **Events Received by Mobile App**

| Event | Handler | Action |
|-------|---------|--------|
| `brandCreated` | `handleBrandCreated` | Refresh brands list |
| `brandUpdated` | `handleBrandUpdated` | Refresh brands list |
| `brandDeleted` | `handleBrandDeleted` | Refresh brands list |

---

## 🧪 **TESTING**

### **Test 1: Create New Brand**

1. **Open AdminJS**: `http://localhost:4000/admin`
2. **Navigate to**: Brands & Models → Brand
3. **Click**: "Create new"
4. **Fill in**:
   - Name: "Sony"
   - Contact Email: "support@sony.com"
   - Preferred Communication: Email
   - Is Active: ✓
5. **Click**: "Save"

**Expected Result:**
- ✅ Backend logs: `⚡ Socket event emitted: brandCreated - Sony`
- ✅ Mobile app logs: `⚡ New brand created: { brandId: ..., name: 'Sony', ... }`
- ✅ Mobile app logs: `✅ Brands loaded: ['Samsung', 'LG', 'Whirlpool', 'Oppo', 'Sony']`
- ✅ Brand picker in mobile app shows "Sony" immediately

---

### **Test 2: Update Existing Brand**

1. **Open AdminJS**: `http://localhost:4000/admin`
2. **Navigate to**: Brands & Models → Brand
3. **Click**: Edit on "Samsung"
4. **Change**: Is Active to ✗ (unchecked)
5. **Click**: "Save"

**Expected Result:**
- ✅ Backend logs: `⚡ Socket event emitted: brandUpdated - Samsung`
- ✅ Mobile app logs: `⚡ Brand updated: { brandId: ..., name: 'Samsung', isActive: false }`
- ✅ Mobile app refreshes brands
- ✅ "Samsung" disappears from brand picker (because isActive = false)

---

### **Test 3: Delete Brand**

1. **Open AdminJS**: `http://localhost:4000/admin`
2. **Navigate to**: Brands & Models → Brand
3. **Click**: Delete on "Oppo"
4. **Confirm**: Delete

**Expected Result:**
- ✅ Backend logs: `⚡ Socket event emitted: brandDeleted - Oppo`
- ✅ Mobile app logs: `⚡ Brand deleted: { brandId: ..., name: 'Oppo' }`
- ✅ Mobile app refreshes brands
- ✅ "Oppo" disappears from brand picker

---

## 🎯 **BENEFITS**

1. ✅ **No App Updates Required** - Add brands without releasing new app version
2. ✅ **Real-Time Sync** - Changes appear instantly in mobile app
3. ✅ **Better UX** - Users always see latest brands
4. ✅ **Scalable** - Easy to add/remove brands as business grows
5. ✅ **Consistent Data** - Single source of truth (MongoDB)

---

## 🔍 **TROUBLESHOOTING**

### **Brands not updating in mobile app?**

1. **Check Socket.IO connection**:
   - Mobile app logs should show: `✅ Socket connected: <socket-id>`
   
2. **Check backend logs**:
   - Should show: `⚡ Socket event emitted: brandCreated - <brand-name>`
   
3. **Check mobile app logs**:
   - Should show: `⚡ New brand created: { ... }`
   - Should show: `✅ Brands loaded: [...]`

4. **Verify API endpoint**:
   ```bash
   curl http://localhost:4000/api/v1/brands
   ```

5. **Check brand isActive status**:
   - Only brands with `isActive: true` appear in mobile app

---

## 📚 **RELATED FILES**

- **Backend**: `backend/src/admin/admin.js` - AdminJS configuration with Socket.IO hooks
- **Backend**: `backend/src/routes/brandRoutes.js` - Brand API endpoints
- **Backend**: `backend/src/models/Brand.js` - Brand Mongoose model
- **Mobile**: `mobile/src/screens/BookingFormScreen.tsx` - Booking form with dynamic brands
- **Mobile**: `mobile/src/services/socketService.ts` - Socket.IO client service

---

**Implementation Date**: 2025-11-12  
**Status**: ✅ **LIVE AND OPERATIONAL**  
**Version**: 1.0.0

