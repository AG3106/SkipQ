import { Star, Flame, Clock, Plus } from 'lucide-react';
import type { MenuItem } from '../data/canteens';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

interface MenuCardProps {
  item: MenuItem;
  canteenId: string;
  canteenName: string;
}

export function MenuCard({ item, canteenId, canteenName }: MenuCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(item, canteenId, canteenName);
    toast.success(`${item.name} added to cart!`, {
      duration: 2000,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all"
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {item.isVeg && (
            <span className="px-2 py-1 rounded-md bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium">
              Veg
            </span>
          )}
          {item.tags?.includes('bestseller') && (
            <span className="px-2 py-1 rounded-md bg-[#D4725C]/90 backdrop-blur-sm text-white text-xs font-medium">
              Bestseller
            </span>
          )}
          {item.tags?.includes('quick') && (
            <span className="px-2 py-1 rounded-md bg-blue-500/90 backdrop-blur-sm text-white text-xs font-medium flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Quick</span>
            </span>
          )}
        </div>

        {/* Spicy Level */}
        {item.spicyLevel && item.spicyLevel > 0 && (
          <div className="absolute top-3 right-3 flex items-center space-x-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
            {[...Array(item.spicyLevel)].map((_, i) => (
              <Flame key={i} className="w-3 h-3 text-red-500 fill-current" />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#D4725C] transition-colors mb-1">
              {item.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>

        {/* Rating & Prep Time */}
        <div className="flex items-center space-x-3 mb-3">
          {item.rating && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.rating}
              </span>
              {item.reviewCount && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({item.reviewCount})
                </span>
              )}
            </div>
          )}
          {item.preparationTime && (
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{item.preparationTime}</span>
            </div>
          )}
        </div>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹{item.price}
          </span>
          <button
            onClick={handleAddToCart}
            className="group/btn flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all"
          >
            <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
