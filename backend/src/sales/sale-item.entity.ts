// src/sales/entities/sale-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../product/product.entity'; // Ваш шлях до Product

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column()
  saleId: number;

  @ManyToOne(() => Product, { onDelete: 'SET NULL' }) // Якщо товар видалять, в історії він залишиться, просто без зв'язку
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  productId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  productName: string; // Зберігаємо назву історично (на випадок, якщо товар перейменують або видалять)

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtSale: number; // ЦІНА НА МОМЕНТ ПРОДАЖУ (дуже важливо!)
}
