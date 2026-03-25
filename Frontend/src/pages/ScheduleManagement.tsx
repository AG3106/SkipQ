import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Clock, Calendar as CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { getManagerDashboard, getHolidays, addHoliday, deleteHoliday } from "../api/canteens";
import { toast } from "sonner";

interface Holiday {
  id: number;
  date: string;
  description: string;
}

export default function ScheduleManagement() {
  const [canteenName, setCanteenName] = useState("");
  const [canteenId, setCanteenId] = useState<number | null>(null);
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [loading, setLoading] = useState(true);

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [addingHoliday, setAddingHoliday] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const dashboard = await getManagerDashboard();
        const canteen = dashboard.canteen;
        setCanteenName(canteen.name);
        setCanteenId(canteen.id);
        setOpeningTime(canteen.openingTime ?? "");
        setClosingTime(canteen.closingTime ?? "");

        const holidayList = await getHolidays(canteen.id);
        setHolidays(holidayList);
      } catch {
        toast.error("Failed to load schedule data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canteenId || !newHoliday.date || !newHoliday.name) return;
    setAddingHoliday(true);
    try {
      const created = await addHoliday(canteenId, newHoliday.date, newHoliday.name);
      setHolidays((prev) => [...prev, created]);
      setNewHoliday({ date: "", name: "" });
      toast.success("Holiday added");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add holiday");
    } finally {
      setAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    if (!canteenId) return;
    try {
      await deleteHoliday(canteenId, holiday.date);
      setHolidays((prev) => prev.filter((h) => h.id !== holiday.id));
      toast.success("Holiday removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove holiday");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#D4725C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/owner/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <ArrowLeft className="size-6 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule & Timings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{canteenName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Operating Hours */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-100 dark:bg-blue-950/30 p-2.5 rounded-xl">
                <Clock className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Operating Hours</h2>
            </div>

            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Opening Time</label>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-900 dark:text-white text-lg">
                    {openingTime || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Closing Time</label>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-900 dark:text-white text-lg">
                    {closingTime || "Not set"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-[#D4725C]/10 dark:bg-[#D4725C]/20 border border-[#D4725C]/20 dark:border-[#D4725C]/30 rounded-2xl p-5">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong className="text-[#D4725C]">Note:</strong> Operating hours are set during canteen registration.
                Contact admin to update opening/closing times.
              </p>
            </div>
          </div>

          {/* Holidays */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 h-fit">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-orange-100 dark:bg-orange-950/30 p-2.5 rounded-xl">
                <CalendarIcon className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Holidays</h2>
            </div>

            {/* Add Holiday Form */}
            <form onSubmit={handleAddHoliday} className="mb-8 bg-gray-50/50 dark:bg-gray-950/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Plus className="size-4 text-orange-500 dark:text-orange-400" /> Add New Holiday
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Holiday Name
                  </label>
                  <input
                    type="text"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="e.g., Diwali"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={addingHoliday}
                  className="w-full bg-[#D4725C] hover:bg-[#B85A4A] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:-translate-y-0.5"
                >
                  {addingHoliday ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Add Holiday
                </Button>
              </div>
            </form>

            {/* Holidays List */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 pl-1">Upcoming Holidays</h3>
              {holidays.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-gray-400 dark:text-gray-500 font-medium">No holidays marked</p>
                </div>
              ) : (
                holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-md transition-all group"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{holiday.description}</p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(holiday.date + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(holiday)}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-xl transition-all"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
