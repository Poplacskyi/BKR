import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/users.entity';
import { ProductsModule } from './product/products.module';
import { Product } from './product/product.entity';
import { SalesModule } from './sales/sales.module';
import { Sale } from './sales/sale.entity';
import { SaleItem } from './sales/sale-item.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { StockHistoryModule } from './stock-history/stock-history.module';
import { StockHistory } from './stock-history/stock-history.entity';

@Module({
  imports: [
    // 1. Ініціалізуємо ConfigModule глобально
    ConfigModule.forRoot({ isGlobal: true }),

    // 2. Асинхронне налаштування БД
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Отримуємо URL бази даних (Railway додає його автоматично)
        const dbUrl = configService.get<string>('DATABASE_URL');

        // Якщо dbUrl існує (ми на Railway)
        if (dbUrl) {
          return {
            type: 'postgres',
            url: dbUrl, // Використовуємо єдиний рядок підключення
            entities: [User, Product, Sale, SaleItem, StockHistory],
            synchronize: true, // Увага: для продакшену зазвичай ставлять false, але для MVP залишаємо true
            // Розкоментуйте блок нижче, якщо Railway видаватиме помилку SSL:
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        // Якщо dbUrl НЕМАЄ (ми локально на комп'ютері)
        return {
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'root', // Ваш локальний пароль
          database: 'my_database', // Ваша локальна БД
          entities: [User, Product, Sale, SaleItem, StockHistory],
          synchronize: true,
        };
      },
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
