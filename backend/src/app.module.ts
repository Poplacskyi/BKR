import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/users.entity';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './product/products.module';
import { Product } from './product/product.entity';
import { SalesModule } from './sales/sales.module';
import { Sale } from './sales/sale.entity';
import { SaleItem } from './sales/sale-item.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { StockHistoryModule } from './stock-history/stock-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Налаштування підключення до бази даних
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'my_database',
      entities: [User, Product, Sale, SaleItem], // Додаємо сутності користувачів та товарів
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    AnalyticsModule,
    StockHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
