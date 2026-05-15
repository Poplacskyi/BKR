import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale } from './sale.entity';
import { SaleItem } from './sale-item.entity';
import { Product } from '../product/product.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private salesRepository: Repository<Sale>,
    private dataSource: DataSource,
  ) {}

  // --- СТВОРЕННЯ ЧЕКА ---
  async createSale(createSaleDto: any, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const saleItemsToSave: SaleItem[] = [];

      for (const item of createSaleDto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId, userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product)
          throw new BadRequestException(
            `Товар з ID ${item.productId} не знайдено`,
          );
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Недостатньо на складі: ${product.name} (Залишок: ${product.stock})`,
          );
        }

        product.stock -= item.quantity;
        await queryRunner.manager.save(product);

        // Якщо з фронтенду прийшла змінена ціна - використовуємо її, інакше беремо стандартну
        const finalPrice =
          item.priceAtSale !== undefined
            ? Number(item.priceAtSale)
            : Number(product.askPrice);
        const itemTotal = finalPrice * item.quantity;
        totalAmount += itemTotal;

        saleItemsToSave.push(
          queryRunner.manager.create(SaleItem, {
            product: product,
            productId: product.id,
            productName: product.name,
            quantity: item.quantity,
            priceAtSale: finalPrice,
          }),
        );
      }

      const sale = queryRunner.manager.create(Sale, {
        userId,
        totalAmount,
        items: saleItemsToSave,
      });
      const savedSale = await queryRunner.manager.save(sale);

      await queryRunner.commitTransaction();
      return savedSale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Помилка при створенні продажу',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  // --- РЕДАГУВАННЯ ЧЕКА ---
  async updateSale(saleId: number, updateSaleDto: any, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Знаходимо старий чек з його товарами
      const existingSale = await queryRunner.manager.findOne(Sale, {
        where: { id: saleId, userId },
        relations: ['items'],
      });

      if (!existingSale) throw new NotFoundException('Чек не знайдено');

      // 2. ПОВЕРТАЄМО старі товари на склад
      for (const oldItem of existingSale.items) {
        if (oldItem.productId) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { id: oldItem.productId, userId },
            lock: { mode: 'pessimistic_write' },
          });
          if (product) {
            product.stock += oldItem.quantity; // Повертаємо залишок
            await queryRunner.manager.save(product);
          }
        }
      }

      // 3. Видаляємо старі позиції чека з бази
      await queryRunner.manager.remove(existingSale.items);

      // 4. ДОДАЄМО нові товари (як при створенні)
      let totalAmount = 0;
      const saleItemsToSave: SaleItem[] = [];

      for (const item of updateSaleDto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId, userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product)
          throw new BadRequestException(
            `Товар з ID ${item.productId} не знайдено`,
          );
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Недостатньо на складі: ${product.name} (Залишок: ${product.stock})`,
          );
        }

        product.stock -= item.quantity;
        await queryRunner.manager.save(product);

        const finalPrice =
          item.priceAtSale !== undefined
            ? Number(item.priceAtSale)
            : Number(product.askPrice);
        totalAmount += finalPrice * item.quantity;

        saleItemsToSave.push(
          queryRunner.manager.create(SaleItem, {
            product: product,
            productId: product.id,
            productName: product.name,
            quantity: item.quantity,
            priceAtSale: finalPrice,
          }),
        );
      }

      // 5. Оновлюємо чек
      existingSale.totalAmount = totalAmount;
      existingSale.items = saleItemsToSave; // Каскадне збереження нових позицій

      const savedSale = await queryRunner.manager.save(existingSale);
      await queryRunner.commitTransaction();
      return savedSale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        'Помилка при оновленні чека',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  // --- ОТРИМАННЯ ЧЕКІВ ---
  async findAllSales(userId: number) {
    return this.salesRepository.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }
}
