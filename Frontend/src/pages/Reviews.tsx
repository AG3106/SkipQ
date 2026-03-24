import { useState, useEffect } from 'react';
import { Star, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

interface Review {
  id: string;
  dishId: string;
  dishName: string;
  canteenName: string;
  rating: number;
  comment: string;
  timestamp: number;
}

interface Suggestion {
  id: string;
  text: string;
  timestamp: number;
}

export function Reviews() {
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [suggestionText, setSuggestionText] = useState('');

  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem('skipq-orders') || '[]');
    const storedReviews = JSON.parse(localStorage.getItem('skipq-reviews') || '[]');
    const storedSuggestions = JSON.parse(localStorage.getItem('skipq-suggestions') || '[]');
    
    setOrders(storedOrders);
    setReviews(storedReviews);
    setSuggestions(storedSuggestions);
  }, []);

  const getOrderedDishes = () => {
    const dishes: any[] = [];
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const alreadyReviewed = reviews.some(r => r.dishId === item.id);
        if (!alreadyReviewed) {
          dishes.push({
            ...item,
            orderId: order.id,
            canteenName: order.canteenName,
          });
        }
      });
    });
    return dishes;
  };

  const orderedDishes = getOrderedDishes();

  const handleSubmitReview = () => {
    if (!selectedDish || rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    const review: Review = {
      id: `rev_${Date.now()}`,
      dishId: selectedDish.id,
      dishName: selectedDish.name,
      canteenName: selectedDish.canteenName,
      rating,
      comment,
      timestamp: Date.now(),
    };

    const updatedReviews = [review, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem('skipq-reviews', JSON.stringify(updatedReviews));

    setSelectedDish(null);
    setRating(0);
    setComment('');
    toast.success('Review submitted successfully!');
  };

  const handleSubmitSuggestion = () => {
    if (!suggestionText.trim()) {
      toast.error('Please enter a suggestion');
      return;
    }

    const suggestion: Suggestion = {
      id: `sug_${Date.now()}`,
      text: suggestionText,
      timestamp: Date.now(),
    };

    const updatedSuggestions = [suggestion, ...suggestions];
    setSuggestions(updatedSuggestions);
    localStorage.setItem('skipq-suggestions', JSON.stringify(updatedSuggestions));

    setSuggestionText('');
    toast.success('Thank you for your suggestion!');
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Reviews & Suggestions
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Rate Dishes */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Rate Your Orders
            </h2>

            {orderedDishes.length > 0 ? (
              <div className="space-y-4 mb-8">
                {orderedDishes.map(dish => (
                  <motion.button
                    key={`${dish.id}-${dish.orderId}`}
                    onClick={() => setSelectedDish(dish)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      selectedDish?.id === dish.id
                        ? 'border-[#D4725C] bg-[#D4725C]/5'
                        : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 hover:border-[#D4725C]/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{dish.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{dish.canteenName}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 mb-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No dishes to review. Order something first!
                </p>
              </div>
            )}

            {/* Review Form */}
            {selectedDish && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Rate {selectedDish.name}
                </h3>

                {/* Star Rating */}
                <div className="flex items-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {rating}.0
                    </span>
                  )}
                </div>

                {/* Comment */}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience (optional)"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50 resize-none mb-4"
                />

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedDish(null);
                      setRating(0);
                      setComment('');
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={rating === 0}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Review</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Suggestions */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Share Your Suggestions
            </h2>

            <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="w-5 h-5 text-[#D4725C]" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Help Us Improve
                </h3>
              </div>

              <textarea
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="Share your ideas to improve SkipQ..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50 resize-none mb-4"
              />

              <button
                onClick={handleSubmitSuggestion}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Suggestion</span>
              </button>
            </div>

            {/* My Reviews */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Reviews ({reviews.length})
              </h3>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{review.dishName}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{review.canteenName}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{review.rating}.0</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">"{review.comment}"</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.timestamp).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-gray-600 dark:text-gray-400">No reviews yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
