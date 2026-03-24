export interface Coupon {
  id: string;
  title: string;
  description: string;
  code: string;
  category: "flat" | "percent" | "bogo" | "combo";
  /** For "flat": fixed ₹ off; for "percent": % off */
  discount: number;
  /** Minimum cart subtotal to be eligible */
  minOrder?: number;
  /** Cap on max discount for percent coupons */
  maxDiscount?: number;
  /** Canteen id this coupon applies to, or "all" */
  canteenId: string;
  canteenName: string;
  validUntil: string;
  /** Max times a user can redeem this coupon per calendar month */
  monthlyLimit: number;
}

export const COUPONS: Coupon[] = [
  {
    id: "c1",
    title: "Flat ₹50 Off",
    description: "On orders above ₹200 from Hall 1 Canteen",
    discount: 50,
    code: "HALL1FIFTY",
    canteenId: "1",
    canteenName: "Hall 1 Canteen",
    validUntil: "2026-03-31",
    minOrder: 200,
    category: "flat",
    monthlyLimit: 3,
  },
  {
    id: "c2",
    title: "20% Off Breakfast",
    description: "20% off on all items from Hall 2 Canteen",
    discount: 20,
    code: "BREKKIE20",
    canteenId: "2",
    canteenName: "Hall 2 Canteen",
    validUntil: "2026-03-31",
    maxDiscount: 80,
    category: "percent",
    monthlyLimit: 4,
  },
  {
    id: "c3",
    title: "Buy 1 Get 1 Free",
    description: "50% off on orders from Hall 3 Canteen (BOGO)",
    discount: 50,
    code: "BOGOWED",
    canteenId: "3",
    canteenName: "Hall 3 Canteen",
    validUntil: "2026-04-30",
    category: "percent",
    maxDiscount: 120,
    monthlyLimit: 2,
  },
  {
    id: "c4",
    title: "Combo Saver",
    description: "Flat ₹30 off on orders above ₹150",
    discount: 30,
    code: "COMBO80",
    canteenId: "4",
    canteenName: "Hall 4 Canteen",
    validUntil: "2026-03-31",
    minOrder: 150,
    category: "flat",
    monthlyLimit: 5,
  },
  {
    id: "c5",
    title: "15% Off Biryani",
    description: "15% off on orders from Hall 5 Canteen",
    discount: 15,
    code: "BIRYANI15",
    canteenId: "5",
    canteenName: "Hall 5 Canteen",
    validUntil: "2026-04-15",
    maxDiscount: 60,
    category: "percent",
    monthlyLimit: 3,
  },
  {
    id: "c6",
    title: "Late Night ₹30 Off",
    description: "Flat ₹30 off on any order above ₹150",
    discount: 30,
    code: "LATENIGHT30",
    canteenId: "all",
    canteenName: "All Canteens",
    validUntil: "2026-06-30",
    minOrder: 150,
    category: "flat",
    monthlyLimit: 4,
  },
  {
    id: "c7",
    title: "Campus Welcome",
    description: "10% off on any canteen, no minimum order",
    discount: 10,
    code: "WELCOME10",
    canteenId: "all",
    canteenName: "All Canteens",
    validUntil: "2026-12-31",
    maxDiscount: 50,
    category: "percent",
    monthlyLimit: 2,
  },
  {
    id: "c8",
    title: "Flat ₹25 Off",
    description: "₹25 off on orders above ₹100 from any canteen",
    discount: 25,
    code: "SKIPQ25",
    canteenId: "all",
    canteenName: "All Canteens",
    validUntil: "2026-05-31",
    minOrder: 100,
    category: "flat",
    monthlyLimit: 3,
  },
];

// ------- Monthly usage tracking via localStorage -------

const STORAGE_KEY = "skipq_coupon_usage";

interface UsageRecord {
  [couponId: string]: { month: string; count: number };
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getUsageRecord(): UsageRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsageRecord(record: UsageRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

/** How many times a coupon has been used this month */
export function getCouponUsageThisMonth(couponId: string): number {
  const record = getUsageRecord();
  const entry = record[couponId];
  if (!entry || entry.month !== getCurrentMonth()) return 0;
  return entry.count;
}

/** Increment usage count for a coupon (call after successful order) */
export function recordCouponUsage(couponId: string) {
  const record = getUsageRecord();
  const month = getCurrentMonth();
  const entry = record[couponId];
  if (!entry || entry.month !== month) {
    record[couponId] = { month, count: 1 };
  } else {
    record[couponId] = { month, count: entry.count + 1 };
  }
  saveUsageRecord(record);
}

/** Calculate the discount amount for a given coupon and subtotal */
export function calculateCouponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.category === "flat") {
    return coupon.discount;
  }
  // percent / bogo / combo treated as percentage
  const raw = subtotal * (coupon.discount / 100);
  if (coupon.maxDiscount) return Math.min(raw, coupon.maxDiscount);
  return raw;
}
