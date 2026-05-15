import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import api from "../api/axios";
import {
  Download,
  Zap,
  PackageSearch,
  TrendingUp,
  DollarSign,
  Wallet,
} from "lucide-react";

// ─── Типи (Оновлені під новий бекенд) ────────────────────────────────────────

interface AbcXyzItem {
  productId: number;
  productName: string;
  sku: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  margin: number;
  revenueShare: number;
  cumulativeShare: number;
  abcGroup: "A" | "B" | "C";
  profitShare: number;
  abcProfitGroup: "A" | "B" | "C";
  xyzGroup: "X" | "Y" | "Z";
  matrix: string;
  avgDailyDemand: number;
  forecastedDemand: number;
  currentStock: number;
  stockValue: number;
  recommendedOrder: number;
  recommendedOrderCost: number;
  variationCoefficient: number;
}

interface ForecastItem {
  productId: number;
  productName: string;
  dailyDemand: number;
  forecastNextMonth: number;
  availableDays: number;
  oosdays: number;
  forecastedRevenue: number;
  forecastedProfit: number;
  currentStock: number;
}

interface BasketRule {
  itemA: string;
  itemB: string;
  support: number;
  confidence: number;
  lift: number;
}

type Tab = "abcxyz" | "forecast" | "basket";
type Period = 1 | 3 | 6;

