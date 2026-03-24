import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, LogOut } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
}

export function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    address: '',
    joinDate: new Date().toISOString(),
  });
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    const stored = localStorage.getItem('skipq-user');
    if (stored) {
      const user = JSON.parse(stored);
      setProfile(user);
      setEditedProfile(user);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('skipq-user', JSON.stringify(editedProfile));
    setProfile(editedProfile);
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('skipq-user');
    localStorage.removeItem('skipq-wallet-pin');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
        >
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-[#D4725C] to-orange-600">
            <div className="absolute -bottom-16 left-6">
              <div className="w-32 h-32 rounded-2xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 flex items-center justify-center">
                <User className="w-16 h-16 text-[#D4725C]" />
              </div>
            </div>
          </div>

          <div className="pt-20 px-6 pb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {profile.name || 'Student'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">SkipQ User</p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 text-[#D4725C]" />
                  <span>Full Name</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                  />
                ) : (
                  <p className="px-4 py-3 rounded-xl bg-gray-100/50 dark:bg-gray-700/30 text-gray-900 dark:text-white">
                    {profile.name || 'Not set'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 text-[#D4725C]" />
                  <span>Email Address</span>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                  />
                ) : (
                  <p className="px-4 py-3 rounded-xl bg-gray-100/50 dark:bg-gray-700/30 text-gray-900 dark:text-white">
                    {profile.email || 'Not set'}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="w-4 h-4 text-[#D4725C]" />
                  <span>Phone Number</span>
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                  />
                ) : (
                  <p className="px-4 py-3 rounded-xl bg-gray-100/50 dark:bg-gray-700/30 text-gray-900 dark:text-white">
                    {profile.phone || 'Not set'}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 text-[#D4725C]" />
                  <span>Address</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.address}
                    onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                  />
                ) : (
                  <p className="px-4 py-3 rounded-xl bg-gray-100/50 dark:bg-gray-700/30 text-gray-900 dark:text-white">
                    {profile.address || 'Not set'}
                  </p>
                )}
              </div>

              {/* Join Date */}
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 text-[#D4725C]" />
                  <span>Member Since</span>
                </label>
                <p className="px-4 py-3 rounded-xl bg-gray-100/50 dark:bg-gray-700/30 text-gray-900 dark:text-white">
                  {new Date(profile.joinDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8"
        >
          <button
            onClick={() => navigate('/wallet')}
            className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4725C] to-orange-600 flex items-center justify-center mb-3">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Manage Wallet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add money and view transactions</p>
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Rate Orders</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rate food & canteens from past orders</p>
          </button>
        </motion.div>
      </div>
    </div>
  );
}