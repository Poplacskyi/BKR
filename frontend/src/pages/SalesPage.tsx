import { useState, useEffect } from "react";
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
  Edit2,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { useCurrency } from "../context/CurrencyContext";
import api from "../api/axios";

// --- ІНТЕРФЕЙСИ ---
interface Product {
  id: number;
  name: string;
  sku: string;
  askPrice: number;
  stock: number;
}

interface SaleItem {
  id: number;
  productId: number;
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
  customPrice: number; // ДОДАНО: Своя ціна в кошику
}

export const SalesPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ДОДАНО: Стан для режиму редагування
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null);

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

  const filteredProducts =
    searchQuery.trim() === ""
      ? []
      : products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .slice(0, 5);

  const addToCart = (product: Product) => {
    setError("");
    setSuccessMsg("");
    setSearchQuery("");

    if (product.stock <= 0 && !editingSaleId) {
      setError(`Товар "${product.name}" закінчився на складі.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      // При додаванні товару ставимо стандартну ціну (askPrice)
      return [
        ...prev,
        { product, quantity: 1, customPrice: Number(product.askPrice) },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setError("");
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  // ДОДАНО: Функція оновлення ціни товару в кошику
  const updateCustomPrice = (productId: number, newPrice: string) => {
    const parsedPrice = parseFloat(newPrice);
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, customPrice: isNaN(parsedPrice) ? 0 : parsedPrice }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.customPrice * item.quantity,
    0,
  );

  // ДОДАНО: Функція завантаження чека в кошик для редагування
  const loadSaleForEdit = (sale: Sale) => {
    setEditingSaleId(sale.id);
    const loadedCart =
      sale.items?.map((item) => {
        // Знаходимо оригінальний продукт, щоб знати його залишки
        const product = products.find((p) => p.id === item.productId) || {
          id: item.productId,
          name: item.productName,
          sku: "N/A",
          askPrice: item.priceAtSale,
          stock: 999, // Якщо товар видалено, дозволяємо редагувати
        };

        return {
          product: product as Product,
          quantity: item.quantity,
          customPrice: Number(item.priceAtSale),
        };
      }) || [];

    setCart(loadedCart);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingSaleId(null);
    setCart([]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          priceAtSale: item.customPrice, // Відправляємо кастомну ціну на бекенд!
        })),
      };

      if (editingSaleId) {
        // Оновлюємо існуючий
        await api.patch(`/sales/${editingSaleId}`, payload);
        setSuccessMsg("Чек успішно оновлено!");
        setEditingSaleId(null);
      } else {
        // Створюємо новий
        await api.post("/sales", payload);
        setSuccessMsg("Продаж успішно проведено!");
      }

      setCart([]);
      fetchData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Сталася помилка при обробці чека.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <TrendingUp size={14} /> Виторг сьогодні
                </p>
                <p className="text-2xl font-black text-emerald-800">
                  {format(todaysRevenue)}
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
                  <p className="text-gray-500 text-sm">Транзакцій ще немає.</p>
                </div>
              ) : (
                salesHistory.map((sale) => (
                  <div
                    key={sale.id}
                    className={`bg-white border ${editingSaleId === sale.id ? "border-amber-400 shadow-md ring-2 ring-amber-400/20" : "border-gray-200 hover:border-emerald-200"} rounded-xl p-4 shadow-sm transition-all`}
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
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                            Чек #{sale.id}
                          </p>
                          <p className="text-lg font-black text-gray-900 mt-0.5">
                            {format(Number(sale.totalAmount))}
                          </p>
                        </div>
                        {/* ДОДАНО: Кнопка редагування */}
                        <button
                          onClick={() => loadSaleForEdit(sale)}
                          className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors"
                        >
                          <Edit2 size={12} /> Змінити
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {sale.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <p className="text-gray-700 truncate pr-4">
                            <span className="text-gray-400 text-xs mr-2">
                              {item.quantity}x
                            </span>
                            {item.productName}
                          </p>
                          <p className="text-gray-500 font-medium whitespace-nowrap">
                            {format(item.quantity * Number(item.priceAtSale))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ================= ПРАВА ЧАСТИНА: ТЕРМІНАЛ ================= */}
          <div className="w-[480px] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden shrink-0">
            {/* Блок попередження про режим редагування */}
            {editingSaleId && (
              <div className="bg-amber-100 px-5 py-3 border-b border-amber-200 flex justify-between items-center z-30">
                <p className="text-amber-800 text-sm font-bold flex items-center gap-2">
                  <Edit2 size={16} /> Редагування чеку #{editingSaleId}
                </p>
                <button
                  onClick={cancelEdit}
                  className="text-amber-700 hover:text-amber-900 text-xs font-medium bg-amber-200/50 px-2 py-1 rounded"
                >
                  Скасувати
                </button>
              </div>
            )}

            <div className="p-5 border-b border-gray-100 bg-white relative shrink-0 z-20">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Пошук товару..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-medium"
                />
              </div>
              {searchQuery && (
                <div className="absolute top-[calc(100%-10px)] left-5 right-5 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-30">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0 && !editingSaleId}
                        className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            {product.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {format(product.askPrice)}
                          </p>
                          <p
                            className={`text-[10px] font-bold uppercase mt-0.5 ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}
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
                      className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col shadow-sm group relative"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-4">
                          <h4 className="text-sm font-bold text-gray-900">
                            {item.product.name}
                          </h4>
                          {/* ДОДАНО: Інпут для редагування ціни */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">Ціна:</span>
                            <input
                              type="number"
                              value={item.customPrice || ""}
                              onChange={(e) =>
                                updateCustomPrice(
                                  item.product.id,
                                  e.target.value,
                                )
                              }
                              className="w-20 px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-emerald-500"
                            />
                            <span className="text-xs text-gray-500">{symbol}/шт</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors absolute top-2 right-2"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex justify-between items-center border-t border-gray-50 pt-2">
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
                        <p className="text-sm font-bold text-emerald-800">
                          {format(item.customPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] shrink-0">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    До сплати
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Позицій: {cart.length}
                  </p>
                </div>
                <h2 className="text-4xl font-black text-gray-900">
                  {format(cartTotal)}
                </h2>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className={`w-full py-4 text-white rounded-xl text-lg font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${editingSaleId ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20" : "bg-emerald-800 hover:bg-emerald-900 shadow-emerald-800/20"}`}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Обробка...</span>
                ) : editingSaleId ? (
                  <>
                    Зберегти зміни <Edit2 size={20} />
                  </>
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
