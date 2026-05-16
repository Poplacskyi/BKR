// src/context/CurrencyContext.tsx
// Глобальний контекст валюти — підключи в App.tsx один раз,
// використовуй useCurrency() в будь-якому компоненті

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import api from '../api/axios';

type CurrencyCode = 'UAH' | 'USD' | 'EUR';

interface CurrencySettings {
  currency: CurrencyCode;
  exchangeRate: number;
  updatedAt: string;
}

interface CurrencyContextValue {
  currency: CurrencyCode;
  exchangeRate: number;
  symbol: string;
  // Головна функція — форматує суму в гривнях у поточну валюту
  format: (amountInUah: number) => string;
  // Конвертує суму без форматування (для розрахунків)
  convert: (amountInUah: number) => number;
  // Змінити валюту
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  // Оновити курс з НБУ вручну
  refreshRate: () => Promise<void>;
  isLoading: boolean;
}

const SYMBOLS: Record<CurrencyCode, string> = {
  UAH: '₴',
  USD: '$',
  EUR: '€',
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<CurrencySettings>({
    currency: 'UAH',
    exchangeRate: 1.0,
    updatedAt: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Завантажуємо налаштування при старті
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get<CurrencySettings>('/settings');
      setSettings(data);
    } catch (err) {
      console.error('Не вдалось завантажити налаштування валюти:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Змінити валюту — бекенд сам підтягне курс з НБУ
  const setCurrency = useCallback(async (currency: CurrencyCode) => {
    setIsLoading(true);
    try {
      const { data } = await api.patch<CurrencySettings>('/settings/currency', {
        currency,
      });
      setSettings(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Оновити курс вручну
  const refreshRate = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.post<CurrencySettings>('/settings/refresh-rate');
      setSettings(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Конвертація суми з UAH у поточну валюту
  const convert = useCallback(
    (amountInUah: number) => {
      return amountInUah * settings.exchangeRate;
    },
    [settings.exchangeRate],
  );

  // Форматування з символом і округленням
  const format = useCallback(
    (amountInUah: number) => {
      const converted = convert(amountInUah);
      const symbol = SYMBOLS[settings.currency];
      return `${symbol}${converted.toLocaleString('uk-UA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [convert, settings.currency],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency: settings.currency,
        exchangeRate: settings.exchangeRate,
        symbol: SYMBOLS[settings.currency],
        format,
        convert,
        setCurrency,
        refreshRate,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

// Хук для використання в компонентах
export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency має використовуватись всередині CurrencyProvider');
  }
  return ctx;
};
