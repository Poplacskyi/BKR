import api from "../api/axios";

export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  askPrice: number; // Ціна продажу
  stock: number;
  userId: number;
}

export interface SaleItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  priceAtSale: number;
}

export interface Sale {
  id: number;
  totalAmount: number;
  createdAt: string;
  items: SaleItem[];
}

export interface DashboardMetrics {
  totalRevenue: number;
  ordersToday: number;
  totalStock: number;
  profit: number;
  profitMargin: number;
}

export interface ChartPoint {
  name: string;
  revenue: number;
}

export interface LowStockAlert {
  id: number;
  name: string;
  stock: number;
  threshold: number;
}

export interface TopProduct {
  id: number;
  name: string;
  sales: number;
  revenue: number;
  stock: number;
  stockPercent: number;
}

export interface ActivityFeedItem {
  id: string;
  user: string;
  action: string;
  item: string;
  time: string;
}

export async function fetchDashboardData() {
  const [productsResponse, salesResponse] = await Promise.all([
    api.get<Product[]>("/products"),
    api.get<Sale[]>("/sales"),
  ]);

  return {
    products: productsResponse.data,
    sales: salesResponse.data,
  };
}

export function buildMetricCards(
  products: Product[],
  sales: Sale[],
): DashboardMetrics {
  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount),
    0,
  );

  const today = new Date().toDateString();
  const ordersToday = sales.filter(
    (sale) => new Date(sale.createdAt).toDateString() === today,
  ).length;

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const profitMargin = 0.48;
  const profit = totalRevenue * profitMargin;

  return {
    totalRevenue,
    ordersToday,
    totalStock,
    profit,
    profitMargin,
  };
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
  });
}

export function buildSalesChart(sales: Sale[]): ChartPoint[] {
  const grouped = sales.reduce(
    (acc, sale) => {
      const date = new Date(sale.createdAt);
      const key = date.toDateString();
      const label = formatDayLabel(date);

      if (!acc[key]) {
        acc[key] = { label, revenue: 0, time: date.getTime() };
      }

      acc[key].revenue += Number(sale.totalAmount);
      return acc;
    },
    {} as Record<string, { label: string; revenue: number; time: number }>,
  );

  return Object.values(grouped)
    .sort((a, b) => a.time - b.time)
    .map((entry) => ({ name: entry.label, revenue: entry.revenue }));
}

export function buildLowStockAlerts(
  products: Product[],
  threshold = 10,
): LowStockAlert[] {
  return products
    .filter((product) => product.stock < threshold)
    .map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      threshold,
    }))
    .sort((a, b) => a.stock - b.stock);
}

export function buildTopProducts(
  products: Product[],
  sales: Sale[],
): TopProduct[] {
  const productStockMap = new Map(
    products.map((product) => [product.id, product.stock]),
  );

  const totals = new Map<
    number,
    {
      id: number;
      name: string;
      quantity: number;
      revenue: number;
    }
  >();

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = totals.get(item.productId) ?? {
        id: item.productId,
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };

      existing.quantity += item.quantity;
      existing.revenue += Number(item.priceAtSale) * item.quantity;
      totals.set(item.productId, existing);
    });
  });

  const topFromSales = Array.from(totals.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map((product) => ({
      id: product.id,
      name: product.name,
      sales: product.quantity,
      revenue: product.revenue,
      stock: productStockMap.get(product.id) ?? 0,
      stockPercent: Math.min(
        100,
        Math.max(0, (productStockMap.get(product.id) ?? 0) * 2),
      ),
    }));

  if (topFromSales.length > 0) {
    return topFromSales;
  }

  return products
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)
    .map((product) => ({
      id: product.id,
      name: product.name,
      sales: 0,
      revenue: 0,
      stock: product.stock,
      stockPercent: Math.min(100, Math.max(0, product.stock * 2)),
    }));
}

function getRelativeTimeLabel(timestamp: number) {
  const deltaSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (deltaSeconds < 60) return `${deltaSeconds} хв тому`;
  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) return `${deltaMinutes} хв тому`;
  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours} год тому`;
  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays} дн тому`;
}

export function buildActivityFeed(sales: Sale[]): ActivityFeedItem[] {
  const sortedSales = [...sales].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (sortedSales.length === 0) {
    return [
      {
        id: "empty",
        user: "Система",
        action: "чекає перших продажів",
        item: "Додайте товар і проведіть першу транзакцію",
        time: "тепер",
      },
    ];
  }

  return sortedSales.slice(0, 3).map((sale) => ({
    id: `sale-${sale.id}`,
    user: "POS",
    action: "провів продаж",
    item: `Чек №${sale.id}`,
    time: getRelativeTimeLabel(new Date(sale.createdAt).getTime()),
  }));
}
