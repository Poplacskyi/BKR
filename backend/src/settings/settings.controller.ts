import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CurrencyCode } from './settings.entity';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: number; email: string };
}

@UseGuards(AuthGuard('jwt'))
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // GET /settings — повертає поточні налаштування користувача
  @Get()
  getSettings(@Req() req: RequestWithUser) {
    return this.settingsService.getSettings(req.user.userId);
  }

  // PATCH /settings/currency — { currency: 'USD' }
  @Patch('currency')
  updateCurrency(
    @Req() req: RequestWithUser,
    @Body('currency') currency: string, // Використовуємо string у декораторі, щоб уникнути помилки TS1272
  ) {
    return this.settingsService.updateCurrency(
      req.user.userId,
      currency as CurrencyCode,
    );
  }

  // POST /settings/refresh-rate — оновити курс вручну
  @Post('refresh-rate')
  refreshRate(@Req() req: RequestWithUser) {
    return this.settingsService.refreshRate(req.user.userId);
  }
}
