import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

export type CurrencyCode = 'UAH' | 'USD' | 'EUR';

@Entity('settings')
export class Settings {
  // userId — одночасно і PK і FK: один запис на користувача
  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 3, default: 'UAH' })
  currency: CurrencyCode;

  // Курс відносно гривні (UAH = 1.0 завжди)
  // Зберігаємо останній отриманий курс — щоб застосунок
  // працював навіть якщо НБУ тимчасово недоступний
  @Column({ type: 'numeric', precision: 10, scale: 4, default: 1.0 })
  exchangeRate: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
