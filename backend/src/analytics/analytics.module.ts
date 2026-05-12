import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SaleItem } from '../sales/sale-item.entity';
import { Sale } from '../sales/sale.entity';
import { Product } from '../product/product.entity';
import { StockHistoryModule } from '../stock-history/stock-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleItem, Sale, Product]),
    StockHistoryModule, // підключаємо StockHistoryService
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
