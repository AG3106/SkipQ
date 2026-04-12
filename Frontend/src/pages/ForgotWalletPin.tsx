import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { KeyRound, Lock, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import * as walletApi from '../api/wallet';
import { ApiError } from '../api/client';

type Step = 'send' | 'otp' | 'reset' | 'success';

export default function ForgotWalletPin() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('send');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [otpShake, setOtpShake] = useState(false);
    const [pinMatch, setPinMatch] = useState<boolean | null>(null);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-redirect after success
    useEffect(() => {
        if (step === 'success') {
            const timer = setTimeout(() => navigate('/wallet'), 3000);
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
        if (confirmPin.length > 0) {
            setPinMatch(newPin === confirmPin);
        } else {
            setPinMatch(null);
        }
    }, [newPin, confirmPin]);

    const handleSendOtp = async () => {
        setError('');
        setIsLoading(true);
        try {
            await walletApi.forgotWalletPin();
            setResendTimer(30);
            toast.success('OTP sent to your registered email');
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

    const handleVerifyAndProceed = () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }
        setError('');
        setStep('reset');
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setIsLoading(true);
        try {
            await walletApi.forgotWalletPin();
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

    const handleResetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPin.length < 4 || newPin.length > 6) {
            setError('PIN must be 4 to 6 digits.');
            return;
        }
        if (!/^\d+$/.test(newPin)) {
            setError('PIN must contain only digits.');
            return;
        }
        if (newPin !== confirmPin) {
            setError('PINs do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await walletApi.resetWalletPin(otp.join(''), newPin);
            toast.success('Wallet PIN reset successfully!');
            setStep('success');
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.message.toLowerCase().includes('otp')) {
                    setOtp(['', '', '', '', '', '']);
                    setStep('otp');
                    toast.error(err.message);
                } else {
                    setError(err.message);
                }
            } else {
                setError('PIN reset failed. Please try again.');
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
                        ) : (
                            <KeyRound className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {step === 'send' && 'Forgot Wallet PIN'}
                        {step === 'otp' && 'Verify OTP'}
                        {step === 'reset' && 'Set New PIN'}
                        {step === 'success' && 'PIN Reset!'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {step === 'send' && 'We will send a verification code to your registered email'}
                        {step === 'otp' && 'Enter the 6-digit code sent to your email'}
                        {step === 'reset' && 'Create your new wallet PIN'}
                        {step === 'success' && 'Your wallet PIN has been reset successfully'}
                    </p>
                </div>

                {/* Step Progress */}
                {step !== 'success' && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {['send', 'otp', 'reset'].map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${s === step
                                        ? 'bg-[#D4725C] text-white scale-110'
                                        : ['send', 'otp', 'reset'].indexOf(step) > i
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {['send', 'otp', 'reset'].indexOf(step) > i ? '✓' : i + 1}
                                </div>
                                {i < 2 && (
                                    <div
                                        className={`w-8 h-0.5 ${['send', 'otp', 'reset'].indexOf(step) > i
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
                        {/* Step 1: Send OTP */}
                        {step === 'send' && (
                            <motion.div
                                key="send"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                    Click the button below to receive a one-time verification code on your registered email. You will use this code to set a new Wallet PIN.
                                </p>

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-red-600 dark:text-red-400 text-center"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                <button
                                    onClick={handleSendOtp}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            <KeyRound className="w-5 h-5" />
                                            <span>Send OTP</span>
                                        </>
                                    )}
                                </button>

                                <div className="text-center">
                                    <Link to="/wallet" className="text-sm text-[#D4725C] font-semibold hover:underline inline-flex items-center gap-1">
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Wallet
                                    </Link>
                                </div>
                            </motion.div>
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
                                    onClick={handleVerifyAndProceed}
                                    disabled={otp.some((d: string) => d === '') || isLoading}
                                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5" />
                                            <span>Continue</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setStep('send');
                                        setOtp(['', '', '', '', '', '']);
                                        setError('');
                                    }}
                                    className="w-full text-center text-sm text-[#D4725C] font-semibold hover:underline inline-flex items-center justify-center gap-1"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Go Back
                                </button>
                            </motion.div>
                        )}

                        {/* Step 3: New PIN */}
                        {step === 'reset' && (
                            <motion.form
                                key="reset"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                onSubmit={handleResetPin}
                                className="space-y-6"
                            >
                                {/* New PIN */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        New Wallet PIN
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={newPin}
                                            onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                                            placeholder="4 to 6 digits"
                                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                                            required
                                            autoFocus
                                            inputMode="numeric"
                                            maxLength={6}
                                        />
                                    </div>
                                    {newPin.length > 0 && newPin.length < 4 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                            PIN must be at least 4 digits
                                        </p>
                                    )}
                                </div>

                                {/* Confirm PIN */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm New PIN
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={confirmPin}
                                            onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                                            placeholder="Re-enter your new PIN"
                                            className={`w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50 transition-colors ${pinMatch === null
                                                ? 'border-gray-200 dark:border-gray-600'
                                                : pinMatch
                                                    ? 'border-green-400 dark:border-green-500'
                                                    : 'border-red-400 dark:border-red-500'
                                                }`}
                                            required
                                            inputMode="numeric"
                                            maxLength={6}
                                        />
                                        {pinMatch !== null && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                {pinMatch ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <span className="text-red-500 text-sm font-medium">✕</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {pinMatch !== null && (
                                        <p className={`text-xs mt-1 ${pinMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {pinMatch ? 'PINs match!' : 'PINs do not match'}
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
                                    disabled={!pinMatch || newPin.length < 4 || isLoading}
                                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Lock className="w-5 h-5" />
                                    <span>Set New PIN</span>
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
                                        Your wallet PIN has been reset. You can now use your new PIN for transactions.
                                    </p>
                                </div>

                                <motion.div
                                    className="h-1.5 rounded-full bg-green-500 mx-auto"
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                />

                                <button
                                    onClick={() => navigate('/wallet')}
                                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all"
                                >
                                    <KeyRound className="w-5 h-5" />
                                    <span>Back to Wallet</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
