import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleItem } from '../sales/sale-item.entity';
import { Sale } from '../sales/sale.entity';
import { Product } from '../product/product.entity';
import { StockHistoryService } from '../stock-history/stock-history.service';

// ─── Типи результатів ──────────────────────────────────────────────────────────

export interface AbcXyzResult {
  productId: number;
  productName: string;
  sku: string;
  totalRevenue: number;
  revenueShare: number; // % від загальної виручки
  cumulativeShare: number; // накопичений %
  abcGroup: 'A' | 'B' | 'C';
  xyzGroup: 'X' | 'Y' | 'Z';
  matrix: string; // напр. 'AX', 'BZ'
  avgDailyDemand: number; // скоригований (OOS-компенсований)
  forecastedDemand: number; // прогноз на наступний місяць
  currentStock: number;
  recommendedOrder: number; // скільки замовити
  variationCoefficient: number;
}

export interface MarketBasketRule {
  itemA: string;
  itemB: string;
  support: number; // частота спільних покупок
  confidence: number; // якщо купили A → ймовірність купити B
  lift: number; // наскільки зв'язок сильніший за випадковий
}

export interface ForecastResult {
  productId: number;
  productName: string;
  dailyDemand: number; // середньоденний попит (скоригований)
  forecastNextMonth: number; // прогноз на 30 днів
  availableDays: number; // реальних днів продажів (без OOS)
  oosdays: number; // днів без товару
}

