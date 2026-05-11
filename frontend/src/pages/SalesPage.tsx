// src/pages/SalesPage.tsx
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  PackageX,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import api from "../api/axios";

// --- ІНТЕРФЕЙСИ ---
interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface SaleItem {
  id: number;
  productName: string;
  quantity: number;
  priceAtSale: number;
}

interface Sale {
  id: number;
  totalAmount: number;
  createdAt: string;
  items: SaleItem[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const SalesPage: React.FC = () => {
  // Стани для даних з БД
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Стани для терміналу (POS)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Завантаження бази
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [productsRes, salesRes] = await Promise.all([
        api.get<Product[]>("/products"),
        api.get<Sale[]>("/sales"),
      ]);
      setProducts(productsRes.data);
      setSalesHistory(salesRes.data);
    } catch (err) {
      setError("Помилка завантаження даних.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ЛОГІКА КОШИКА ---
  const filteredProducts =
    searchQuery.trim() === ""
      ? []
      : products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .slice(0, 5); // Показуємо тільки топ-5 результатів у пошуку

  const addToCart = (product: Product) => {
    setError("");
    setSuccessMsg("");
    setSearchQuery(""); // Очищаємо пошук після вибору

    if (product.stock <= 0) {
      setError(`Товар "${product.name}" закінчився на складі.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setError(
            `На складі є лише ${product.stock} од. товару "${product.name}".`,
          );
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setError("");
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item; // Кількість не може бути <= 0 через цю кнопку (для цього є видалення)
          if (newQty > item.product.stock) {
            setError(`Максимальний залишок: ${item.product.stock} од.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  // --- ОФОРМЛЕННЯ ПРОДАЖУ ---
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      await api.post("/sales", payload);

      setSuccessMsg("Продаж успішно проведено!");
      setCart([]); // Очищуємо кошик
      fetchData(); // Оновлюємо історію та залишки товарів

      setTimeout(() => setSuccessMsg(""), 3000); // Ховаємо повідомлення через 3 сек
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Сталася помилка при створенні чека.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- СТАТИСТИКА ЗА СЬОГОДНІ ---
  const today = new Date().toDateString();
  const todaysSales = salesHistory.filter(
    (s) => new Date(s.createdAt).toDateString() === today,
  );
  const todaysRevenue = todaysSales.reduce(
    (sum, s) => sum + Number(s.totalAmount),
    0,
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden selection:bg-emerald-100">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center z-10 shrink-0">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="text-emerald-700" size={24} />
            Термінал Продажів
          </h1>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString("uk-UA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </header>

        {/* СПОВІЩЕННЯ */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
          {error && (
            <div className="mx-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700 shadow-lg animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mx-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-sm text-emerald-800 shadow-lg animate-in slide-in-from-top-2">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden p-6 gap-6 max-w-[1800px] mx-auto w-full">
          {/* ================= ЛІВА ЧАСТИНА: ЖУРНАЛ ================= */}
          <div className="flex-1 flex flex-col min-w-[500px] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Міні-статистика */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <TrendingUp size={14} /> Виторг сьогодні
                </p>
                <p className="text-2xl font-black text-emerald-800">
                  {todaysRevenue.toLocaleString("uk-UA", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  ₴
                </p>
              </div>
              <div className="p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Receipt size={14} /> Чеки
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {todaysSales.length}
                </p>
              </div>
            </div>

            {/* Список транзакцій */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                Історія операцій
              </h3>

              {isLoading ? (
                <p className="text-center text-gray-400 py-10 text-sm italic">
                  Завантаження бази...
                </p>
              ) : salesHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt size={48} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-500 text-sm">
                    Транзакцій ще немає. Зробіть перший продаж!
                  </p>
                </div>
              ) : (
                salesHistory.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md mb-1">
                          <CheckCircle2 size={12} /> Успішно
                        </span>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                          <Clock size={12} />{" "}
                          {new Date(sale.createdAt).toLocaleString("uk-UA")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                          Чек #{sale.id}
                        </p>
                        <p className="text-lg font-black text-gray-900 mt-0.5">
                          {Number(sale.totalAmount).toLocaleString("uk-UA", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ₴
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <p className="text-gray-700 truncate pr-4">
                            <span className="text-gray-400 text-xs mr-2">
                              {item.quantity}x
                            </span>
                            {item.productName}
                          </p>
                          <p className="text-gray-500 font-medium whitespace-nowrap">
                            {(
                              item.quantity * Number(item.priceAtSale)
                            ).toLocaleString("uk-UA")}{" "}
                            ₴
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ================= ПРАВА ЧАСТИНА: ТЕРМІНАЛ (КОШИК) ================= */}
          <div className="w-[450px] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden shrink-0">
            {/* Пошук товарів */}
            <div className="p-5 border-b border-gray-100 bg-white relative shrink-0 z-20">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Пошук (назва або SKU)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-medium"
                />
              </div>

              {/* Результати пошуку (Dropdown) */}
              {searchQuery && (
                <div className="absolute top-[calc(100%-10px)] left-5 right-5 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-30">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            {product.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {Number(product.price).toLocaleString()} ₴
                          </p>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}
                          >
                            {product.stock > 0
                              ? `Залишок: ${product.stock}`
                              : "Немає в наявності"}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Товарів не знайдено
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Вміст кошика */}
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50/30">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <PackageX size={48} className="text-gray-200" />
                  <p className="text-sm font-medium">Кошик порожній</p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between shadow-sm group"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {Number(item.product.price).toLocaleString()} ₴ / шт.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Кнопки +/- */}
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="w-16 text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {(
                              item.product.price * item.quantity
                            ).toLocaleString()}{" "}
                            ₴
                          </p>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Підсумки та Кнопка (Footer) */}
            <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] shrink-0">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    До сплати
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Позицій у чеку: {cart.length}
                  </p>
                </div>
                <h2 className="text-4xl font-black text-gray-900">
                  {cartTotal.toLocaleString("uk-UA", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  <span className="text-xl text-gray-400">₴</span>
                </h2>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-lg font-bold shadow-lg shadow-emerald-800/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Обробка транзакції...</span>
                ) : (
                  <>
                    Оформити чек <CheckCircle2 size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
