import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
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
} from 'lucide-react';

const initialCanteenRequests = [
  {
    id: 1,
    name: 'Hall 5 Canteen',
    location: 'Hall 5 Ground Floor',
    managerName: 'Rajesh Kumar',
    managerEmail: 'rajesh.k@iitk.ac.in',
    openingTime: '14:00',
    closingTime: '02:00',
    submittedAt: '2026-03-18',
    status: 'UNDER_REVIEW' as const,
    documents: { aadhar_card: '/files/documents/1/aadhar_card.pdf', hall_approval_form: '/files/documents/1/hall_approval_form.pdf' },
  },
  {
    id: 2,
    name: 'Hall 12 Night Mess',
    location: 'Hall 12 Basement',
    managerName: 'Priya Sharma',
    managerEmail: 'priya.s@iitk.ac.in',
    openingTime: '20:00',
    closingTime: '03:00',
    submittedAt: '2026-03-19',
    status: 'UNDER_REVIEW' as const,
    documents: { aadhar_card: '/files/documents/2/aadhar_card.pdf', hall_approval_form: '/files/documents/2/hall_approval_form.pdf' },
  },
  {
    id: 3,
    name: 'MT Canteen',
    location: 'MT Section Near Library',
    managerName: 'Amit Verma',
    managerEmail: 'amit.v@iitk.ac.in',
    openingTime: '10:00',
    closingTime: '22:00',
    submittedAt: '2026-03-20',
    status: 'UNDER_REVIEW' as const,
    documents: { aadhar_card: '/files/documents/3/aadhar_card.pdf', hall_approval_form: '/files/documents/3/hall_approval_form.pdf' },
  },
];

type CanteenStatus = 'UNDER_REVIEW' | 'ACTIVE' | 'REJECTED';
type CanteenRequest = typeof initialCanteenRequests[number] & { status: CanteenStatus; rejectReason?: string };

export default function AdminPanel() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [canteenRequests, setCanteenRequests] = useState<CanteenRequest[]>(initialCanteenRequests);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const pendingCount = canteenRequests.filter((c) => c.status === 'UNDER_REVIEW').length;

  const handleApprove = (id: number) => {
    setCanteenRequests((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'ACTIVE' as const } : c))
    );
    const canteen = canteenRequests.find((c) => c.id === id);
    toast.success(`"${canteen?.name}" approved and activated`);
  };

  const handleReject = (id: number) => {
    if (rejectingId === id) {
      setCanteenRequests((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: 'REJECTED' as const, rejectReason: rejectReason || undefined } : c
        )
      );
      const canteen = canteenRequests.find((c) => c.id === id);
      toast.error(`"${canteen?.name}" rejected`);
      setRejectingId(null);
      setRejectReason('');
    } else {
      setRejectingId(id);
      setRejectReason('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userType');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4725C] to-[#B85A4A] flex items-center justify-center shadow-lg shadow-[#D4725C]/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 dark:text-white">SkipQ Admin</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Canteen Registration Management</p>
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
        {/* Section Title */}
        <div className="flex items-center gap-2 mb-6">
          <Store className="w-5 h-5 text-[#D4725C]" />
          <h2 className="text-gray-900 dark:text-white">Canteen Approval Queue</h2>
          {pendingCount > 0 && (
            <span className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-[#D4725C] text-white text-xs">
              {pendingCount}
            </span>
          )}
        </div>

        {/* Canteen List */}
        <div className="space-y-4">
          {canteenRequests.length === 0 ? (
            <div className="text-center py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <Store className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No pending canteen requests</p>
            </div>
          ) : (
            canteenRequests.map((canteen) => (
              <motion.div
                key={canteen.id}
                layout
                className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border transition-all overflow-hidden ${
                  canteen.status === 'ACTIVE'
                    ? 'border-green-200 dark:border-green-800/50'
                    : canteen.status === 'REJECTED'
                    ? 'border-red-200 dark:border-red-800/50 opacity-60'
                    : 'border-gray-200/50 dark:border-gray-700/50'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-gray-900 dark:text-white truncate">{canteen.name}</h3>
                        {canteen.status === 'ACTIVE' && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {canteen.status === 'REJECTED' && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {canteen.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {canteen.managerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {canteen.openingTime} – {canteen.closingTime}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {canteen.status === 'UNDER_REVIEW' && (
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
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm transition-colors shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(canteen.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm transition-colors shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reject reason input */}
                  <AnimatePresence>
                    {rejectingId === canteen.id && canteen.status === 'UNDER_REVIEW' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            placeholder="Reason for rejection (optional)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleReject(canteen.id)}
                          />
                          <button
                            onClick={() => handleReject(canteen.id)}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === canteen.id && canteen.status === 'UNDER_REVIEW' && (
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
                            <span className="text-gray-400 dark:text-gray-500">Submitted</span>
                            <p className="text-gray-700 dark:text-gray-300">{canteen.submittedAt}</p>
                          </div>
                          <div className="sm:col-span-2 text-sm">
                            <span className="text-gray-400 dark:text-gray-500 block mb-1.5">Documents</span>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={canteen.documents.aadhar_card}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" /> Aadhar Card
                              </a>
                              <a
                                href={canteen.documents.hall_approval_form}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" /> Hall Approval Form
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Rejected reason display */}
                {canteen.status === 'REJECTED' && canteen.rejectReason && (
                  <div className="px-4 sm:px-5 pb-4 pt-0">
                    <p className="text-xs text-red-500 dark:text-red-400 italic">
                      Reason: {canteen.rejectReason}
                    </p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
