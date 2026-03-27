export interface Review {
  id: string;
  dishId: string;
  dishName: string;
  rating: number;
  comment: string;
  userName: string;
  date: string;
}

export function getStoredReviews(): Review[] {
  try {
    const stored = localStorage.getItem("skipq_reviews");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getDishRating(dishId: string): { avg: number; count: number } {
  const reviews = getStoredReviews().filter((r) => r.dishId === dishId);
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { avg: sum / reviews.length, count: reviews.length };
}

export function getDishReviews(dishId: string): Review[] {
  return getStoredReviews().filter((r) => r.dishId === dishId);
}
