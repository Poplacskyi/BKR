import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from '../product/product.entity';

@Entity('stock_history')
@Index(['productId', 'date'], { unique: true }) // один запис на товар на день
export class StockHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Дата знімка залишку (без часу — тільки день)
  @Column({ type: 'date' })
  date: string;

  // Залишок на кінець дня
  @Column({ name: 'stock_end', type: 'integer' })
  stockEnd: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
