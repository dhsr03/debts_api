# 🧾 Debts API

## 📌 Descripción

Este proyecto corresponde a la **prueba técnica backend** para **Double V Partners NYX**.  
Consiste en una **API REST** para la gestión de deudas entre usuarios, permitiendo registrar, consultar, actualizar, pagar y exportar deudas, con autenticación, persistencia en PostgreSQL y una **capa de caché usando Redis**.

El desarrollo prioriza:
- Separación de responsabilidades
- Reglas de negocio claras
- Uso correcto de caché
- Código mantenible y testeable

## 🛠️ Tecnologías utilizadas

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Redis
- TypeORM
- JWT (cookies HTTP-only)
- Jest
- Docker

## 📂 Estructura del proyecto

src/
├── auth
├── users
├── debts
├── cache
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts

## ⚙️ Configuración

Crear archivo `.env`:

PORT=4500
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=debts_db

JWT_SECRET=super_secret_key
JWT_EXPIRES_IN=1d

CACHE_DRIVER=redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL_SECONDS=120

## ▶️ Ejecución

npm install  
npm run start:dev

## 🧪 Tests

npm run test

## 👤 Autor

Daniel Humberto Soto Rincón
dhsr03@gmail.com
3204236748
