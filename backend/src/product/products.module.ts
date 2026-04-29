// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])], // Підключаємо таблицю
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // Експортуємо, якщо знадобиться в модулі аналітики
})
export class ProductsModule {}
