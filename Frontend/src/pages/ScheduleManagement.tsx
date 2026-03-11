import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Clock, Calendar as CalendarIcon, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface DaySchedule {
  day: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
}

export default function ScheduleManagement() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    daysOfWeek.map(day => ({
      day,
      isOpen: true,
      openingTime: "14:00",
      closingTime: "02:00",
    }))
  );

  const [holidays, setHolidays] = useState([
    { date: "2024-08-15", name: "Independence Day" },
    { date: "2024-10-02", name: "Gandhi Jayanti" },
    { date: "2024-12-25", name: "Christmas" },
  ]);

  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });

  const handleScheduleChange = (index: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(schedule.map((day, i) => 
      i === index ? { ...day, [field]: value } : day
    ));
  };

  const handleSaveSchedule = () => {
    alert("Schedule updated successfully!");
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHoliday.date && newHoliday.name) {
      setHolidays([...holidays, newHoliday]);
      setNewHoliday({ date: "", name: "" });
    }
  };

  const handleDeleteHoliday = (date: string) => {
    setHolidays(holidays.filter(h => h.date !== date));
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 relative overflow-hidden">
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
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Hall 1 Canteen</p>
              </div>
            </div>

            <Button
              onClick={handleSaveSchedule}
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30 flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <Save className="size-5" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Schedule */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-100 dark:bg-blue-950/30 p-2.5 rounded-xl">
                 <Clock className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Operating Hours</h2>
            </div>

            <div className="space-y-4">
              {schedule.map((day, index) => (
                <div key={day.day} className={`border rounded-2xl p-5 transition-all duration-300 ${day.isOpen ? 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 shadow-sm' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-70'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={day.isOpen}
                          onChange={(e) => handleScheduleChange(index, "isOpen", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <span className="font-bold text-lg text-gray-900 dark:text-white">{day.day}</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${day.isOpen ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"}`}>
                      {day.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>

                  {day.isOpen && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Opening</label>
                        <input
                          type="time"
                          value={day.openingTime}
                          onChange={(e) => handleScheduleChange(index, "openingTime", e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Closing</label>
                        <input
                          type="time"
                          value={day.closingTime}
                          onChange={(e) => handleScheduleChange(index, "closingTime", e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 bg-[#D4725C]/10 dark:bg-[#D4725C]/20 border border-[#D4725C]/20 dark:border-[#D4725C]/30 rounded-2xl p-5">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong className="text-[#D4725C]">Note:</strong> Changes to operating hours will be visible to customers immediately. 
                Make sure to update your schedule in advance for holidays or special events.
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
                  className="w-full bg-[#D4725C] hover:bg-[#B85A4A] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:-translate-y-0.5"
                >
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
                    key={holiday.date}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-md transition-all group"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{holiday.name}</p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(holiday.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(holiday.date)}
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