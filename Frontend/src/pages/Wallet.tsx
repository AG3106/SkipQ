import { useState } from 'react';
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

export function Wallet() {
  const { balance, transactions, addMoney } = useWallet();
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amount, setAmount] = useState('');

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleAddMoney = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (value > 10000) {
      toast.error('Maximum amount is ₹10,000');
      return;
    }

    addMoney(value);
    toast.success(`₹${value.toFixed(2)} added to wallet!`);
    setAmount('');
    setShowAddMoney(false);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          SkipQ Wallet
        </h1>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D4725C] to-orange-600 p-8 mb-8 shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <WalletIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Available Balance</p>
                <h2 className="text-4xl font-bold text-white">₹{balance.toFixed(2)}</h2>
              </div>
            </div>

            <button
              onClick={() => setShowAddMoney(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-white text-[#D4725C] rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Money</span>
            </button>
          </div>
        </motion.div>

        {/* Add Money Modal */}
        {showAddMoney && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#D4725C]/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#D4725C]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Money</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose or enter amount</p>
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      amount === amt.toString()
                        ? 'bg-gradient-to-r from-[#D4725C] to-orange-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddMoney(false);
                    setAmount('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMoney}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Add Money
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Transactions */}
        <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Recent Transactions
          </h2>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((txn, index) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === 'credit'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      {txn.type === 'credit' ? (
                        <ArrowDownRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{txn.description}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(txn.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        txn.type === 'credit'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
