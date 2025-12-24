# Category-Brand Mapping - Quick Reference Guide

## 🎯 What Changed?

Before: One brand could only belong to ONE category  
Now: One brand can serve MULTIPLE categories

## 📊 Current Setup

```
Washing Machines ┬─ LG
                 ├─ Samsung
                 └─ Whirlpool

Air Conditioning ┬─ LG
                 └─ Samsung

Refrigerator ┬─ LG
             ├─ Samsung
             └─ Whirlpool
```

## 📱 Mobile App User Experience

**Before**: All brands shown regardless of category
**Now**: Only relevant brands shown for selected category

```
User selects "Air Conditioning" 
  ↓
App fetches brands for Air Conditioning category
  ↓
Brand dropdown shows: LG, Samsung (Whirlpool hidden)
  ↓
User can only select mapped brands
```

## 🔧 Quick Operations

### Add a New Brand
1. Go to AdminJS Dashboard
2. Brands & Models → Brand → Create
3. Fill in name, email, WhatsApp, etc.
4. **NEW**: Select "Product categories" this brand serves
5. Save

### Modify Brand's Categories
1. AdminJS → Brands & Models → Brand → Edit
2. Scroll to "Product categories" section
3. Check/uncheck desired categories
4. Save

### Check What Categories a Brand Serves
```bash
curl http://localhost:4000/api/v1/brands/{brandId}
```

Response includes:
```json
{
  "name": "LG",
  "categories": [
    { "name": "Washing Machines", ... },
    { "name": "Air Conditioning", ... },
    { "name": "Refrigerator", ... }
  ]
}
```

### Get Brands for a Category
```bash
curl http://localhost:4000/api/v1/brands/category/{categoryId}
```

## 🚀 Key Benefits

| Benefit | Details |
|---------|---------|
| **User Experience** | Users see only relevant brands |
| **Data Accuracy** | No mismatched brand-category pairs |
| **Easy Management** | AdminJS multi-select for easy updates |
| **Scalability** | Add new brands/categories without code |
| **Performance** | Server-side filtering reduces data |

## ⚙️ Technical Details

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/categories` | GET | Get all categories |
| `/api/v1/brands` | GET | Get all brands |
| `/api/v1/brands/{id}` | GET | Get brand details with categories |
| `/api/v1/brands/category/{categoryId}` | GET | Get brands for category |

### Database Schema

**Brand Collection** (Updated):
```javascript
{
  name: String,
  logo: String,
  categories: [ObjectId],  // ← NEW: Array of category IDs
  contactEmail: String,
  whatsappNumber: String,
  // ... other fields
}
```

## 📋 Files Modified

| File | Change | Impact |
|------|--------|--------|
| `backend/src/models/Brand.js` | categories array | Stores multiple category refs |
| `backend/src/routes/brandRoutes.js` | $in operator | Filters brands by category |
| `backend/src/admin/admin.js` | categories field | AdminJS multi-select UI |
| `mobile/src/screens/BookingFormScreen.tsx` | fetchBrandsByCategory | Dynamic filtering |

## 🧪 Quick Test

```bash
# Get Washing Machines ID
curl http://localhost:4000/api/v1/categories | jq '.data[] | select(.name=="Washing Machines") | ._id'

# Get brands for Washing Machines (should show 3)
curl http://localhost:4000/api/v1/brands/category/{categoryId}

# Get brands for Air Conditioning (should show 2 - no Whirlpool)
curl http://localhost:4000/api/v1/brands/category/{ac-categoryId}
```

## ✅ Verification

- [x] Categories stored in brands array
- [x] API filters correctly
- [x] Mobile app shows correct brands
- [x] AdminJS allows editing categories
- [x] Unmapped brands never shown
- [x] All booking fields work correctly

## 🎓 Example Workflow

1. **Admin creates new brand**: "Daikin" (AC company)
2. **Admin maps to categories**: Select only "Air Conditioning"
3. **User opens mobile app**
4. **User selects "Air Conditioning"** category
5. **App fetches brands for AC**: Shows LG, Samsung, Daikin (Whirlpool excluded)
6. **User selects "Daikin"** from dropdown
7. **Booking saved** with Daikin as brand for Air Conditioning category

## 🔒 Guarantees

✅ Every brand belongs to at least one category  
✅ Users cannot select unmapped brands  
✅ Only active brands/categories shown  
✅ Category mappings managed from AdminJS  
✅ API validates category IDs  

## 📞 Support

For issues or questions about category-brand mappings:
1. Check AdminJS Brands resource
2. Review brand categories field
3. Verify category IDs in categories endpoint
4. Check mobile app logs for fetch errors
