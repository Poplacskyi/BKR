import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHistory } from './stock-history.entity';
import { Product } from '../product/product.entity';

@Injectable()
export class StockHistoryService {
  private readonly logger = new Logger(StockHistoryService.name);

  constructor(
    @InjectRepository(StockHistory)
    private readonly stockHistoryRepo: Repository<StockHistory>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  /**
   * Щодня о 23:59 знімає залишки всіх товарів.
   * Це і є основа для Out-of-Stock компенсації:
   * якщо stockEnd = 0 — день виключається зі знаменника при прогнозуванні.
   */
  @Cron('59 23 * * *') // щодня о 23:59
  async takeSnapshot(): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const products = await this.productRepo.find();

    let saved = 0;
    for (const product of products) {
      // upsert: якщо запис на цей день вже є — оновлюємо, не дублюємо
      await this.stockHistoryRepo
        .createQueryBuilder()
        .insert()
        .into(StockHistory)
        .values({
          productId: product.id,
          date: today,
          stockEnd: product.stock ?? 0,
        })
        .orUpdate(['stock_end'], ['product_id', 'date'])
        .execute();
      saved++;
    }

    this.logger.log(
      `[StockHistory] Знімок зроблено: ${saved} товарів за ${today}`,
    );
  }

  /**
   * Повертає дні коли товар був відсутній (stockEnd = 0).
   * Використовується в аналітиці для Out-of-Stock компенсації.
   */
  async getOutOfStockDays(
    productId: number,
    from: string,
    to: string,
  ): Promise<string[]> {
    const records = await this.stockHistoryRepo
      .createQueryBuilder('sh')
      .where('sh.product_id = :productId', { productId })
      .andWhere('sh.date BETWEEN :from AND :to', { from, to })
      .andWhere('sh.stock_end = 0')
      .select('sh.date', 'date')
      .getRawMany();

    return records.map((r) => r.date);
  }

  /**
   * Кількість днів коли товар був в наявності (stockEnd > 0).
   * Знаменник для розрахунку середньоденного попиту.
   */
  async getAvailableDaysCount(
    productId: number,
    from: string,
    to: string,
  ): Promise<number> {
    const result = await this.stockHistoryRepo
      .createQueryBuilder('sh')
      .where('sh.product_id = :productId', { productId })
      .andWhere('sh.date BETWEEN :from AND :to', { from, to })
      .andWhere('sh.stock_end > 0')
      .getCount();

    return result;
  }

  /**
   * Ручний знімок — для тестування або першого запуску.
   */
  async takeSnapshotNow(): Promise<{ message: string; count: number }> {
    await this.takeSnapshot();
    const products = await this.productRepo.find();
    return {
      message: 'Знімок залишків зроблено вручну',
      count: products.length,
    };
  }
}
