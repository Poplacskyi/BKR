import { Controller, Get, Query, Post, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { StockHistoryService } from '../stock-history/stock-history.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // розкоментуйте якщо є JWT

@Controller('analytics')
// @UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly stockHistoryService: StockHistoryService,
  ) {}

  /**
   * GET /analytics/abc-xyz?months=3
   * Повна ABC/XYZ матриця з рекомендаціями закупівель
   */
  @Get('abc-xyz')
  async getAbcXyz(@Query('months') months?: string) {
    return this.analyticsService.getAbcXyzAnalysis(
      months ? parseInt(months) : 3,
    );
  }

  /**
   * GET /analytics/forecast?months=3
   * Прогноз попиту по кожному товару з OOS-компенсацією
   */
  @Get('forecast')
  async getForecast(@Query('months') months?: string) {
    return this.analyticsService.getForecast(months ? parseInt(months) : 3);
  }

  /**
   * GET /analytics/market-basket?minSupport=0.1&minConfidence=0.5
   * Аналіз кошика: які товари купують разом
   */
  @Get('market-basket')
  async getMarketBasket(
    @Query('minSupport') minSupport?: string,
    @Query('minConfidence') minConfidence?: string,
  ) {
    return this.analyticsService.getMarketBasketRules(
      minSupport ? parseFloat(minSupport) : 0.1,
      minConfidence ? parseFloat(minConfidence) : 0.5,
    );
  }

  /**
   * POST /analytics/snapshot
   * Ручний знімок залишків (для тестування, без очікування крону)
   */
  @Post('snapshot')
  async takeSnapshot() {
    return this.stockHistoryService.takeSnapshotNow();
  }
}
