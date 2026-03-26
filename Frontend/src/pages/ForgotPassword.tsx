import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, ShieldCheck, LogIn } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';

type Step = 'email' | 'otp' | 'reset' | 'success';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpShake, setOtpShake] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-redirect to login after success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => navigate('/login'), 3000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (confirmPassword.length > 0) {
      setPasswordMatch(newPassword === confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [newPassword, confirmPassword]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setResendTimer(30);
      toast.success(`OTP sent to ${email}`);
      setStep('otp');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // No auto-advance — user must click "Verify OTP" button
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.verifyForgotPasswordOtp(email, otpCode);
      toast.success('OTP verified — now set your new password');
      setStep('reset');
    } catch (err) {
      setOtpShake(true);
      setTimeout(() => setOtpShake(false), 400);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setOtp(['', '', '', '', '', '']);
      setResendTimer(30);
      setError('');
      toast.success('New OTP sent!');
      otpRefs.current[0]?.focus();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to resend OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(email, otp.join(''), newPassword);
      toast.success('Password changed successfully!');
      setStep('success');
    } catch (err) {
      if (err instanceof ApiError) {
        // If OTP was invalid, send user back to OTP step
        if (err.message.toLowerCase().includes('otp')) {
          setOtp(['', '', '', '', '', '']);
          setStep('otp');
          toast.error(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError('Password reset failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
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
            {step === 'success' ? (
              <CheckCircle2 className="w-8 h-8 text-white" />
            ) : step === 'reset' ? (
              <Lock className="w-8 h-8 text-white" />
            ) : step === 'otp' ? (
              <KeyRound className="w-8 h-8 text-white" />
            ) : (
              <Mail className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'reset' && 'Reset Password'}
            {step === 'success' && 'Password Reset!'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'email' && 'Enter your registered email address'}
            {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
            {step === 'reset' && 'Create your new password'}
            {step === 'success' && 'Your password has been updated successfully'}
          </p>
        </div>

        {/* Step Progress */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {['email', 'otp', 'reset'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${s === step
                      ? 'bg-[#D4725C] text-white scale-110'
                      : ['email', 'otp', 'reset'].indexOf(step) > i
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                >
                  {['email', 'otp', 'reset'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-8 h-0.5 ${['email', 'otp', 'reset'].indexOf(step) > i
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Email */}
            {step === 'email' && (
              <motion.form
                key="email"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleEmailSubmit}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="student@university.edu"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span>Send OTP</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <Link to="/login" className="text-sm text-[#D4725C] font-semibold hover:underline inline-flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </motion.form>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-[#D4725C]" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter Verification Code
                  </span>
                </div>

                {/* OTP instructions */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-center">
                  <p className="text-sm text-blue-700 dark:text-blue-400">Check your email for the 6-digit verification code</p>
                </div>

                <motion.div
                  className="flex justify-center gap-3"
                  animate={otpShake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 rounded-xl text-center text-2xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50 ${error
                          ? 'border-red-400 dark:border-red-500'
                          : digit
                            ? 'border-[#D4725C] dark:border-[#D4725C]'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      autoFocus={i === 0}
                    />
                  ))}
                </motion.div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 dark:text-red-400 text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Didn't receive the code?{' '}
                    {resendTimer > 0 ? (
                      <span className="text-gray-400 dark:text-gray-500">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        className="text-[#D4725C] font-semibold hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </p>
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.some((d: string) => d === '') || isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Verify OTP</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setStep('email');
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                  }}
                  className="w-full text-center text-sm text-[#D4725C] font-semibold hover:underline inline-flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change Email
                </button>
              </motion.div>
            )}

            {/* Step 3: Reset Password */}
            {step === 'reset' && (
              <motion.form
                key="reset"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleResetPassword}
                className="space-y-6"
              >
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                      required
                      autoFocus
                    />
                  </div>
                  {newPassword.length > 0 && newPassword.length < 8 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Password must be at least 8 characters
                    </p>
                  )}
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
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Re-enter your new password"
                      className={`w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50 transition-colors ${passwordMatch === null
                          ? 'border-gray-200 dark:border-gray-600'
                          : passwordMatch
                            ? 'border-green-400 dark:border-green-500'
                            : 'border-red-400 dark:border-red-500'
                        }`}
                      required
                    />
                    {passwordMatch !== null && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {passwordMatch ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <span className="text-red-500 text-sm font-medium">✕</span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Match indicator dash */}
                  <motion.div
                    className="mt-2 h-1 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
                  >
                    <motion.div
                      className={`h-full rounded-full ${passwordMatch === null
                          ? 'bg-gray-300 dark:bg-gray-600'
                          : passwordMatch
                            ? 'bg-green-500'
                            : 'bg-red-400'
                        }`}
                      initial={{ width: '0%' }}
                      animate={{
                        width:
                          confirmPassword.length === 0
                            ? '0%'
                            : passwordMatch
                              ? '100%'
                              : `${Math.min((confirmPassword.length / newPassword.length) * 100, 90)}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                  {passwordMatch !== null && (
                    <p className={`text-xs mt-1 ${passwordMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {passwordMatch ? 'Passwords match!' : 'Passwords do not match'}
                    </p>
                  )}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={!passwordMatch || newPassword.length < 8 || isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-5 h-5" />
                  <span>Set New Password</span>
                </button>
              </motion.form>
            )}

            {/* Step 4: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </motion.div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    All Set!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Your password has been changed successfully. You can now sign in with your new password.
                  </p>
                </div>

                {/* Success bar */}
                <motion.div
                  className="h-1.5 rounded-full bg-green-500 mx-auto"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />

                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Back to Login</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}