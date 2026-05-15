import { Controller, Get, Query, Post, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { StockHistoryService } from '../stock-history/stock-history.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

// Додаємо правильний інтерфейс, як у SalesController
interface RequestWithUser extends Request {
  user: { userId: number; email: string };
}

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
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
  async getAbcXyz(
    @Req() req: RequestWithUser,
    @Query('months') months?: string,
  ) {
    const userId = req.user.userId; // ВИПРАВЛЕНО: тепер ми беремо правильний userId
    return this.analyticsService.getAbcXyzAnalysis(
      userId,
      months ? parseInt(months) : 3,
    );
  }

  /**
   * GET /analytics/forecast?months=3
   * Прогноз попиту по кожному товару з OOS-компенсацією
   */
  @Get('forecast')
  async getForecast(
    @Req() req: RequestWithUser,
    @Query('months') months?: string,
  ) {
    const userId = req.user.userId; // ВИПРАВЛЕНО
    return this.analyticsService.getForecast(
      userId,
      months ? parseInt(months) : 3,
    );
  }

  /**
   * GET /analytics/market-basket?minSupport=0.1&minConfidence=0.5
   * Аналіз кошика: які товари купують разом
   */
  @Get('market-basket')
  async getMarketBasket(
    @Req() req: RequestWithUser,
    @Query('minSupport') minSupport?: string,
    @Query('minConfidence') minConfidence?: string,
  ) {
    const userId = req.user.userId; // ВИПРАВЛЕНО
    return this.analyticsService.getMarketBasketRules(
      userId,
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
