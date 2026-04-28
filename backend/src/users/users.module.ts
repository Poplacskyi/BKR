// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Підключаємо Entity
  providers: [UsersService],
  exports: [UsersService], // Експортуємо сервіс, щоб його бачив AuthModule
})
export class UsersModule {}
