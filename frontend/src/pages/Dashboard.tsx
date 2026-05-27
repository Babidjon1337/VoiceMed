import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  FileText,
  Activity,
  Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { getDoctorDashboard, DashboardData, AppointmentStatus } from "../api";

interface DashboardProps {
  onSelectPatient: (id: number) => void;
  searchQuery?: string;
}

export default function Dashboard({
  onSelectPatient,
  searchQuery = "",
}: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    // We assume the logged-in doctor has ID '1' for example purposes.
    getDoctorDashboard("1")
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Fallback in case of error
  const stats = data?.stats || {
    totalToday: 0,
    completed: 0,
    waiting: 0,
    drafts: 0,
  };
  const schedule = data?.schedule || [];

  const combinedSearch = (searchQuery || localSearch).toLowerCase().trim();
  const filteredSchedule = schedule.filter(
    (p) =>
      !combinedSearch ||
      p.patientName.toLowerCase().includes(combinedSearch) ||
      p.reason.toLowerCase().includes(combinedSearch) ||
      p.time.toLowerCase().includes(combinedSearch),
  );

  const statCards = [
    {
      label: "Записей сегодня",
      value: stats.totalToday,
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Проведено приемов",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Ожидают",
      value: stats.waiting,
      icon: Calendar,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Черновики",
      value: stats.drafts,
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  const getStatusString = (status: AppointmentStatus) => {
    switch (status) {
      case "waiting":
        return "Ожидает";
      case "done":
        return "Готово";
      case "draft":
        return "Черновик";
      default:
        return "Неизвестно";
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "waiting":
        return "bg-amber-100/80 text-amber-700";
      case "done":
        return "bg-green-100/80 text-green-700";
      case "draft":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="flex flex-col gap-8 flex-1 animate-in fade-in duration-500 h-full min-h-0 overflow-y-auto overflow-x-hidden pr-2 pb-10 w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Дашборд
          </h1>
          <p className="text-slate-500 mt-1">
            Добро пожаловать. Обзор вашей практики на сегодня.
          </p>
        </div>
        <button
          onClick={() => {
            if (schedule.length > 0) {
              onSelectPatient(schedule[0].id);
            }
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Новая запись
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">
                {stat.label}
              </p>
              <h3 className="text-3xl font-bold text-slate-800">
                {stat.value}
              </h3>
            </div>
            <div
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center",
                stat.bg,
                stat.color,
              )}
            >
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Patients Section */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shrink-0">
          <h2 className="text-xl font-bold text-slate-900">
            Расписание пациентов
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск записи..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all font-medium text-slate-800"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-y-auto min-h-0">
          {filteredSchedule.map((p) => (
            <div
              key={p.id}
              className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
              onClick={() => {
                onSelectPatient(p.id);
                setLocalSearch("");
              }}
            >
              <div className="flex items-start gap-5">
                <div className="mt-1 bg-slate-100/80 text-slate-600 rounded-xl flex flex-col items-center justify-center px-4 py-2 border border-slate-200/60 shadow-sm">
                  <span className="text-sm font-bold">{p.time}</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-lg mb-1">
                    {p.patientName}
                  </h4>
                  <p className="text-[15px] text-slate-500 font-medium">
                    {p.reason}
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-2 sm:gap-1">
                <span
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-bold rounded uppercase tracking-wider",
                    getStatusColor(p.status),
                  )}
                >
                  {getStatusString(p.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
