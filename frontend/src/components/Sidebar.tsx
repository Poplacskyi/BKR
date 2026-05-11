import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  FileText,
  BarChart3,
} from "lucide-react";

const menuItems = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Огляд",
    path: "/dashboard",
  },
  { id: "inventory", icon: Package, label: "Склад", path: "/inventory" },
  { id: "sales", icon: ShoppingCart, label: "Продажі", path: "/sales" },
  { id: "suppliers", icon: Users, label: "Клієнти та Постачальники" },
  { id: "reports", icon: FileText, label: "Звіти" },
  { id: "settings", icon: Settings, label: "Налаштування" },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeMenu =
    menuItems.find((item) => item.path === location.pathname)?.id ??
    "dashboard";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center">
          <BarChart3 className="text-white" size={18} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Analytics<span className="text-emerald-700">Pro</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeMenu === item.id;

          const itemClass = `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
            isActive
              ? "bg-emerald-50 text-emerald-800"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`;

          const Icon = item.icon;

          return item.path ? (
            <Link key={item.id} to={item.path} className={itemClass}>
              <Icon
                size={18}
                className={isActive ? "text-emerald-700" : "text-gray-400"}
              />
              {item.label}
            </Link>
          ) : (
            <button key={item.id} type="button" className={itemClass}>
              <Icon
                size={18}
                className={isActive ? "text-emerald-700" : "text-gray-400"}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={18} className="text-gray-400" /> Вийти
        </button>
      </div>
    </aside>
  );
};
