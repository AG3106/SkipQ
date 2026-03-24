import { useParams, useNavigate } from 'react-router';
import { useState } from 'react';
import { MapPin, Clock, Star, ChevronLeft, Search } from 'lucide-react';
import { canteens } from '../data/canteens';
import { MenuCard } from '../components/MenuCard';
import { motion } from 'motion/react';

export function Menu() {
  const { canteenId } = useParams();
  const navigate = useNavigate();
  const canteen = canteens.find(c => c.id === canteenId);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (!canteen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Canteen not found
          </h2>
          <button
            onClick={() => navigate('/canteens')}
            className="text-[#D4725C] hover:underline"
          >
            Back to Canteens
          </button>
        </div>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(canteen.menu.map(item => item.category)))];
  
  const filteredMenu = canteen.menu.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={canteen.image}
          alt={canteen.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <button
              onClick={() => navigate('/canteens')}
              className="flex items-center space-x-2 text-white/90 hover:text-white mb-4 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Canteens</span>
            </button>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl font-bold text-white mb-3">
                {canteen.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{canteen.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{canteen.openTime} - {canteen.closeTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span>{canteen.rating} ({canteen.totalReviews} reviews)</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#D4725C] to-orange-600 text-white shadow-lg'
                    : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        {filteredMenu.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                canteenId={canteen.id}
                canteenName={canteen.name}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500 dark:text-gray-400">
              No items found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
