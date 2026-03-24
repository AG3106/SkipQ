import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Package, Clock, CheckCircle2, ShoppingBag } from 'lucide-react';
import { TrackOrderSidebar } from '../components/TrackOrderSidebar';
import { motion } from 'motion/react';

interface Order {
  id: string;
  items: any[];
  total: number;
  status: string;
  timestamp: number;
  canteenName: string;
}

export function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('skipq-orders');
    setOrders(stored ? JSON.parse(stored) : []);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'Preparing':
        return <Package className="w-5 h-5 text-orange-600" />;
      case 'Ready for Pickup':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'Collected':
        return <CheckCircle2 className="w-5 h-5 text-gray-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'Preparing':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'Ready for Pickup':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'Collected':
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No orders yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start ordering from your favorite canteens!
          </p>
          <button
            onClick={() => navigate('/canteens')}
            className="px-6 py-3 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Browse Canteens
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            My Orders
          </h1>

          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {order.id}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.canteenName}
                      </p>
                    </div>
                    {getStatusIcon(order.status)}
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                      <p className="text-xl font-bold text-[#D4725C]">₹{order.total.toFixed(2)}</p>
                    </div>
                    {order.status !== 'Collected' && (
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-6 py-2 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        Track Order
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Track Order Sidebar */}
      {selectedOrder && (
        <TrackOrderSidebar
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
