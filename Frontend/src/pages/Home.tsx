import { Link } from 'react-router';
import { ChefHat, Clock, Star, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { canteens } from '../data/canteens';
import { motion } from 'motion/react';

export function Home() {
  const user = JSON.parse(localStorage.getItem('skipq-user') || '{}');
  
  const popularDishes = canteens.flatMap(c => 
    c.menu
      .filter(m => m.tags?.includes('bestseller'))
      .slice(0, 2)
      .map(m => ({ ...m, canteenId: c.id, canteenName: c.name }))
  ).slice(0, 6);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#D4725C]/10 via-orange-50/50 to-rose-50/30 dark:from-[#D4725C]/5 dark:via-gray-800/50 dark:to-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-[#D4725C]/20 mb-6">
              <Sparkles className="w-4 h-4 text-[#D4725C]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Welcome back, {user.name || 'Student'}!
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Skip the Queue,
              <br />
              <span className="bg-gradient-to-r from-[#D4725C] to-orange-600 bg-clip-text text-transparent">
                Not the Taste
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Order from your favorite campus canteens and pick up your meal without waiting in line.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/canteens"
                className="group px-8 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-[#D4725C]/30 transition-all flex items-center space-x-2"
              >
                <span>Browse Canteens</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/search"
                className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white rounded-xl font-semibold border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                Search Dishes
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#D4725C]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl"></div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Clock,
              title: 'Quick Pickup',
              description: 'Order ahead and collect your food fresh and hot',
              color: 'from-blue-500 to-cyan-500'
            },
            {
              icon: ChefHat,
              title: 'Quality Food',
              description: 'Delicious meals from trusted campus canteens',
              color: 'from-[#D4725C] to-orange-600'
            },
            {
              icon: Star,
              title: 'Easy Ordering',
              description: 'Browse menus, add to cart, and pay with SkipQ Wallet',
              color: 'from-purple-500 to-pink-500'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-xl transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular Dishes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Trending Today
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Most popular dishes across campus
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-[#D4725C]" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularDishes.map((dish, index) => (
            <motion.div
              key={dish.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                to={`/menu/${dish.canteenId}`}
                className="group block relative overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-[#D4725C]/20 transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#D4725C] transition-colors">
                        {dish.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {dish.canteenName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#D4725C]/10">
                      <Star className="w-3 h-3 text-[#D4725C] fill-current" />
                      <span className="text-sm font-medium text-[#D4725C]">
                        {dish.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ₹{dish.price}
                    </span>
                    {dish.isVeg && (
                      <span className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                        Veg
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Canteens Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Our Canteens
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {canteens.length} locations across campus
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {canteens.map((canteen, index) => (
            <motion.div
              key={canteen.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={`/menu/${canteen.id}`}
                className="group block relative overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={canteen.image}
                    alt={canteen.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold mb-1">{canteen.name}</h3>
                  <p className="text-xs text-white/80">{canteen.location}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <Star className="w-3 h-3 fill-current text-yellow-400" />
                    <span className="text-sm">{canteen.rating}</span>
                    <span className="text-xs text-white/60">({canteen.totalReviews})</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
