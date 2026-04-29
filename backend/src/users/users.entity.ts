// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Product } from 'src/product/product.entity';

@Entity('users') // Назва таблиці в БД
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Product, (product) => product.user)
  products!: Product[];

  // Тут ви можете додати інші поля, які знадобляться для вашої системи
  // наприклад: @Column({ nullable: true }) companyName: string;
}
