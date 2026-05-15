import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  LayoutDashboard,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Sidebar } from "../components/Sidebar";
import {
  fetchDashboardData,
  buildMetricCards,
  buildSalesChart,
  buildLowStockAlerts,
  buildTopProducts,
  buildActivityFeed,
} from "../modules/dashboard";
import type {
  DashboardMetrics,
  ChartPoint,
  LowStockAlert,
  TopProduct,
  ActivityFeedItem,
} from "../modules/dashboard";

export const HomePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    ordersToday: 0,
    totalStock: 0,
    profit: 0,
    profitMargin: 0.48,
  });
  const [salesData, setSalesData] = useState<ChartPoint[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError("");

        const { products, sales } = await fetchDashboardData();

        setMetrics(buildMetricCards(products, sales));
        setSalesData(buildSalesChart(sales));
        setLowStockAlerts(buildLowStockAlerts(products));
        setTopProducts(buildTopProducts(products, sales));
        setActivityFeed(buildActivityFeed(sales));
      } catch (err) {
        console.error(err);
        setError(
          "Не вдалося завантажити дашборд. Перевірте підключення до бекенду або авторизацію.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      <Sidebar />

      {/* --- ГОЛОВНИЙ КОНТЕНТ --- */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto z-10 relative">
        {/* МІНІМАЛІСТИЧНА ВЕРХНЯ ПАНЕЛЬ (HEADER) */}
        {/* ВЕРХНЯ ПАНЕЛЬ (HEADER) */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="text-emerald-700" size={24} />
            Дашборд
          </h1>
        </header>

        <div className="p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          <div className="mb-2">
            <p className="text-sm text-gray-500 mt-1">
              Огляд ключових показників за поточний період.
            </p>
          </div>
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* КАРТКИ ПОКАЗНИКІВ */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm font-medium mb-1">
                Загальний дохід
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {isLoading
                  ? "..."
                  : `₴ ${metrics.totalRevenue.toLocaleString("uk-UA", { minimumFractionDigits: 2 })}`}
              </h3>
              <p className="text-emerald-600 mt-2 flex items-center gap-1 text-xs font-medium">
                <TrendingUp size={14} /> +12.5% з минулого місяця
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm font-medium mb-1">
                Замовлень сьогодні
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : metrics.ordersToday}
              </h3>
              <p className="text-emerald-600 mt-2 flex items-center gap-1 text-xs font-medium">
                <ArrowUpRight size={14} /> +5 у порівнянні з вчора
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm font-medium mb-1">
                Товарів на складі
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : `${metrics.totalStock} од.`}
              </h3>
              <p className="text-gray-500 mt-2 flex items-center gap-1 text-xs font-medium">
                Розподілено по 2 складах
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-emerald-700"></div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                Чистий прибуток
              </p>
              <h3 className="text-2xl font-bold text-emerald-800">
                {isLoading
                  ? "..."
                  : `₴ ${metrics.profit.toLocaleString("uk-UA", { minimumFractionDigits: 2 })}`}
              </h3>
              <p className="text-emerald-700 mt-2 flex items-center gap-1 text-xs font-medium">
                Рентабельність: {metrics.profitMargin * 100}%
              </p>
            </div>
          </div>

          {/* ГРАФІК ТА СПОВІЩЕННЯ */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Графік продажів */}
            <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-gray-900">
                  Динаміка продажів (тис. ₴)
                </h2>
                <select className="bg-gray-50 border border-gray-200 text-sm text-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-700">
                  <option>Останні 30 днів</option>
                  <option>Попередній місяць</option>
                </select>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={salesData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#065f46"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#065f46"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      itemStyle={{ color: "#065f46", fontWeight: "bold" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Виторг"
                      stroke="#065f46"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Критичні залишки */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  Увага по запасах
                </h2>
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                  {lowStockAlerts.length} позицій
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {lowStockAlerts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">
                    Немає критичних залишків.
                  </div>
                ) : (
                  lowStockAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border border-gray-100 rounded-lg p-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {alert.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Мінімум: {alert.threshold}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                          {alert.stock} од.
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button className="mt-5 w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                Сформувати замовлення
              </button>
            </div>
          </div>

          {/* НИЖНІЙ РЯД (Таблиця та Активність) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-10">
            {/* Топ товарів */}
            <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">
                  Популярні товари
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Товар</th>
                      <th className="px-6 py-3 font-medium">Продано</th>
                      <th className="px-6 py-3 font-medium">Виторг</th>
                      <th className="px-6 py-3 font-medium">Залишок</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topProducts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-gray-400"
                        >
                          Немає продажів для формування рейтингу товарів.
                        </td>
                      </tr>
                    ) : (
                      topProducts.map((product) => {
                        // Рахуємо відсоток залишку від початкової кількості
                        const initialStock = product.stock + product.sales;
                        const stockPercentage =
                          initialStock > 0
                            ? Math.round((product.stock / initialStock) * 100)
                            : 0;

                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-3.5 font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-3.5 text-gray-600">
                              {product.sales} од.
                            </td>
                            <td className="px-6 py-3.5 text-gray-900 font-medium">
                              {product.revenue.toLocaleString("uk-UA")} ₴
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden"
                                  title={`${product.stock} з ${initialStock} од.`}
                                >
                                  <div
                                    className={`h-full rounded-full transition-all ${stockPercentage < 25 ? "bg-amber-500" : "bg-emerald-600"}`}
                                    style={{
                                      width: `${stockPercentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 w-8 font-medium">
                                  {stockPercentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Активність */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-5">
                Останні дії
              </h2>
              <div className="relative border-l border-gray-200 ml-2 space-y-6">
                {activityFeed.length === 0 ? (
                  <div className="relative pl-5 text-sm text-gray-500">
                    Немає останніх дій. Проведіть перший продаж, щоб заповнити
                    стрічку.
                  </div>
                ) : (
                  activityFeed.map((activity) => (
                    <div key={activity.id} className="relative pl-5">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-700 ring-4 ring-white"></div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        {activity.time}
                      </p>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span>{" "}
                        {activity.action}
                      </p>
                      <p className="text-xs font-medium text-gray-600 mt-1">
                        {activity.item}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <button className="mt-6 w-full flex items-center justify-center gap-1 text-gray-500 hover:text-emerald-700 text-sm font-medium transition-colors">
                Переглянути всі <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
