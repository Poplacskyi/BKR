// src/sales/sales.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale } from './sale.entity';
import { SaleItem } from './sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Product } from '../product/product.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private salesRepository: Repository<Sale>,
    private dataSource: DataSource, // Потрібен для транзакцій бази даних
  ) {}

  async createSale(createSaleDto: CreateSaleDto, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction(); // Початок транзакції

    try {
      let totalAmount = 0;
      const saleItemsToSave: Partial<SaleItem>[] = [];

      // 1. Проходимося по кожному товару в кошику
      for (const item of createSaleDto.items) {
        // Блокуємо рядок товару для читання, щоб ніхто інший не купив його в цю ж мілісекунду
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId, userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new BadRequestException(
            `Товар з ID ${item.productId} не знайдено`,
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Недостатньо на складі: ${product.name} (Залишок: ${product.stock})`,
          );
        }

        // 2. Віднімаємо залишок
        product.stock -= item.quantity;
        await queryRunner.manager.save(product);

        // 3. Рахуємо суму і формуємо запис для чека
        const itemTotal = Number(product.price) * item.quantity;
        totalAmount += itemTotal;

        saleItemsToSave.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          priceAtSale: product.price,
        });
      }

      // 4. Створюємо сам чек
      const sale = queryRunner.manager.create(Sale, {
        userId,
        totalAmount,
      });
      const savedSale = await queryRunner.manager.save(sale);

      // 5. Зберігаємо позиції чека (прив'язуємо до створеного чека)
      for (const item of saleItemsToSave) {
        const saleItem = queryRunner.manager.create(SaleItem, {
          ...item,
          saleId: savedSale.id,
        });
        await queryRunner.manager.save(saleItem);
      }

      await queryRunner.commitTransaction(); // Підтверджуємо транзакцію!
      return savedSale;
    } catch (error) {
      await queryRunner.rollbackTransaction(); // Якщо помилка - скасовуємо всі зміни
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Помилка при створенні продажу',
        error.message,
      );
    } finally {
      await queryRunner.release(); // Звільняємо підключення
    }
  }

  async findAllSales(userId: number) {
    return this.salesRepository.find({
      where: { userId },
      relations: ['items'], // Підтягуємо вміст чека
      order: { createdAt: 'DESC' }, // Найновіші зверху
    });
  }
}
