import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Shield, AlertCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

export function PinSetup() {
  const navigate = useNavigate();
  const { setPin } = useWallet();
  const [step, setStep] = useState(1);
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handlePinChange = (value: string, isConfirm: boolean) => {
    // Only allow numbers and max 4 digits
    if (value.length <= 4 && /^\d*$/.test(value)) {
      if (isConfirm) {
        setConfirmPin(value);
      } else {
        setPinValue(value);
      }
      setError('');
    }
  };

  const handleContinue = () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    setStep(2);
  };

  const handleConfirm = () => {
    if (confirmPin !== pin) {
      setError('PINs do not match');
      return;
    }

    setPin(pin);
    toast.success('Wallet PIN set successfully!');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4725C] to-orange-600 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Secure Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 1 ? 'Create a 4-digit PIN' : 'Confirm your PIN'}
          </p>
        </div>

        {/* PIN Setup Card */}
        <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-8">
          {step === 1 ? (
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Lock className="w-5 h-5 text-[#D4725C]" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create PIN
                </h2>
              </div>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value, false)}
                placeholder="Enter 4-digit PIN"
                className="w-full px-4 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-center text-3xl tracking-widest font-semibold mb-4 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                autoFocus
              />

              {/* PIN Dots */}
              <div className="flex justify-center space-x-3 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all ${
                      i < pin.length
                        ? 'bg-[#D4725C]'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={pin.length !== 4}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all disabled:opacity-50"
              >
                Continue
              </button>

              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  💡 Choose a PIN that's easy to remember but hard for others to guess.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Lock className="w-5 h-5 text-[#D4725C]" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirm PIN
                </h2>
              </div>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => handlePinChange(e.target.value, true)}
                placeholder="Re-enter PIN"
                className="w-full px-4 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-center text-3xl tracking-widest font-semibold mb-4 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                autoFocus
              />

              {/* PIN Dots */}
              <div className="flex justify-center space-x-3 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all ${
                      i < confirmPin.length
                        ? 'bg-[#D4725C]'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setConfirmPin('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirmPin.length !== 4}
                  className="flex-1 px-4 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="mt-6 p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Why do I need a PIN?
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Your PIN secures all wallet transactions and prevents unauthorized access to your funds.
          </p>
        </div>
      </motion.div>
    </div>
  );
}