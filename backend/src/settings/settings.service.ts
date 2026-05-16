import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings, CurrencyCode } from './settings.entity';

// Відповідь НБУ API
interface NbuRate {
  r030: number;
  txt: string;
  rate: number;
  cc: string;       // 'USD', 'EUR' тощо
  exchangedate: string;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepo: Repository<Settings>,
  ) {}

  // ─── Отримати або створити налаштування користувача ────────────────────────
  async getSettings(userId: number): Promise<Settings> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });

    if (!settings) {
      // Перший вхід — створюємо дефолтні налаштування (UAH)
      settings = this.settingsRepo.create({
        userId,
        currency: 'UAH',
        exchangeRate: 1.0,
      });
      await this.settingsRepo.save(settings);
    }

    return settings;
  }

  // ─── Змінити валюту ────────────────────────────────────────────────────────
  async updateCurrency(
    userId: number,
    currency: CurrencyCode,
  ): Promise<Settings> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });

    if (!settings) {
      settings = this.settingsRepo.create({ userId });
    }

    settings.currency = currency;

    if (currency === 'UAH') {
      // Гривня — курс завжди 1
      settings.exchangeRate = 1.0;
    } else {
      // Тягнемо актуальний курс з НБУ
      settings.exchangeRate = await this.fetchRateFromNbu(currency);
    }

    return this.settingsRepo.save(settings);
  }

  // ─── Оновити курс для поточної валюти (викликати вручну або за розкладом) ──
  async refreshRate(userId: number): Promise<Settings> {
    const settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) throw new NotFoundException('Налаштування не знайдено');

    if (settings.currency !== 'UAH') {
      settings.exchangeRate = await this.fetchRateFromNbu(settings.currency);
      await this.settingsRepo.save(settings);
    }

    return settings;
  }

  // ─── Запит до НБУ ──────────────────────────────────────────────────────────
  private async fetchRateFromNbu(currency: CurrencyCode): Promise<number> {
    try {
      const url = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`НБУ API повернув ${response.status}`);
      }

      const rates: NbuRate[] = await response.json();
      const found = rates.find((r) => r.cc === currency);

      if (!found) {
        throw new Error(`Валюта ${currency} не знайдена в НБУ`);
      }

      // НБУ повертає курс: скільки гривень за 1 одиницю валюти
      // Нам потрібно: скільки одиниць валюти за 1 гривню
      // Тобто: rate = 1 / nbuRate
      return Number((1 / found.rate).toFixed(6));
    } catch (error) {
      console.error('Помилка отримання курсу НБУ:', error);
      // Якщо НБУ недоступний — повертаємо резервні значення
      const fallback: Record<string, number> = {
        USD: 1 / 41.5,
        EUR: 1 / 44.8,
      };
      return fallback[currency] ?? 1.0;
    }
  }
}
