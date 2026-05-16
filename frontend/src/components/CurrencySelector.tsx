// src/components/CurrencySelector.tsx
// Компонент вибору валюти — встав у Sidebar або Header

import React, { useState } from "react";
import { useCurrency } from "../context/CurrencyContext";

type CurrencyCode = "UAH" | "USD" | "EUR";

const CURRENCIES: { code: CurrencyCode; label: string; flag: string }[] = [
  { code: "UAH", label: "Гривня", flag: "🇺🇦" },
  { code: "USD", label: "Долар", flag: "🇺🇸" },
  { code: "EUR", label: "Євро", flag: "🇪🇺" },
];

export const CurrencySelector: React.FC = () => {
  const { currency, exchangeRate, setCurrency, refreshRate, isLoading } =
    useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const current = CURRENCIES.find((c) => c.code === currency)!;

  const handleSelect = async (code: CurrencyCode) => {
    setIsOpen(false);
    if (code !== currency) {
      await setCurrency(code);
    }
  };

  return (
    <div className="relative">
      {/* Кнопка відкриття */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
      >
        <span>{current.flag}</span>
        <span>{current.code}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Дропдаун */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          {/* Поточний курс */}
          {currency !== "UAH" && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-500">Курс НБУ</p>
              <p className="text-sm font-semibold text-gray-700">
                1 ₴ = {Number(exchangeRate).toFixed(4)} {currency}
              </p>
              <button
                onClick={async () => {
                  setIsOpen(false);
                  await refreshRate();
                }}
                className="text-xs text-green-600 hover:underline mt-0.5"
              >
                Оновити курс
              </button>
            </div>
          )}

          {/* Список валют */}
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleSelect(c.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                c.code === currency
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700"
              }`}
            >
              <span className="text-lg">{c.flag}</span>
              <div className="text-left">
                <p className="font-medium">{c.code}</p>
                <p className="text-xs text-gray-400">{c.label}</p>
              </div>
              {c.code === currency && (
                <svg
                  className="w-4 h-4 ml-auto text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
