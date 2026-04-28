// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users') // Назва таблиці в БД
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  // Тут ви можете додати інші поля, які знадобляться для вашої системи
  // наприклад: @Column({ nullable: true }) companyName: string;
}
