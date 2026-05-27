import React, { useState, useEffect } from "react";
import {
  FileAudio,
  Users,
  Files,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Search,
} from "lucide-react";
import { ViewState } from "../../App";
import { cn } from "../../lib/utils";
import { getDoctorDashboard, Doctor } from "../../api";

interface AppLayoutProps {
  children: React.ReactNode;
  onViewChange: (view: ViewState) => void;
  currentView: ViewState;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

export default function AppLayout({
  children,
  onViewChange,
  currentView,
  searchQuery = "",
  onSearchQueryChange,
}: AppLayoutProps) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    getDoctorDashboard("1")
      .then((res) => setDoctor(res.doctor))
      .catch((err) => console.error(err));
  }, []);

  const navItems = [
    {
      icon: FileAudio,
      label: "Мои записи",
      active: currentView === "dashboard",
    },
    { icon: Users, label: "Пациенты", active: currentView === "patient" },
    { icon: Files, label: "Транскрипты", active: false },
    { icon: CreditCard, label: "Карты", active: false },
  ];

  return (
    <div className="h-[100dvh] bg-slate-100 text-slate-900 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white shadow-sm flex flex-col hidden lg:flex fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onViewChange("landing")}
          >
            <img
              src="/Logo.png"
              alt="ГолосМед Logo"
              className="w-[198px] h-[200px] mt-[10px] object-contain"
            />
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-1">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (item.label === "Мои записи") onViewChange("dashboard");
                if (item.label === "Пациенты") onViewChange("patient");
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                item.active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
            <Settings className="h-4 w-4" /> Настройки
          </button>
          <div
            className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 mt-2 cursor-pointer"
            onClick={() => onViewChange("landing")}
          >
            {doctor?.avatar_url ? (
              <img
                src={doctor.avatar_url}
                alt={doctor.full_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-blue-600 shrink-0">
                {doctor?.full_name
                  ? doctor.full_name.substring(0, 2).toUpperCase()
                  : "АВ"}
              </div>
            )}
            <div className="text-left overflow-hidden">
              <p className="text-xs font-semibold truncate text-slate-800">
                {doctor?.full_name || "Др. А. Волков"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {doctor?.specialization || "Терапевт"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 relative h-full max-h-[100dvh] overflow-hidden min-h-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 lg:px-8 flex items-center justify-between z-20 shrink-0">
          <div className="flex-1 flex items-center">
            <div
              className="flex items-center gap-2 lg:hidden mr-4 cursor-pointer"
              onClick={() => onViewChange("landing")}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                ГМ
              </div>
              <span className="font-bold text-slate-800 tracking-tight sm:hidden">
                ГолосМед
              </span>
            </div>
            <div className="relative w-full max-w-md hidden md:flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-full">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange?.(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 w-full outline-none placeholder:text-slate-400 font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="md:hidden h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 pb-24 lg:p-4 lg:pb-4 max-w-[1600px] mx-auto w-full overflow-hidden flex flex-col min-h-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-2 z-50">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (item.label === "Мои записи") onViewChange("dashboard");
                if (item.label === "Пациенты") onViewChange("patient");
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] sm:text-xs transition-colors",
                item.active
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6 mb-0.5",
                  item.active ? "text-blue-600" : "",
                )}
              />
              <span className="font-medium truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
