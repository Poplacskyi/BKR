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
    private dataSource: DataSource,
  ) {}

  async createSale(createSaleDto: CreateSaleDto, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const saleItemsToSave: SaleItem[] = []; // Вказуємо TypeScript, що тут будуть об'єкти SaleItem

      // 1. Проходимося по кожному товару в кошику
      for (const item of createSaleDto.items) {
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

        // 3. Рахуємо суму (жорстко конвертуємо ціну продажу в число)
        const askPrice = Number(product.askPrice);
        const itemTotal = askPrice * item.quantity;
        totalAmount += itemTotal;

        // Формуємо сутність SaleItem, але поки не зберігаємо її окремо
        saleItemsToSave.push(
          queryRunner.manager.create(SaleItem, {
            product: product, // Передаємо сам об'єкт для правильного зв'язку
            productId: product.id,
            productName: product.name,
            quantity: item.quantity,
            priceAtSale: askPrice,
          }),
        );
      }

      // 4. Створюємо чек і передаємо йому масив товарів
      const sale = queryRunner.manager.create(Sale, {
        userId,
        totalAmount,
        items: saleItemsToSave, // <--- КАСКАДНЕ ЗБЕРЕЖЕННЯ: TypeORM сам запише це в sale_items!
      });

      // Зберігаємо чек і всі його товари однією командою
      const savedSale = await queryRunner.manager.save(sale);

      await queryRunner.commitTransaction(); // Підтверджуємо транзакцію
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

  async findAllSales(userId: number) {
    return this.salesRepository.find({
      where: { userId },
      relations: ['items'], // Підтягуємо всі позиції чека з sale_items
      order: { createdAt: 'DESC' },
    });
  }
}
