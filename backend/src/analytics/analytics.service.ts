import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleItem } from '../sales/sale-item.entity';
import { Sale } from '../sales/sale.entity';
import { Product } from '../product/product.entity';
import { StockHistoryService } from '../stock-history/stock-history.service';

// ─── Типи результатів ─────────────────────────────────────────────────────────

export interface AbcXyzResult {
  productId: number;
  productName: string;
  sku: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  margin: number;
  revenueShare: number;
  cumulativeShare: number;
  abcGroup: 'A' | 'B' | 'C';
  profitShare: number;
  profitCumulativeShare: number;
  abcProfitGroup: 'A' | 'B' | 'C';
  xyzGroup: 'X' | 'Y' | 'Z';
  variationCoefficient: number;
  matrix: string;
  avgDailyDemand: number;
  forecastedDemand: number;
  currentStock: number;
  stockValue: number;
  recommendedOrder: number;
  recommendedOrderCost: number;
}

export interface ForecastResult {
  productId: number;
  productName: string;
  dailyDemand: number;
  forecastNextMonth: number;
  availableDays: number;
  oosdays: number;
  forecastedRevenue: number;
  forecastedProfit: number;
}

export interface MarketBasketRule {
  itemA: string;
  itemB: string;
  support: number;
  confidence: number;
  lift: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgMargin: number;
  totalStockValue: number;
  productsNeedReorder: number;
  totalOosDays: number;
}

