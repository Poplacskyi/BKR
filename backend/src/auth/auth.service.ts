// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service'; // Імпортуємо сервіс користувачів

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService, // Інжектимо UsersService
  ) {}

  async register(dto: AuthDto) {
    // 1. Перевіряємо, чи існує користувач з таким email
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Користувач з таким email вже існує');
    }

    // 2. Хешуємо пароль
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 3. Зберігаємо користувача в БД
    await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
    });

    return { message: 'Користувач успішно зареєстрований' };
  }

  async login(dto: AuthDto) {
    // 1. Шукаємо користувача в базі даних
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    // 2. Порівнюємо введений пароль з хешем у базі
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    // 3. Генеруємо JWT токен
    const payload = { sub: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
    };
  }
}
