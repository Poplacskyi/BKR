import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Обов'язково вмикаємо CORS, щоб ваш React-фронтенд міг робити запити сюди
  app.enableCors();

  // Railway передає свій порт через process.env.PORT.
  // '0.0.0.0' обов'язково для хмарних серверів (Docker/Railway)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on port: ${port}`);
}
bootstrap();
