// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Оновлене налаштування CORS
  app.enableCors({
    // Додаємо і localhost, і 127.0.0.1, оскільки Vite часто використовує саме IP
    // Або ви можете просто написати origin: true,
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
