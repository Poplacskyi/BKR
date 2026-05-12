import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockHistory } from './stock-history.entity';
import { StockHistoryService } from './stock-history.service';
import { Product } from '../product/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockHistory, Product])],
  providers: [StockHistoryService],
  exports: [StockHistoryService], // експортуємо щоб AnalyticsModule міг використати
})
export class StockHistoryModule {}
