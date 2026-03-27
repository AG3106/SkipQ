# Frontend Changes Required — File/Image Integration

This document lists all frontend changes needed to integrate with the backend's new file storage system.

---

## 1. Canteen Images — Display from Backend

**Current state**: Canteen cards/headers use hardcoded Unsplash URLs or placeholder backgrounds.

**Backend provides**: `image_url` field in canteen API responses (e.g. `/files/canteen_images/3.jpg` or `null`).

### Files to update:

| File                  | What to change                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HostelSelection.tsx` | Replace hardcoded `src="https://images.unsplash.com/..."` on canteen cards with `canteen.image_url` from API. Use a fallback placeholder if `image_url` is `null`. |
| `SearchResults.tsx`   | Same — canteen image cards currently use a static Unsplash URL. Use `canteen.image_url`.                                                                           |
| `data/data.ts`        | The `Hostel` interface has an `image: string` field that's always `""`. Once fetching from API, this field should come from `image_url` on the backend response.   |

### How to construct the full URL:
```ts
const API_BASE = "http://localhost:8000";
const canteenImageUrl = canteen.image_url 
  ? `${API_BASE}${canteen.image_url}` 
  : "/placeholder-canteen.jpg";
```

---

## 2. Dish Images — Display from Backend

**Current state**: Dish images use `getImageForCategory()` which maps category → hardcoded Unsplash URLs. The `FoodItem.image` field is always `""`.

**Backend provides**: `photo_url` field in dish/menu API responses (e.g. `/files/dish_images/42.jpg` or `null`).

### Files to update:

| File                  | What to change                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MenuBrowsing.tsx`    | Replace `getImageForCategory(item.category)` with `item.photo_url` from API response. Fall back to category-based image if `photo_url` is `null`. |
| `SearchResults.tsx`   | Same pattern — use `item.photo_url` for dish images.                                                                                              |
| `Cart.tsx`            | Uses `getImageForCategory()` for cart item images. Use `cartItem.photo_url` instead.                                                              |
| `HostelSelection.tsx` | The `DishCard` component uses Unsplash URLs. Use `dish.photo_url`.                                                                                |
| `data/data.ts`        | `FoodItem` interface — add `photo_url?: string` field.                                                                                            |

### How to construct the full URL:
```ts
const dishImageUrl = dish.photo_url
  ? `${API_BASE}${dish.photo_url}`
  : getImageForCategory(dish.category); // existing fallback
```

---

## 3. Menu Management — Actual Photo Upload

**Current state**: `MenuManagement.tsx` has a drag-and-drop upload UI but it's purely cosmetic — no file handling logic.

### Changes needed in `MenuManagement.tsx`:

1. **Add file state** to the form:
   ```ts
   const [photoFile, setPhotoFile] = useState<File | null>(null);
   ```

2. **Wire the upload area** to an actual `<input type="file">`:
   ```tsx
   <input type="file" accept="image/jpeg,image/png" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
   ```

3. **Send as `FormData`** when adding/editing a dish:
   ```ts
   const formData = new FormData();
   formData.append("name", formData.name);
   formData.append("price", formData.price);
   // ... other fields
   if (photoFile) formData.append("photo", photoFile);
   
   await fetch(`${API_BASE}/api/canteens/${canteenId}/menu/add/`, {
     method: "POST",
     body: formData,
     credentials: "include",
   });
   ```

4. **Show preview**: Display a thumbnail of the selected file before upload.

5. **Connect to real API** instead of local state manipulation — currently all add/edit/delete operations modify a local `menuItems` array.

---

## 4. Canteen Registration — Image & Document Upload

**Current state**: No canteen registration form exists in the frontend yet.

### What to build:

A registration form page for managers that submits `multipart/form-data` to `POST /api/canteens/register/` with:

| Field                | Type         | Required | Notes                              |
| -------------------- | ------------ | -------- | ---------------------------------- |
| `name`               | text         | Yes      | Canteen name                       |
| `location`           | text         | Yes      | Canteen location                   |
| `opening_time`       | time         | Yes      | Format: `HH:MM`                    |
| `closing_time`       | time         | Yes      | Format: `HH:MM`                    |
| `image`              | file (image) | No       | Canteen cover photo (JPG/PNG)      |
| `aadhar_card`        | file         | **Yes**  | Aadhar card of the canteen manager |
| `hall_approval_form` | file         | **Yes**  | Hall Approval Form                 |

### Example submission:
```ts
const formData = new FormData();
formData.append("name", "Hall 5 Canteen");
formData.append("location", "Hall 5 Building");
formData.append("opening_time", "14:00");
formData.append("closing_time", "02:00");
formData.append("image", canteenImageFile);
formData.append("aadhar_card", aadharFile);
formData.append("hall_approval_form", hallFormFile);

await fetch(`${API_BASE}/api/canteens/register/`, {
  method: "POST",
  body: formData,
  credentials: "include",
});
```

---

## 5. Admin Document Viewer

**Current state**: No document viewing UI for admin.

### What to build:

When admin reviews a pending canteen registration, show download links for the two documents.

**API endpoint**: `GET /api/canteens/<id>/documents/`

**Response format**:
```json
{
  "canteen_id": 3,
  "canteen_name": "Hall 5 Canteen",
  "documents": {
    "aadhar_card": "/files/documents/3/aadhar_card.pdf",
    "hall_approval_form": "/files/documents/3/hall_approval_form.pdf"
  },
  "status": "UNDER_REVIEW"
}
```

**Download endpoint**: `GET /api/canteens/<id>/documents/<filename>/` (requires admin session).

---

## 6. Replace Mock Data with API Calls

**Current state**: Several pages use local mock data from `data/data.ts` instead of fetching from the backend.

### Pages that need API integration:

| Page                  | Currently uses                         | Should fetch from                         |
| --------------------- | -------------------------------------- | ----------------------------------------- |
| `HostelSelection.tsx` | `hostels` array from `data.ts`         | `GET /api/canteens/`                      |
| `MenuBrowsing.tsx`    | `foodItems` from `data.ts`             | `GET /api/canteens/<id>/menu/`            |
| `MenuManagement.tsx`  | `foodItems` from `data.ts`             | `GET /api/canteens/<id>/menu/`            |
| `SearchResults.tsx`   | `hostels` + `foodItems` from `data.ts` | `GET /api/canteens/` + search             |
| `Cart.tsx`            | Local cart state                       | Should persist cart and use API dish data |

---

## Summary of New Backend API Fields

### Canteen object (`GET /api/canteens/`, `GET /api/canteens/<id>/`):
```diff
+ "image_url": "/files/canteen_images/3.jpg"  // or null
```

### Dish object (`GET /api/canteens/<id>/menu/`):
```diff
+ "photo_url": "/files/dish_images/42.jpg"  // or null
```

### Registration (`POST /api/canteens/register/`):
```diff
- Content-Type: application/json
+ Content-Type: multipart/form-data
+ Fields: image, aadhar_card, hall_approval_form (file uploads)
```

### Documents (`GET /api/canteens/<id>/documents/`):
```diff
- "document_url": "/media/canteen_docs/file.pdf"
+ "documents": { "aadhar_card": "...", "hall_approval_form": "..." }
```