import { Link } from 'react-router';
import { MapPin, Clock, Star, ChevronRight } from 'lucide-react';
import { canteens } from '../data/canteens';
import { motion } from 'motion/react';

export function Canteens() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Campus Canteens
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Explore {canteens.length} canteens across campus
          </p>
        </motion.div>

        {/* Canteens Grid */}
        <div className="space-y-6">
          {canteens.map((canteen, index) => (
            <motion.div
              key={canteen.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={`/menu/${canteen.id}`}
                className="group block relative overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-[#D4725C]/20 transition-all"
              >
                <div className="md:flex">
                  {/* Image */}
                  <div className="md:w-1/3 aspect-[16/10] md:aspect-auto overflow-hidden">
                    <img
                      src={canteen.image}
                      alt={canteen.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Content */}
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-[#D4725C] transition-colors mb-2">
                          {canteen.name}
                        </h2>
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{canteen.location}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-[#D4725C] group-hover:translate-x-1 transition-all" />
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {canteen.description}
                    </p>

                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100/80 dark:bg-gray-700/50">
                        <Clock className="w-4 h-4 text-[#D4725C]" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Hours</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {canteen.openTime} - {canteen.closeTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100/80 dark:bg-gray-700/50">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {canteen.rating} ({canteen.totalReviews} reviews)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Popular Dishes */}
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Popular dishes:</p>
                      <div className="flex flex-wrap gap-2">
                        {canteen.popularDishes.map((dish) => (
                          <span
                            key={dish}
                            className="px-3 py-1 rounded-full bg-[#D4725C]/10 text-[#D4725C] text-sm font-medium"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