// ─── Компонент ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("abcxyz");
  const [period, setPeriod] = useState<Period>(3);
  const [abcData, setAbcData] = useState<AbcXyzItem[]>([]);
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
  const [basketData, setBasketData] = useState<BasketRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAll();
  }, [period]);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [abc, fc, bk] = await Promise.all([
        api.get<AbcXyzItem[]>(`/analytics/abc-xyz?months=${period}`),
        api.get<ForecastItem[]>(`/analytics/forecast?months=${period}`),
        api.get<BasketRule[]>(`/analytics/market-basket`),
      ]);
      setAbcData(Array.isArray(abc.data) ? abc.data : []);
      setForecastData(Array.isArray(fc.data) ? fc.data : []);
      setBasketData(Array.isArray(bk.data) ? bk.data : []);
    } catch (e: any) {
      console.error("Analytics fetch error:", e);
      setError(e.response?.data?.message || "Не вдалося завантажити аналітику");
      setAbcData([]);
      setForecastData([]);
      setBasketData([]);
    } finally {
      setLoading(false);
    }
  }

  // Нові KPI підрахунки
  const totalRevenue = abcData.reduce((s, d) => s + d.totalRevenue, 0);
  const totalProfit = abcData.reduce((s, d) => s + d.grossProfit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const totalStockValue = abcData.reduce((s, d) => s + d.stockValue, 0);
  const totalOrderCost = abcData.reduce(
    (s, d) => s + d.recommendedOrderCost,
    0,
  );

  const needReorder = abcData.filter((d) => d.recommendedOrder > 0);

  async function takeSnapshot() {
    try {
      await api.post("/analytics/snapshot");
      alert("Знімок залишків зроблено");
      fetchAll();
    } catch (e: any) {
      alert(
        e.response?.data?.message || "Помилка при створенні знімка залишків",
      );
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto z-10 relative">
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          {/* ── Шапка ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Аналітика та Фінанси
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Оцінка прибутковості, управління запасами та прогнозування
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                {([1, 3, 6] as Period[]).map((p) => (
                  <button
                    key={p}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      period === p
                        ? "bg-emerald-700 text-white"
                        : "text-gray-600 hover:bg-gray-50 border-r border-gray-200 last:border-0"
                    }`}
                    onClick={() => setPeriod(p)}
                  >
                    {p} міс
                  </button>
                ))}
              </div>

              <button
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-700 transition-colors shadow-sm"
                onClick={takeSnapshot}
              >
                <Zap size={16} /> Знімок
              </button>

              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 text-white border border-transparent rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors shadow-sm">
                <Download size={16} /> Звіт
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
              Завантаження аналітики...
            </div>
          )}

          {/* ── KPI картки ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <KpiCard
              icon={<TrendingUp size={20} />}
              label="Загальна виручка"
              value={`₴ ${totalRevenue.toLocaleString("uk-UA")}`}
              sub={`Оборот за ${period} міс.`}
            />
            <KpiCard
              icon={<DollarSign size={20} />}
              label="Валовий прибуток"
              value={`₴ ${totalProfit.toLocaleString("uk-UA")}`}
              sub={`Середня маржа: ${avgMargin.toFixed(1)}%`}
              isSuccess={true}
            />
            <KpiCard
              icon={<PackageSearch size={20} />}
              label="Заморожено в запасах"
              value={`₴ ${totalStockValue.toLocaleString("uk-UA")}`}
              sub="Закупівельна вартість складу"
            />
            <KpiCard
              icon={<Wallet size={20} />}
              label="Бюджет на закупівлю"
              value={`₴ ${totalOrderCost.toLocaleString("uk-UA")}`}
              sub={`${needReorder.length} позицій потребують поповнення`}
              isAlert={needReorder.length > 0}
            />
          </div>

          {/* ── Таби ── */}
          <div className="flex border-b border-gray-200 mb-6 space-x-8">
            {(["abcxyz", "forecast", "basket"] as Tab[]).map((t) => (
              <button
                key={t}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  tab === t
                    ? "border-emerald-700 text-emerald-800"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setTab(t)}
              >
                {
                  {
                    abcxyz: "Матриця та Прибуток",
                    forecast: "Фінансовий прогноз",
                    basket: "Аналіз кошика",
                  }[t]
                }
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mr-3"></div>
              Аналіз фінансових показників...
            </div>
          ) : (
            <>
              {/* ── TAB: ABC/XYZ ── */}
              {tab === "abcxyz" && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-6 py-3.5 font-medium">
                              Товар / SKU
                            </th>
                            <th className="px-6 py-3.5 font-medium">Клас</th>
                            <th className="px-6 py-3.5 font-medium">Виручка</th>
                            <th className="px-6 py-3.5 font-medium text-emerald-700">
                              Прибуток
                            </th>
                            <th className="px-6 py-3.5 font-medium">Маржа</th>
                            <th className="px-6 py-3.5 font-medium">
                              Залишок (Вартість)
                            </th>
                            <th className="px-6 py-3.5 font-medium">
                              Дозамовлення (Бюджет)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {abcData.map((d) => (
                            <tr
                              key={d.productId}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-3.5">
                                <p className="font-medium text-gray-900">
                                  {d.productName}
                                </p>
                                <p className="text-xs text-gray-500">{d.sku}</p>
                              </td>
                              <td className="px-6 py-3.5">
                                <MatrixBadge matrix={d.matrix} />
                                {d.abcGroup !== d.abcProfitGroup && (
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    Прибуток: Клас {d.abcProfitGroup}
                                  </p>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-gray-700 font-medium">
                                ₴ {d.totalRevenue.toLocaleString("uk-UA")}
                              </td>
                              <td className="px-6 py-3.5 text-emerald-700 font-bold">
                                ₴ {d.grossProfit.toLocaleString("uk-UA")}
                              </td>
                              <td className="px-6 py-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-bold ${d.margin < 20 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                                >
                                  {d.margin.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-3.5">
                                <p className="font-medium text-gray-700">
                                  {d.currentStock} од.
                                </p>
                                <p className="text-xs text-gray-500">
                                  ₴ {d.stockValue.toLocaleString("uk-UA")}
                                </p>
                              </td>
                              <td className="px-6 py-3.5">
                                {d.recommendedOrder > 0 ? (
                                  <div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                                      +{d.recommendedOrder} од.
                                    </span>
                                    <p className="text-xs text-amber-600 font-medium mt-1">
                                      ₴{" "}
                                      {d.recommendedOrderCost.toLocaleString(
                                        "uk-UA",
                                      )}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Прогноз ── */}
              {tab === "forecast" && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-6 py-3.5 font-medium">Товар</th>
                            <th className="px-6 py-3.5 font-medium">
                              Прогноз шт. (30д)
                            </th>
                            <th className="px-6 py-3.5 font-medium">
                              Очікувана виручка
                            </th>
                            <th className="px-6 py-3.5 font-medium text-emerald-700">
                              Очікуваний прибуток
                            </th>
                            <th className="px-6 py-3.5 font-medium">
                              Запасів вистачить на
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {forecastData.map((d) => {
                            const daysLeft =
                              d.dailyDemand > 0
                                ? Math.round(d.currentStock / d.dailyDemand)
                                : 999;
                            const daysLeftStr =
                              daysLeft > 365 ? "> 1 рік" : `${daysLeft} дн.`;
                            const stockClass =
                              daysLeft < 14
                                ? "text-red-600 font-bold"
                                : daysLeft < 30
                                  ? "text-amber-600 font-bold"
                                  : "text-emerald-600 font-medium";

                            return (
                              <tr
                                key={d.productId}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-3.5 font-medium text-gray-900">
                                  {d.productName}
                                </td>
                                <td className="px-6 py-3.5 font-medium text-gray-700">
                                  {d.forecastNextMonth} од.
                                </td>
                                <td className="px-6 py-3.5 text-gray-600">
                                  ₴{" "}
                                  {d.forecastedRevenue.toLocaleString("uk-UA")}
                                </td>
                                <td className="px-6 py-3.5 text-emerald-700 font-bold">
                                  ₴ {d.forecastedProfit.toLocaleString("uk-UA")}
                                </td>
                                <td className={`px-6 py-3.5 ${stockClass}`}>
                                  {daysLeftStr}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Аналіз кошика ── */}
              {tab === "basket" && (
                <div className="space-y-4">
                  {basketData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-xl border-dashed">
                      <PackageSearch size={48} className="text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">
                        Недостатньо даних
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-6 py-3.5 font-medium">
                              Якщо купили →
                            </th>
                            <th className="px-6 py-3.5 font-medium">
                              Часто беруть також
                            </th>
                            <th className="px-6 py-3.5 font-medium">
                              Ймовірність
                            </th>
                            <th className="px-6 py-3.5 font-medium">Lift</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {basketData.map((r, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-6 py-3.5 font-medium text-gray-900">
                                {r.itemA}
                              </td>
                              <td className="px-6 py-3.5 text-gray-700">
                                {r.itemB}
                              </td>
                              <td className="px-6 py-3.5 font-bold text-emerald-700">
                                {(r.confidence * 100).toFixed(0)}%
                              </td>
                              <td className="px-6 py-3.5 text-gray-500">
                                {r.lift.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Допоміжні компоненти ─────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  isAlert = false,
  isSuccess = false,
}: any) {
  const valColor = isAlert
    ? "text-red-600"
    : isSuccess
      ? "text-emerald-800"
      : "text-gray-900";
  const subColor = isAlert
    ? "text-red-500"
    : isSuccess
      ? "text-emerald-600"
      : "text-gray-500";
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
      {isSuccess && (
        <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-700"></div>
      )}
      {isAlert && (
        <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
      )}
      <div className="flex justify-between items-start mb-2">
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <div className="text-gray-400">{icon}</div>
      </div>
      <h3 className={`text-2xl font-bold mb-1 ${valColor}`}>{value}</h3>
      <p className={`text-xs font-medium ${subColor} truncate`}>{sub}</p>
    </div>
  );
}

function MatrixBadge({ matrix }: { matrix: string }) {
  const styles: Record<string, string> = {
    AX: "bg-emerald-700 text-white",
    AY: "bg-emerald-500 text-white",
    AZ: "bg-emerald-100 text-emerald-900",
    BX: "bg-blue-100 text-blue-900",
    BY: "bg-amber-200 text-amber-900",
    BZ: "bg-orange-200 text-orange-900",
    CX: "bg-gray-300 text-gray-800",
    CY: "bg-gray-200 text-gray-700",
    CZ: "bg-red-200 text-red-900",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${styles[matrix] || "bg-gray-200 text-gray-700"}`}
    >
      {matrix}
    </span>
  );
}
