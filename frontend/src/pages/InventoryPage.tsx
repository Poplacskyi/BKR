import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X, AlertCircle, Tag } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { useCurrency } from "../context/CurrencyContext";
import api from "../api/axios";

// --- ІНТЕРФЕЙСИ ---
interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  category?: string; // Клас/Категорія товару
  askPrice: number;
  bidPrice: number;
  stock: number;
  userId: number;
}

export const InventoryPage: React.FC = () => {
  // Стани списку та фільтрів
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterField, setFilterField] = useState<
    "name" | "sku" | "stock" | "askPrice" | "category"
  >("name");
  const { format, symbol } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Стани модального вікна та форми
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false); // Стан для кастомного дропдауну

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    askPrice: 0,
    bidPrice: 0,
    stock: 0,
  });

  // Завантаження даних
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setIsLoading(true);
      const response = await api.get<Product[]>("/products");
      setProducts(response.data);
    } catch (err: any) {
      console.error("Помилка завантаження товарів:", err);
      setError("Не вдалося завантажити ваш список товарів.");
    } finally {
      setIsLoading(false);
    }
  }

  // Витягуємо всі існуючі класи товарів для підказок
  const existingCategories = Array.from(
    new Set(
      products.map((p) => p.category).filter((c) => c && c.trim() !== ""),
    ),
  ) as string[];

  // Фільтруємо підказки класів під час вводу
  const filteredCategories = existingCategories.filter((c) =>
    c.toLowerCase().includes(formData.category.toLowerCase()),
  );

  // Фільтруємо товари для таблиці
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    if (filterField === "name") return p.name.toLowerCase().includes(query);
    if (filterField === "sku") return p.sku.toLowerCase().includes(query);
    if (filterField === "stock") return String(p.stock).includes(query);
    if (filterField === "askPrice") return String(p.askPrice).includes(query);
    if (filterField === "category")
      return (p.category || "").toLowerCase().includes(query);

    return true;
  });

  // --- ОБРОБНИКИ ФОРМИ ---
  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: "",
      description: "",
      category: "",
      askPrice: 0,
      bidPrice: 0,
      stock: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      category: product.category || "",
      askPrice: product.askPrice,
      bidPrice: product.bidPrice,
      stock: product.stock,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цей товар?")) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert("Не вдалося видалити товар.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: formData.category,
        askPrice: Number(formData.askPrice),
        bidPrice: Number(formData.bidPrice),
        stock: Number(formData.stock),
      };

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      const message = err.response?.data?.message;
      alert(
        Array.isArray(message)
          ? message[0]
          : message || "Помилка при збереженні.",
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden selection:bg-emerald-100">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        {/* HEADER */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-40">
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value as any)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-colors"
              >
                <option value="name">Назва</option>
                <option value="sku">Артикул</option>
                <option value="category">Клас товару</option>
                <option value="stock">Кількість</option>
                <option value="askPrice">Ціна</option>
              </select>
            </div>
            <div className="relative flex-1 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder={`Пошук за ${
                  filterField === "name"
                    ? "назвою"
                    : filterField === "sku"
                      ? "артикулом"
                      : filterField === "category"
                        ? "класом"
                        : filterField === "stock"
                          ? "кількістю"
                          : "ціною"
                }...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-all"
              />
            </div>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus size={16} /> Додати товар
          </button>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Складські запаси
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Тут відображаються лише ваші товари. Керуйте залишками та
              артикулами в реальному часі.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* ТАБЛИЦЯ ТОВАРІВ */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    Артикул (SKU)
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    Назва та Клас
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    Ціна продажу ({symbol})
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    Собівартість ({symbol})
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    Маржа ({symbol})
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">
                    Залишок
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-400 italic"
                    >
                      Завантаження вашої бази даних...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      {searchQuery
                        ? "Нічого не знайдено за вашим запитом."
                        : "Ваш склад порожній. Час додати перший товар!"}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-400 group-hover:text-emerald-800 transition-colors italic">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <div>{product.name}</div>
                        {product.category && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 w-max px-2 py-0.5 rounded">
                            <Tag size={10} /> {product.category}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-gray-900">
                        {format(product.askPrice)}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500">
                        {format(product.bidPrice)}
                      </td>
                      <td className="px-6 py-3.5 text-emerald-600 font-medium">
                        {format(product.askPrice - product.bidPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-tighter ${product.stock <= 5 ? "bg-red-50 text-red-700 border border-red-100" : product.stock <= 20 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-800 border border-emerald-100"}`}
                        >
                          {product.stock} од.
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-gray-400 hover:text-emerald-800 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* МОДАЛЬНЕ ВІКНО ДОДАВАННЯ/РЕДАГУВАННЯ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden scale-in-center overflow-visible">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? "Оновлення позиції" : "Нова картка товару"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Назва товару
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all outline-none"
                      placeholder="Напр. Футболка"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Артикул (SKU)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all outline-none"
                      placeholder="TSH-001"
                    />
                  </div>
                </div>

                {/* КАСТОМНИЙ ДРОПДАУН ДЛЯ КАТЕГОРІЙ */}
                <div className="relative">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Клас товару (Категорія)
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowCategoryDropdown(false), 200)
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all outline-none"
                    placeholder="Введіть новий або виберіть зі списку..."
                    autoComplete="off"
                  />

                  {/* Випадаючий список підказок */}
                  {showCategoryDropdown && filteredCategories.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                      {filteredCategories.map((cat, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, category: cat });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-2"
                        >
                          <Tag size={14} className="opacity-40" />
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Ціна продажу ({symbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.askPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          askPrice: e.target.valueAsNumber,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Собівартість ({symbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.bidPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bidPrice: e.target.valueAsNumber,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Залишок
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock: e.target.valueAsNumber,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Опис
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-800/10 focus:border-emerald-800 transition-all outline-none resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-800/20 transition-all active:scale-95"
                >
                  {editingProduct ? "Оновити товар" : "Створити товар"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
