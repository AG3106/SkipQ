import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import {
  fetchCanteenRequests,
  approveCanteen,
  rejectCanteen,
  fetchManagerRegistrations,
  approveManager,
  rejectManager,
  buildFileUrl,
  type CanteenRequest,
  type PendingManagerRegistration,
} from '../api/admin';
import {
  Shield,
  Store,
  CheckCircle2,
  XCircle,
  LogOut,
  Sun,
  Moon,
  Clock,
  MapPin,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  RefreshCw,
  Users,
  Mail,
} from 'lucide-react';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();

  // Canteen requests state
  const [canteenRequests, setCanteenRequests] = useState<CanteenRequest[]>([]);
  const [loadingCanteens, setLoadingCanteens] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Manager registrations state
  const [managerRegistrations, setManagerRegistrations] = useState<PendingManagerRegistration[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [managerRejectingId, setManagerRejectingId] = useState<number | null>(null);
  const [managerRejectReason, setManagerRejectReason] = useState('');
  const [managerActionLoadingId, setManagerActionLoadingId] = useState<number | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'canteens' | 'managers'>('canteens');

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const loadCanteenRequests = useCallback(async () => {
    setLoadingCanteens(true);
    try {
      const data = await fetchCanteenRequests();
      setCanteenRequests(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load canteen requests';
      toast.error(message);
    } finally {
      setLoadingCanteens(false);
    }
  }, []);

  const loadManagerRegistrations = useCallback(async () => {
    setLoadingManagers(true);
    try {
      const data = await fetchManagerRegistrations();
      setManagerRegistrations(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load manager registrations';
      toast.error(message);
    } finally {
      setLoadingManagers(false);
    }
  }, []);

  useEffect(() => {
    loadCanteenRequests();
    loadManagerRegistrations();
  }, [loadCanteenRequests, loadManagerRegistrations]);

  // -----------------------------------------------------------------------
  // Canteen actions
  // -----------------------------------------------------------------------

  const pendingCount = canteenRequests.length;
  const pendingManagerCount = managerRegistrations.length;

  const handleApprove = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await approveCanteen(id);
      toast.success(res.message);
      setCanteenRequests((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to approve canteen';
      toast.error(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (rejectingId === id) {
      setActionLoadingId(id);
      try {
        const res = await rejectCanteen(id, rejectReason);
        toast.error(res.message);
        setCanteenRequests((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to reject canteen';
        toast.error(message);
      } finally {
        setActionLoadingId(null);
        setRejectingId(null);
        setRejectReason('');
      }
    } else {
      setRejectingId(id);
      setRejectReason('');
    }
  };

  // -----------------------------------------------------------------------
  // Manager actions
  // -----------------------------------------------------------------------

  const handleApproveManager = async (id: number) => {
    setManagerActionLoadingId(id);
    try {
      const res = await approveManager(id);
      toast.success(res.message);
      setManagerRegistrations((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to approve manager';
      toast.error(message);
    } finally {
      setManagerActionLoadingId(null);
    }
  };

  const handleRejectManager = async (id: number) => {
    if (managerRejectingId === id) {
      setManagerActionLoadingId(id);
      try {
        const res = await rejectManager(id, managerRejectReason);
        toast.success(res.message);
        setManagerRegistrations((prev) => prev.filter((m) => m.id !== id));
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to reject manager';
        toast.error(message);
      } finally {
        setManagerActionLoadingId(null);
        setManagerRejectingId(null);
        setManagerRejectReason('');
      }
    } else {
      setManagerRejectingId(id);
      setManagerRejectReason('');
    }
  };

  // -----------------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------------

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      localStorage.removeItem('userType');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4725C] to-[#B85A4A] flex items-center justify-center shadow-lg shadow-[#D4725C]/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 dark:text-white">SkipQ Admin</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('canteens')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'canteens'
                ? 'bg-[#D4725C] text-white shadow-sm'
                : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <Store className="w-4 h-4" />
            Canteen Requests
            {pendingCount > 0 && (
              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${activeTab === 'canteens' ? 'bg-white/20 text-white' : 'bg-[#D4725C] text-white'
                }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('managers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'managers'
                ? 'bg-[#D4725C] text-white shadow-sm'
                : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <Users className="w-4 h-4" />
            Manager Registrations
            {pendingManagerCount > 0 && (
              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${activeTab === 'managers' ? 'bg-white/20 text-white' : 'bg-[#D4725C] text-white'
                }`}>
                {pendingManagerCount}
              </span>
            )}
          </button>
          <button
            onClick={() => activeTab === 'canteens' ? loadCanteenRequests() : loadManagerRegistrations()}
            className="ml-auto p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${(activeTab === 'canteens' ? loadingCanteens : loadingManagers) ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Canteen Requests Tab */}
        {activeTab === 'canteens' && (
          <div className="space-y-4">
            {loadingCanteens ? (
              <div className="flex items-center justify-center py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                <Loader2 className="w-8 h-8 text-[#D4725C] animate-spin" />
              </div>
            ) : canteenRequests.length === 0 ? (
              <div className="text-center py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                <Store className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No pending canteen requests</p>
              </div>
            ) : (
              canteenRequests.map((canteen) => (
                <motion.div
                  key={canteen.id}
                  layout
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all overflow-hidden"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-gray-900 dark:text-white truncate">{canteen.name}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {canteen.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {canteen.managerEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {canteen.openingTime} – {canteen.closingTime}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setExpandedId(expandedId === canteen.id ? null : canteen.id)}
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="View details"
                        >
                          {expandedId === canteen.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleApprove(canteen.id)}
                          disabled={actionLoadingId === canteen.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm transition-colors shadow-sm"
                        >
                          {actionLoadingId === canteen.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(canteen.id)}
                          disabled={actionLoadingId === canteen.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm transition-colors shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Reject reason input */}
                    <AnimatePresence>
                      {rejectingId === canteen.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder="Reason for rejection (optional)"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleReject(canteen.id)}
                            />
                            <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(canteen.id)}
                              disabled={actionLoadingId === canteen.id}
                              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              {actionLoadingId === canteen.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Confirm'
                              )}
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setRejectReason(''); }}
                              className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedId === canteen.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700/50">
                          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="text-sm">
                              <span className="text-gray-400 dark:text-gray-500">Manager Email</span>
                              <p className="text-gray-700 dark:text-gray-300">{canteen.managerEmail}</p>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-400 dark:text-gray-500">Registered</span>
                              <p className="text-gray-700 dark:text-gray-300">
                                {new Date(canteen.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {canteen.documents && (
                              <div className="sm:col-span-2 text-sm">
                                <span className="text-gray-400 dark:text-gray-500 block mb-1.5">Documents</span>
                                <div className="flex flex-wrap gap-2">
                                  {canteen.documents.aadharCard && (
                                    <a
                                      href={buildFileUrl(canteen.documents.aadharCard) ?? '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5" /> Aadhar Card
                                    </a>
                                  )}
                                  {canteen.documents.hallApprovalForm && (
                                    <a
                                      href={buildFileUrl(canteen.documents.hallApprovalForm) ?? '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5" /> Hall Approval Form
                                    </a>
                                  )}
                                  {!canteen.documents.aadharCard && !canteen.documents.hallApprovalForm && (
                                    <p className="text-gray-400 dark:text-gray-500 text-xs italic">No documents uploaded</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Manager Registrations Tab */}
        {activeTab === 'managers' && (
          <div className="space-y-4">
            {loadingManagers ? (
              <div className="flex items-center justify-center py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                <Loader2 className="w-8 h-8 text-[#D4725C] animate-spin" />
              </div>
            ) : managerRegistrations.length === 0 ? (
              <div className="text-center py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No pending manager registrations</p>
              </div>
            ) : (
              managerRegistrations.map((reg) => (
                <motion.div
                  key={reg.id}
                  layout
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all overflow-hidden"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 dark:text-white truncate mb-1">{reg.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" /> {reg.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {new Date(reg.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveManager(reg.id)}
                          disabled={managerActionLoadingId === reg.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm transition-colors shadow-sm"
                        >
                          {managerActionLoadingId === reg.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectManager(reg.id)}
                          disabled={managerActionLoadingId === reg.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm transition-colors shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Reject reason input for managers */}
                    <AnimatePresence>
                      {managerRejectingId === reg.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder="Reason for rejection (optional)"
                              value={managerRejectReason}
                              onChange={(e) => setManagerRejectReason(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleRejectManager(reg.id)}
                            />
                            <div className="flex gap-2">
                            <button
                              onClick={() => handleRejectManager(reg.id)}
                              disabled={managerActionLoadingId === reg.id}
                              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              {managerActionLoadingId === reg.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Confirm'
                              )}
                            </button>
                            <button
                              onClick={() => { setManagerRejectingId(null); setManagerRejectReason(''); }}
                              className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
