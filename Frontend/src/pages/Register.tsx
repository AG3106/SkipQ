import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { UserPlus, Mail, Lock, User, Phone, Sparkles, ArrowRight, ShieldCheck, RotateCcw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const startOtpTimer = () => {
    setOtpTimer(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateAndSendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    // In production, this would send a real email
    console.log(`OTP for ${formData.email}: ${code}`);
    toast.success(`OTP sent to ${formData.email}`, {
      description: `Demo OTP: ${code}`,
      duration: 8000,
    });
    startOtpTimer();
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Move to OTP step
    generateAndSendOtp();
    setStep('otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    if (enteredOtp !== generatedOtp) {
      toast.error('Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
      return;
    }

    // OTP verified — create user
    const user = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: '',
      joinDate: new Date().toISOString(),
    };

    localStorage.setItem('skipq-user', JSON.stringify(user));
    toast.success('Email verified! Account created successfully!');
    navigate('/pin-setup');
  };

  const handleResendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    generateAndSendOtp();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4725C] to-orange-600 mb-4">
            {step === 'details' ? (
              <Sparkles className="w-8 h-8 text-white" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#D4725C] to-orange-600 bg-clip-text text-transparent">
            {step === 'details' ? 'Join SkipQ' : 'Verify Email'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {step === 'details'
              ? 'Create your account'
              : `Enter the OTP sent to ${formData.email}`}
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {['Details', 'Verify', 'PIN'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i === 0 && step === 'details' ? 'bg-[#D4725C] text-white' :
                i === 1 && step === 'otp' ? 'bg-[#D4725C] text-white' :
                i === 0 && step === 'otp' ? 'bg-green-500 text-white' :
                'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {i === 0 && step === 'otp' ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                (i === 0 && step === 'details') || (i === 1 && step === 'otp')
                  ? 'text-[#D4725C]'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>{label}</span>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 rounded" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'details' ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-8"
            >
              <form onSubmit={handleDetailsSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="student@university.edu"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 234 567 8900"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                      required
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1.5 ml-1">Passwords do not match</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#D4725C] font-semibold hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-8"
            >
              <div className="space-y-6">
                {/* OTP illustration */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4725C]/10 dark:bg-[#D4725C]/20 mb-4">
                    <Mail className="w-8 h-8 text-[#D4725C]" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We've sent a 6-digit verification code to
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                    {formData.email}
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none ${
                        digit
                          ? 'border-[#D4725C] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 text-gray-900 dark:text-white'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      } focus:border-[#D4725C] focus:ring-2 focus:ring-[#D4725C]/30`}
                    />
                  ))}
                </div>

                {/* Timer & Resend */}
                <div className="text-center">
                  {canResend ? (
                    <button
                      onClick={handleResendOtp}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#D4725C] hover:underline"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Resend OTP
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Resend OTP in{' '}
                      <span className="font-bold text-[#D4725C]">{otpTimer}s</span>
                    </p>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.some((d) => !d)}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Verify & Create Account</span>
                </button>

                {/* Back button */}
                <button
                  onClick={() => {
                    setStep('details');
                    setOtp(['', '', '', '', '', '']);
                  }}
                  className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-[#D4725C] transition-colors font-medium"
                >
                  ← Back to details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}