// ─── Сервіс ───────────────────────────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(SaleItem)
    private readonly saleItemRepo: Repository<SaleItem>,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly stockHistoryService: StockHistoryService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────────
  // 1. ПІДСУМКОВІ KPI (Для майбутнього Дашборду)
  // ──────────────────────────────────────────────────────────────────────────────
  async getSummary(months = 3): Promise<AnalyticsSummary> {
    const [abcData, forecastData, products] = await Promise.all([
      this.getAbcXyzAnalysis(months),
      this.getForecast(months),
      this.productRepo.find(),
    ]);

    const totalRevenue = abcData.reduce((s, d) => s + d.totalRevenue, 0);
    const totalCost = abcData.reduce((s, d) => s + d.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const totalStockValue = products.reduce((sum, p: any) => {
      const stock = Number(p.volume ?? p.stock ?? 0);
      const bidPrice = Number(p.bidPrice ?? p.purchasePrice ?? 0);
      return sum + stock * bidPrice;
    }, 0);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      avgMargin: Math.round(avgMargin * 10) / 10,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      productsNeedReorder: abcData.filter((d) => d.recommendedOrder > 0).length,
      totalOosDays: forecastData.reduce((s, d) => s + d.oosdays, 0),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 2. ABC/XYZ АНАЛІЗ (З урахуванням прибутку та собівартості)
  // ──────────────────────────────────────────────────────────────────────────────
  async getAbcXyzAnalysis(months = 3): Promise<AbcXyzResult[]> {
    const { from, to } = this.getDateRange(months);

    // Отримуємо продажі (Виручка рахується через priceAtSale)
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

    // Збагачуємо дані собівартістю на стороні JS (найбезпечніший метод)
    const enriched = salesData.map((r) => {
      const productId = parseInt(r.productId);
      const prod: any = productMap.get(productId) || {};

      const totalQty = parseInt(r.totalQty || '0');
      const revenue = parseFloat(r.totalRevenue || '0');

      // Гнучкий пошук полів (підтримує bidPrice або purchasePrice)
      const bidPrice = Number(prod.bidPrice ?? prod.purchasePrice ?? 0);
      const currentStock = Number(prod.volume ?? prod.stock ?? 0);
      const sku = prod.sku ?? '';

      const cost = totalQty * bidPrice;
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        productId,
        productName: r.productName as string,
        sku,
        totalQty,
        totalRevenue: revenue,
        totalCost: cost,
        grossProfit: profit,
        margin,
        currentStock,
        bidPrice,
      };
    });

    const totalRevenue = enriched.reduce((s, r) => s + r.totalRevenue, 0);
    const totalProfit = enriched.reduce((s, r) => s + r.grossProfit, 0);

    // Рахуємо частки
    enriched.forEach((item) => {
      (item as any).revenueShare =
        totalRevenue > 0 ? (item.totalRevenue / totalRevenue) * 100 : 0;
      (item as any).profitShare =
        totalProfit > 0 ? (item.grossProfit / totalProfit) * 100 : 0;
    });

    // ABC за ВИРУЧКОЮ
    enriched.sort((a, b) => b.totalRevenue - a.totalRevenue);
    let cumRev = 0;
    const withAbcRev = enriched.map((item: any) => {
      cumRev += item.revenueShare;
      return {
        ...item,
        cumulativeShare: cumRev,
        abcGroup: this.abcGroup(cumRev),
      };
    });

    // ABC за ПРИБУТКОМ
    const sortedByProfit = [...withAbcRev].sort(
      (a, b) => b.grossProfit - a.grossProfit,
    );
    let cumProfit = 0;
    const profitGroupMap = new Map<
      number,
      { cumShare: number; group: 'A' | 'B' | 'C' }
    >();

    for (const item of sortedByProfit) {
      cumProfit += item.profitShare;
      profitGroupMap.set(item.productId, {
        cumShare: cumProfit,
        group: this.abcGroup(cumProfit),
      });
    }

    const monthlyData = await this.getMonthlySalesByProduct(months);
    const totalDays = months * 30;
    const results: AbcXyzResult[] = [];

    for (const item of withAbcRev) {
      const pg = profitGroupMap.get(item.productId) ?? {
        cumShare: 0,
        group: 'C' as const,
      };

      const availableDays =
        await this.stockHistoryService.getAvailableDaysCount(
          item.productId,
          from.toISOString().split('T')[0],
          to.toISOString().split('T')[0],
        );

      const denominator = availableDays > 0 ? availableDays : totalDays;
      const avgDailyDemand = item.totalQty / denominator;

      const monthly = monthlyData.get(item.productId) ?? [];
      const cv = this.calculateCV(monthly);
      const xyzGroup = cv <= 0.25 ? 'X' : cv <= 0.5 ? 'Y' : 'Z';
      const forecastedDemand = Math.ceil(
        this.exponentialSmoothing(monthly, 0.3) * 30,
      );
      const safetyStock = Math.ceil(avgDailyDemand * 7);
      const recommendedOrder = Math.max(
        0,
        forecastedDemand + safetyStock - item.currentStock,
      );

      results.push({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,

        totalRevenue: Math.round(item.totalRevenue * 100) / 100,
        totalCost: Math.round(item.totalCost * 100) / 100,
        grossProfit: Math.round(item.grossProfit * 100) / 100,
        margin: Math.round(item.margin * 10) / 10,

        revenueShare: Math.round(item.revenueShare * 100) / 100,
        cumulativeShare: Math.round(item.cumulativeShare * 100) / 100,
        abcGroup: item.abcGroup,

        profitShare: Math.round(item.profitShare * 100) / 100,
        profitCumulativeShare: Math.round(pg.cumShare * 100) / 100,
        abcProfitGroup: pg.group,

        xyzGroup,
        variationCoefficient: Math.round(cv * 1000) / 1000,
        matrix: `${item.abcGroup}${xyzGroup}`,

        avgDailyDemand: Math.round(avgDailyDemand * 100) / 100,
        forecastedDemand,

        currentStock: item.currentStock,
        stockValue: Math.round(item.currentStock * item.bidPrice * 100) / 100,
        recommendedOrder,
        recommendedOrderCost:
          Math.round(recommendedOrder * item.bidPrice * 100) / 100,
      });
    }

    return results;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 3. ПРОГНОЗ ПОПИТУ
  // ──────────────────────────────────────────────────────────────────────────────
  async getForecast(months = 3): Promise<ForecastResult[]> {
    const { from, to } = this.getDateRange(months);
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

    const products = await this.productRepo.find();
    const productMap = new Map(products.map((p) => [p.id, p]));

    const results: ForecastResult[] = [];

    for (const row of salesData) {
      const productId = parseInt(row.productId);
      const totalQty = parseInt(row.totalQty);

      const prod: any = productMap.get(productId) || {};
      const bidPrice = Number(prod.bidPrice ?? prod.purchasePrice ?? 0);
      const askPrice = Number(
        prod.askPrice ?? prod.salePrice ?? prod.price ?? 0,
      );

      const availableDays =
        await this.stockHistoryService.getAvailableDaysCount(
          productId,
          from.toISOString().split('T')[0],
          to.toISOString().split('T')[0],
        );

      const oosDays = Math.max(0, totalDays - availableDays);
      const denominator = availableDays > 0 ? availableDays : totalDays;
      const dailyDemand = totalQty / denominator;
      const forecastNextMonth = Math.ceil(dailyDemand * 30);

      results.push({
        productId,
        productName: row.productName,
        dailyDemand: Math.round(dailyDemand * 100) / 100,
        forecastNextMonth,
        availableDays: denominator,
        oosdays: oosDays,
        forecastedRevenue: Math.round(forecastNextMonth * askPrice * 100) / 100,
        forecastedProfit:
          Math.round(forecastNextMonth * (askPrice - bidPrice) * 100) / 100,
      });
    }

    return results.sort((a, b) => b.forecastedProfit - a.forecastedProfit);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 4. MARKET BASKET (Аналіз кошика)
  // ──────────────────────────────────────────────────────────────────────────────
  async getMarketBasketRules(
    minSupport = 0.1,
    minConfidence = 0.5,
  ): Promise<MarketBasketRule[]> {
    const saleIds = await this.saleItemRepo
      .createQueryBuilder('si')
      .select('si.saleId', 'saleId')
      .groupBy('si.saleId')
      .having('COUNT(si.id) > 1')
      .getRawMany();

    if (!saleIds.length) return [];
    const ids = saleIds.map((r) => r.saleId);
    const totalT = ids.length;

    const items = await this.saleItemRepo
      .createQueryBuilder('si')
      .where('si.saleId IN (:...ids)', { ids })
      .select(['si.saleId', 'si.productId', 'si.productName'])
      .getMany();

    const basket = new Map<number, { id: number; name: string }[]>();
    for (const item of items) {
      if (!basket.has(item.saleId)) basket.set(item.saleId, []);
      basket
        .get(item.saleId)!
        .push({ id: item.productId, name: item.productName });
    }

    const pairCount = new Map<string, number>();
    const itemCount = new Map<number, number>();

    for (const [, bi] of basket) {
      for (const item of bi)
        itemCount.set(item.id, (itemCount.get(item.id) ?? 0) + 1);
      for (let i = 0; i < bi.length; i++) {
        for (let j = i + 1; j < bi.length; j++) {
          const key = [bi[i].id, bi[j].id].sort().join('_');
          pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
        }
      }
    }

    const rules: MarketBasketRule[] = [];
    for (const [pair, count] of pairCount) {
      const support = count / totalT;
      if (support < minSupport) continue;
      const [idA, idB] = pair.split('_').map(Number);
      const nameA =
        items.find((i) => i.productId === idA)?.productName ?? `#${idA}`;
      const nameB =
        items.find((i) => i.productId === idB)?.productName ?? `#${idB}`;
      const cA = itemCount.get(idA) ?? 1;
      const cB = itemCount.get(idB) ?? 1;
      const confAB = count / cA;
      const confBA = count / cB;
      const supA = cA / totalT;
      const supB = cB / totalT;
      const r = (n: number) => Math.round(n * 1000) / 1000;

      if (confAB >= minConfidence) {
        rules.push({
          itemA: nameA,
          itemB: nameB,
          support: r(support),
          confidence: r(confAB),
          lift: r(confAB / supB),
        });
      }
      if (idA !== idB && confBA >= minConfidence) {
        rules.push({
          itemA: nameB,
          itemB: nameA,
          support: r(support),
          confidence: r(confBA),
          lift: r(confBA / supA),
        });
      }
    }
    return rules.sort((a, b) => b.lift - a.lift);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ПРИВАТНІ МЕТОДИ
  // ──────────────────────────────────────────────────────────────────────────────
  private abcGroup(cum: number): 'A' | 'B' | 'C' {
    return cum <= 80 ? 'A' : cum <= 95 ? 'B' : 'C';
  }

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

  private calculateCV(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    if (mean === 0) return 1;
    const variance =
      values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  private exponentialSmoothing(values: number[], alpha = 0.3): number {
    if (!values.length) return 0;
    if (values.length === 1) return values[0];
    let s = values[0];
    for (let i = 1; i < values.length; i++) {
      const v = Math.abs(values[i] - s) > s * 2 && s > 0 ? s : values[i];
      s = alpha * v + (1 - alpha) * s;
    }
    return s;
  }

  private getDateRange(months: number): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    return { from, to };
  }
}