// ─── Сервіс ────────────────────────────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(SaleItem)
    private readonly saleItemRepo: Repository<SaleItem>,

    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    private readonly stockHistoryService: StockHistoryService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. ABC/XYZ АНАЛІЗ
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Повний ABC/XYZ аналіз з Out-of-Stock компенсацією.
   * @param months — за скільки місяців рахувати (за замовч. 3)
   */
  async getAbcXyzAnalysis(months: number = 3): Promise<AbcXyzResult[]> {
    const { from, to } = this.getDateRange(months);

    // 1. Отримуємо продажі по товарах за період
    const salesData = await this.saleItemRepo
      .createQueryBuilder('si')
      .innerJoin('si.sale', 'sale')
      .where('sale.createdAt BETWEEN :from AND :to', { from, to })
      .select([
        'si.productId AS "productId"',
        'si.productName AS "productName"',
        'SUM(si.quantity) AS "totalQty"',
        'SUM(si.quantity * si.priceAtSale) AS "totalRevenue"',
      ])
      .groupBy('si.productId, si.productName')
      .getRawMany();

    if (!salesData.length) return [];

    const products = await this.productRepo.find();
    const productMap = new Map(products.map((p) => [p.id, p]));

    const totalRevenue = salesData.reduce(
      (sum, r) => sum + parseFloat(r.totalRevenue),
      0,
    );

    // 2. Рахуємо виручку та частку для ABC
    const withRevenue = salesData.map((r) => ({
      productId: parseInt(r.productId),
      productName: r.productName as string,
      sku: productMap.get(parseInt(r.productId))?.sku ?? '',
      totalRevenue: parseFloat(r.totalRevenue),
      totalQty: parseInt(r.totalQty),
      revenueShare: (parseFloat(r.totalRevenue) / totalRevenue) * 100,
      currentStock: productMap.get(parseInt(r.productId))?.stock ?? 0,
    }));

    // Сортуємо за виручкою (спадання)
    withRevenue.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 3. Присвоюємо ABC групи (накопичений %)
    let cumulative = 0;
    const withAbc = withRevenue.map((item) => {
      cumulative += item.revenueShare;
      return {
        ...item,
        cumulativeShare: cumulative,
        abcGroup:
          cumulative <= 80
            ? 'A'
            : cumulative <= 95
              ? 'B'
              : ('C' as 'A' | 'B' | 'C'),
      };
    });

    // 4. XYZ: коефіцієнт варіації по місяцях
    const monthlyData = await this.getMonthlySalesByProduct(months);
    const totalDays = months * 30;

    // 5. Збираємо фінальний результат з OOS-компенсацією
    const results: AbcXyzResult[] = [];

    for (const item of withAbc) {
      // OOS компенсація: реальних днів коли товар був у наявності
      const availableDays =
        await this.stockHistoryService.getAvailableDaysCount(
          item.productId,
          from.toISOString().split('T')[0],
          to.toISOString().split('T')[0],
        );

      // Якщо немає даних stock_history — використовуємо totalDays (без компенсації)
      const denominator = availableDays > 0 ? availableDays : totalDays;
      const avgDailyDemand = item.totalQty / denominator;

      // XYZ: коефіцієнт варіації
      const monthly = monthlyData.get(item.productId) ?? [];
      const cv = this.calculateCV(monthly);
      const xyzGroup: 'X' | 'Y' | 'Z' =
        cv <= 0.25 ? 'X' : cv <= 0.5 ? 'Y' : 'Z';

      // Прогноз попиту на наступні 30 днів (просте експоненційне згладжування)
      const forecastedDemand = Math.ceil(
        this.exponentialSmoothing(monthly, 0.3) * 30,
      );

      // Рекомендація закупівлі: прогноз + страховий запас (7 днів) - поточний залишок
      const safetyStock = Math.ceil(avgDailyDemand * 7);
      const recommendedOrder = Math.max(
        0,
        forecastedDemand + safetyStock - item.currentStock,
      );

      results.push({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        totalRevenue: item.totalRevenue,
        revenueShare: Math.round(item.revenueShare * 100) / 100,
        cumulativeShare: Math.round(item.cumulativeShare * 100) / 100,
        abcGroup: item.abcGroup,
        xyzGroup,
        matrix: `${item.abcGroup}${xyzGroup}`,
        avgDailyDemand: Math.round(avgDailyDemand * 100) / 100,
        forecastedDemand,
        currentStock: item.currentStock,
        recommendedOrder,
        variationCoefficient: Math.round(cv * 1000) / 1000,
      });
    }

    return results;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. ПРОГНОЗ ПОПИТУ (окремо, з OOS-компенсацією)
  // ══════════════════════════════════════════════════════════════════════════════

  async getForecast(months: number = 3): Promise<ForecastResult[]> {
    const { from, to } = this.getDateRange(months);
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    const totalDays = months * 30;

    const salesData = await this.saleItemRepo
      .createQueryBuilder('si')
      .innerJoin('si.sale', 'sale')
      .where('sale.createdAt BETWEEN :from AND :to', { from, to })
      .select([
        'si.productId AS "productId"',
        'si.productName AS "productName"',
        'SUM(si.quantity) AS "totalQty"',
      ])
      .groupBy('si.productId, si.productName')
      .getRawMany();

    const results: ForecastResult[] = [];

    for (const row of salesData) {
      const productId = parseInt(row.productId);
      const totalQty = parseInt(row.totalQty);

      const availableDays =
        await this.stockHistoryService.getAvailableDaysCount(
          productId,
          fromStr,
          toStr,
        );
      const oosDays = totalDays - availableDays;
      const denominator = availableDays > 0 ? availableDays : totalDays;
      const dailyDemand = totalQty / denominator;

      results.push({
        productId,
        productName: row.productName,
        dailyDemand: Math.round(dailyDemand * 100) / 100,
        forecastNextMonth: Math.ceil(dailyDemand * 30),
        availableDays: denominator,
        oosdays: Math.max(0, oosDays),
      });
    }

    return results.sort((a, b) => b.forecastNextMonth - a.forecastNextMonth);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. MARKET BASKET ANALYSIS (аналіз кошика)
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Знаходить товари які часто купують разом.
   * @param minSupport — мінімальна частота (0–1), за замовч. 0.1 (10% чеків)
   * @param minConfidence — мінімальна впевненість (0–1), за замовч. 0.5
   */
  async getMarketBasketRules(
    minSupport: number = 0.1,
    minConfidence: number = 0.5,
  ): Promise<MarketBasketRule[]> {
    // Беремо всі чеки з більш ніж 1 позицією
    const saleIds = await this.saleItemRepo
      .createQueryBuilder('si')
      .select('si.saleId', 'saleId')
      .groupBy('si.saleId')
      .having('COUNT(si.id) > 1')
      .getRawMany();

    if (!saleIds.length) return [];

    const ids = saleIds.map((r) => r.saleId);
    const totalTransactions = ids.length;

    const items = await this.saleItemRepo
      .createQueryBuilder('si')
      .where('si.saleId IN (:...ids)', { ids })
      .select(['si.saleId', 'si.productId', 'si.productName'])
      .getMany();

    // Групуємо по чеку
    const basket = new Map<number, { id: number; name: string }[]>();
    for (const item of items) {
      if (!basket.has(item.saleId)) basket.set(item.saleId, []);
      basket
        .get(item.saleId)!
        .push({ id: item.productId, name: item.productName });
    }

    // Рахуємо support для пар
    const pairCount = new Map<string, number>();
    const itemCount = new Map<number, number>();

    for (const [, basketItems] of basket) {
      for (const item of basketItems) {
        itemCount.set(item.id, (itemCount.get(item.id) ?? 0) + 1);
      }

      for (let i = 0; i < basketItems.length; i++) {
        for (let j = i + 1; j < basketItems.length; j++) {
          const key = [basketItems[i].id, basketItems[j].id].sort().join('_');
          pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
        }
      }
    }

    const rules: MarketBasketRule[] = [];

    for (const [pair, count] of pairCount) {
      const support = count / totalTransactions;
      if (support < minSupport) continue;

      const [idA, idB] = pair.split('_').map(Number);
      const nameA =
        items.find((i) => i.productId === idA)?.productName ?? `#${idA}`;
      const nameB =
        items.find((i) => i.productId === idB)?.productName ?? `#${idB}`;

      const countA = itemCount.get(idA) ?? 1;
      const countB = itemCount.get(idB) ?? 1;

      const confidenceAtoB = count / countA;
      const confidenceBtoA = count / countB;

      const supportA = countA / totalTransactions;
      const supportB = countB / totalTransactions;

      if (confidenceAtoB >= minConfidence) {
        rules.push({
          itemA: nameA,
          itemB: nameB,
          support: Math.round(support * 1000) / 1000,
          confidence: Math.round(confidenceAtoB * 1000) / 1000,
          lift: Math.round((confidenceAtoB / supportB) * 1000) / 1000,
        });
      }

      if (confidenceBtoA >= minConfidence && idA !== idB) {
        rules.push({
          itemA: nameB,
          itemB: nameA,
          support: Math.round(support * 1000) / 1000,
          confidence: Math.round(confidenceBtoA * 1000) / 1000,
          lift: Math.round((confidenceBtoA / supportA) * 1000) / 1000,
        });
      }
    }

    return rules.sort((a, b) => b.lift - a.lift);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ПРИВАТНІ МЕТОДИ
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Повертає продажі по місяцях для кожного товару.
   * Потрібно для розрахунку коефіцієнта варіації (XYZ).
   */
  private async getMonthlySalesByProduct(
    months: number,
  ): Promise<Map<number, number[]>> {
    const { from, to } = this.getDateRange(months);

    const rows = await this.saleItemRepo
      .createQueryBuilder('si')
      .innerJoin('si.sale', 'sale')
      .where('sale.createdAt BETWEEN :from AND :to', { from, to })
      .select([
        'si.productId AS "productId"',
        "TO_CHAR(sale.createdAt, 'YYYY-MM') AS month",
        'SUM(si.quantity) AS qty',
      ])
      .groupBy('si.productId, month')
      .orderBy('month', 'ASC')
      .getRawMany();

    const map = new Map<number, number[]>();
    for (const row of rows) {
      const id = parseInt(row.productId);
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(parseFloat(row.qty));
    }

    return map;
  }

  /**
   * Коефіцієнт варіації: CV = σ / μ
   * CV ≤ 0.25 → X (стабільний), ≤ 0.5 → Y, > 0.5 → Z (нестабільний)
   */
  private calculateCV(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    if (mean === 0) return 1;
    const variance =
      values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  /**
   * Просте експоненційне згладжування.
   * Повертає прогноз на наступний період.
   * @param values — масив значень по місяцях
   * @param alpha — коефіцієнт згладжування (0–1)
   */
  private exponentialSmoothing(values: number[], alpha: number = 0.3): number {
    if (!values.length) return 0;
    if (values.length === 1) return values[0];

    let smoothed = values[0];
    for (let i = 1; i < values.length; i++) {
      // Фільтр аномалій: якщо значення > 3σ від поточного — ігноруємо
      const deviation = Math.abs(values[i] - smoothed);
      const threshold = smoothed * 2;
      const actual =
        deviation > threshold && smoothed > 0 ? smoothed : values[i];

      smoothed = alpha * actual + (1 - alpha) * smoothed;
    }
    return smoothed;
  }

  /**
   * Утиліта: повертає діапазон дат {from, to} для N місяців назад.
   */
  private getDateRange(months: number): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    return { from, to };
  }
}
