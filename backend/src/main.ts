import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL is not defined in .env');
  }

  const allowedOrigins = frontendUrl
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Railway передає свій порт через process.env.PORT.
  // '0.0.0.0' обов'язково для хмарних серверів (Docker/Railway)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on port: ${port}`);
}
bootstrap();
