import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(cookieParser());

  app.use((req, res, next) => {
    if (req.url === '/favicon.ico') return res.status(204).end();
    next();
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
  }));

  const configService = app.get(ConfigService);
  app.enableCors({
    origin: [
      configService.get<string>('FRONTEND_URL'),
    ],
    credentials: true,
  });

  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
}
bootstrap();