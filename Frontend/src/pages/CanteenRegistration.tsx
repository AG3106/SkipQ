import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Image as ImageIcon,
  FileText,
  Upload,
  CheckCircle2,
  Sun,
  Moon,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { API_BASE } from '../data/data';

interface FileUploadState {
  file: File | null;
  preview: string | null;
  name: string;
}

export default function CanteenRegistration() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    opening_time: '',
    closing_time: '',
  });

  const [canteenImage, setCanteenImage] = useState<FileUploadState>({ file: null, preview: null, name: '' });
  const [aadharCard, setAadharCard] = useState<FileUploadState>({ file: null, preview: null, name: '' });
  const [hallApprovalForm, setHallApprovalForm] = useState<FileUploadState>({ file: null, preview: null, name: '' });

  const canteenImageRef = useRef<HTMLInputElement>(null);
  const aadharRef = useRef<HTMLInputElement>(null);
  const hallFormRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileUploadState>>,
    acceptImages = false
  ) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const preview = acceptImages && file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null;

    setter({ file, preview, name: file.name });
  };

  const clearFile = (setter: React.Dispatch<React.SetStateAction<FileUploadState>>) => {
    setter({ file: null, preview: null, name: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aadharCard.file) {
      toast.error('Aadhar Card is required');
      return;
    }
    if (!hallApprovalForm.file) {
      toast.error('Hall Approval Form is required');
      return;
    }

    setIsSubmitting(true);

    // Build FormData for multipart/form-data submission
    // When backend is connected, uncomment the fetch call below
    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('location', formData.location);
    fd.append('opening_time', formData.opening_time);
    fd.append('closing_time', formData.closing_time);
    if (canteenImage.file) fd.append('image', canteenImage.file);
    fd.append('aadhar_card', aadharCard.file);
    fd.append('hall_approval_form', hallApprovalForm.file);

    // TODO: Replace with real API call when backend is connected
    // try {
    //   const res = await fetch(`${API_BASE}/api/canteens/register/`, {
    //     method: 'POST',
    //     body: fd,
    //     credentials: 'include',
    //   });
    //   if (!res.ok) throw new Error('Registration failed');
    // } catch (err) { ... }

    // Simulate API delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success('Canteen registration submitted for review!');
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-10 text-center max-w-md w-full border border-gray-200/50 dark:border-gray-700/50 shadow-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>
          <h2 className="text-2xl text-gray-900 dark:text-white mb-2">Registration Submitted!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Your canteen registration has been submitted for admin review. You'll be notified once it's approved.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white rounded-xl"
          >
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/owner-register"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-gray-900 dark:text-white flex items-center gap-2">
                Register Your Canteen
                <span className="bg-orange-100 dark:bg-orange-950/30 text-[#D4725C] dark:text-orange-400 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  Step 2 of 2
                </span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Canteen details & documents</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 bg-[#D4725C] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shadow-orange-200 dark:shadow-orange-900/30">
                ✓
              </div>
              <span className="text-sm text-[#D4725C] font-bold">Owner Details</span>
            </div>
            <div className="h-1.5 bg-[#D4725C] rounded-full shadow-sm" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 bg-[#D4725C] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shadow-orange-200 dark:shadow-orange-900/30">
                2
              </div>
              <span className="text-sm text-[#D4725C] font-bold">Canteen Details</span>
            </div>
            <div className="h-1.5 bg-[#D4725C] rounded-full shadow-sm" />
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Canteen Details */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Store className="w-5 h-5 text-[#D4725C]" />
              <h2 className="text-gray-900 dark:text-white">Canteen Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                  Canteen Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Hall 5 Canteen"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Hall 5 Ground Floor"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                    Opening Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      name="opening_time"
                      value={formData.opening_time}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                    Closing Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      name="closing_time"
                      value={formData.closing_time}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Canteen Photo (Optional) */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-[#D4725C]" />
              <h2 className="text-gray-900 dark:text-white">Canteen Photo</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">(Optional)</span>
            </div>

            <input
              ref={canteenImageRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => handleFileSelect(e, setCanteenImage, true)}
            />

            {canteenImage.preview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={canteenImage.preview} alt="Canteen preview" className="w-full h-48 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => clearFile(setCanteenImage)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{canteenImage.name}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => canteenImageRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-[#D4725C] hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all group"
              >
                <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2 group-hover:text-[#D4725C] transition-colors" />
                <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">Click to upload cover photo</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG up to 5MB</p>
              </button>
            )}
          </div>

          {/* Required Documents */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-[#D4725C]" />
              <h2 className="text-gray-900 dark:text-white">Required Documents</h2>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Both documents are mandatory for registration
            </p>

            <div className="space-y-4">
              {/* Aadhar Card */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                  Aadhar Card <span className="text-red-500">*</span>
                </label>
                <input
                  ref={aadharRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, setAadharCard)}
                />
                {aadharCard.file ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-700 dark:text-green-400 truncate max-w-[200px]">{aadharCard.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearFile(setAadharCard)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => aadharRef.current?.click()}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-[#D4725C] hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-all text-left"
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Upload Aadhar Card (PDF, JPG, PNG)</span>
                  </button>
                )}
              </div>

              {/* Hall Approval Form */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                  Hall Approval Form <span className="text-red-500">*</span>
                </label>
                <input
                  ref={hallFormRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, setHallApprovalForm)}
                />
                {hallApprovalForm.file ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-700 dark:text-green-400 truncate max-w-[200px]">{hallApprovalForm.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearFile(setHallApprovalForm)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => hallFormRef.current?.click()}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-[#D4725C] hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-all text-left"
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Upload Hall Approval Form (PDF, JPG, PNG)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white rounded-xl shadow-lg shadow-[#D4725C]/25 hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Registration'
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}