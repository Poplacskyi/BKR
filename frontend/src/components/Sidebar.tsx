import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  Settings,
  LogOut,
  Hexagon,
} from "lucide-react";
import { CurrencySelector } from "./CurrencySelector";

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    {
      icon: <LayoutDashboard size={24} />,
      label: "Дашборд",
      path: "/dashboard",
    },
    { icon: <Package size={24} />, label: "Склад", path: "/inventory" },
    { icon: <ShoppingCart size={24} />, label: "Продажі", path: "/sales" },
    { icon: <BarChart2 size={24} />, label: "Аналітика", path: "/analytics" },
    { icon: <Settings size={24} />, label: "Налаштування", path: "/settings" },
  ];

  return (
    <aside className="group flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out w-[80px] hover:w-[260px] flex-shrink-0 z-50">
      {/* ── Логотип ── */}
      <div className="flex items-center h-20 px-6 border-b border-gray-100 overflow-hidden">
        <div className="flex items-center justify-center text-emerald-700 flex-shrink-0">
          <Hexagon size={32} strokeWidth={2.5} />
        </div>
        <span className="ml-4 font-bold text-xl text-gray-900 opacity-0 whitespace-nowrap transition-opacity duration-300 group-hover:opacity-100">
          ERP System
        </span>
      </div>

      {/* ── Навігація (Сторінки + Валюта) ── */}
      <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item, index) => {
          const isActive =
            currentPath === item.path ||
            (currentPath.includes(item.path) && item.path !== "/");

          return (
            <a
              key={index}
              href={item.path}
              className={`flex items-center px-3 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-emerald-700"
              }`}
            >
              <div className="flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <span className="ml-4 text-sm font-medium opacity-0 whitespace-nowrap transition-opacity duration-300 group-hover:opacity-100">
                {item.label}
              </span>
            </a>
          );
        })}

        {/* ── Перемикач валют (mt-auto притискає його донизу списку) ── */}
        <div className="mt-auto px-3 opacity-0 whitespace-nowrap transition-opacity duration-300 group-hover:opacity-100">
          <CurrencySelector />
        </div>
      </nav>

      {/* ── Профіль / Вихід (Окремий нижній блок) ── */}
      <div className="p-4 border-t border-gray-100 overflow-hidden">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
          className="flex items-center w-full px-3 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          type="button"
        >
          <div className="flex items-center justify-center flex-shrink-0">
            <LogOut size={24} />
          </div>
          <span className="ml-4 text-sm font-medium opacity-0 whitespace-nowrap transition-opacity duration-300 group-hover:opacity-100">
            Вийти з акаунту
          </span>
        </button>
      </div>
    </aside>
  );
};
