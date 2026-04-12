import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, User, Mail, Phone, MapPin, Building2, LogOut, Shield, Bell, ChevronRight, Loader2, Camera } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import type { ManagerProfile } from "../types";
import { buildFileUrl } from "../api/client";
import { getManagerDashboard, updateCanteenImage } from "../api/canteens";
import { toast } from "sonner";

export default function OwnerAccount() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [canteenInfo, setCanteenInfo] = useState<{ id: number; name: string; location: string; imageUrl: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    getManagerDashboard()
      .then((data) => setCanteenInfo({ id: data.canteen.id, name: data.canteen.name, location: data.canteen.location, imageUrl: data.canteen.imageUrl ?? null }))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canteenInfo) return;
    setUploadingImage(true);
    try {
      const updated = await updateCanteenImage(canteenInfo.id, file);
      setCanteenInfo((prev) => prev ? { ...prev, imageUrl: updated.imageUrl ?? null } : prev);
      toast.success("Canteen photo updated!");
    } catch {
      toast.error("Failed to update photo");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const managerProfile = profile as ManagerProfile | null;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-[#D4725C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/owner/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <ArrowLeft className="size-6 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage your profile and preferences</p>
              </div>
            </div>
            <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white hidden sm:block">
              SkipQ <span className="text-[#D4725C]">Partner</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-8 hover:shadow-lg transition-shadow">
          {/* Header Banner — Canteen Cover Photo */}
          <div className="h-40 relative bg-gradient-to-r from-[#D4725C] to-[#B85A4A] overflow-hidden group">
            {canteenInfo?.imageUrl ? (
              <img
                src={buildFileUrl(canteenInfo.imageUrl) ?? ""}
                alt="Canteen cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-2xl -ml-10 -mb-10" />
              </>
            )}
            {/* Change Photo Overlay */}
            <label className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={uploadingImage}
              />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-xl">
                {uploadingImage ? (
                  <><Loader2 className="size-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Camera className="size-4" /> Change Cover Photo</>
                )}
              </span>
            </label>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between -mt-12 mb-8 gap-4">
              <div className="flex items-end gap-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white dark:bg-gray-900 rounded-full p-1 shadow-lg shadow-gray-200 dark:shadow-black/20">
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700">
                    <User className="size-10 sm:size-12 text-gray-400 dark:text-gray-600" />
                  </div>
                </div>
                <div className="mb-2">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{user.email.split("@")[0]}</h2>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#D4725C]/10 dark:bg-[#D4725C]/20 text-[#D4725C] dark:text-orange-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                      Canteen Manager
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">Contact Information</h3>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#D4725C] transition-colors">
                    <Mail className="size-5 text-[#D4725C] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-0.5">Email Address</p>
                    <p className="text-gray-900 dark:text-white font-bold">{user.email}</p>
                  </div>
                </div>

                {managerProfile?.contactDetails && (
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#D4725C] transition-colors">
                      <Phone className="size-5 text-[#D4725C] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-0.5">Contact Details</p>
                      <p className="text-gray-900 dark:text-white font-bold">{managerProfile.contactDetails}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">Establishment Details</h3>

                {canteenInfo && (
                  <>
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-500 transition-colors">
                        <Building2 className="size-5 text-blue-500 dark:text-blue-400 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-0.5">Canteen Name</p>
                        <p className="text-gray-900 dark:text-white font-bold">{canteenInfo.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-500 transition-colors">
                        <MapPin className="size-5 text-blue-500 dark:text-blue-400 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-0.5">Location</p>
                        <p className="text-gray-900 dark:text-white font-bold">{canteenInfo.location}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Manager ID Badge */}
            {/* {managerProfile?.managerId && (
              <div className="mt-8 bg-gray-50/80/80 rounded-xl p-4 border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-between">
                <div>
                   <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Manager ID</p>
                   <p className="text-lg font-mono font-black text-gray-900 dark:text-white tracking-wider">{managerProfile.managerId}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(managerProfile.managerId)}
                  className="text-xs font-bold text-[#D4725C] hover:underline"
                >
                  Copy ID
                </button>
              </div>
            )} */}
          </div>
        </div>

        {/* Settings Cards */}
        {/* <div className="grid md:grid-cols-2 gap-6 mb-8"> */}
        {/* Security */}
        {/* <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
               <Shield className="size-6 text-purple-600 dark:text-purple-400 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Security</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Manage your password and 2-factor authentication settings</p>
            <div className="flex items-center text-purple-600 dark:text-purple-400 font-bold text-sm">
               Change Password <ChevronRight className="size-4 ml-1" />
            </div>
          </div> */}

        {/* Notifications */}
        {/* <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-950/30 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-yellow-500 transition-colors">
               <Bell className="size-6 text-yellow-600 dark:text-yellow-400 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Notifications</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Configure how you receive order updates and alerts</p>
            <div className="flex items-center text-yellow-600 dark:text-yellow-400 font-bold text-sm">
               Manage Notifications <ChevronRight className="size-4 ml-1" />
            </div>
          </div> */}
        {/* </div> */}

        {/* Logout Button */}
        <div className="bg-red-50/50 dark:bg-red-950/30 rounded-3xl border border-red-100 dark:border-red-800 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-red-900 dark:text-red-400 mb-1">Sign Out</h3>
            <p className="text-red-700/80 dark:text-red-400/80 text-sm">Securely log out of your account on this device</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-white border-2 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:border-red-200 dark:hover:border-red-700 px-8 py-6 rounded-xl font-bold transition-all shadow-sm w-full md:w-auto"
          >
            <LogOut className="size-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
