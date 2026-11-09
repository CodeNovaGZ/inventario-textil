# Inventario Textil

Sistema de gestión de inventario textil con backend en Express, frontend en React + Vite y base de datos PostgreSQL en Docker.

## Tecnologías

- **Base de datos:** PostgreSQL 16 (Docker)
- **Backend:** Node.js + Express + `pg`
- **Frontend:** React + TypeScript + Vite + Tailwind CSS

## Requisitos

- [Docker](https://www.docker.com/) y Docker Compose
- [Node.js](https://nodejs.org/) 20 o superior

## Puesta en marcha

1. Clona el repositorio e instala las dependencias:

   ```bash
   git clone <url-del-repositorio>
   cd inventario-textil
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. Crea el archivo `.env` a partir del ejemplo y ajusta las credenciales:

   ```bash
   cp .env.example .env
   ```

   ```env
   DB_USER=postgres
   DB_PASSWORD=cambia_esto
   DB_NAME=inventario_textil
   DB_HOST=localhost
   DB_PORT=5432
   ```

3. Arranca todo con un solo comando:

   ```bash
   npm run dev
   ```

   Esto levanta la base de datos, espera a que esté lista y arranca backend y frontend en paralelo.

4. Abre la aplicación:

   - Frontend: <http://localhost:5173>
   - API: <http://localhost:3000/api/salud>

Para detener todo (incluida la base de datos), pulsa `Ctrl+C` en la terminal donde corre `npm run dev`.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta DB, backend y frontend. `Ctrl+C` detiene todo. |
| `npm run dev:db` | Solo levanta la base de datos. |
| `npm run dev:backend` | Solo arranca el backend. |
| `npm run dev:frontend` | Solo arranca el frontend. |
| `npm run dev:down` | Detiene la base de datos. |

## Estructura del proyecto

```
.
├── backend/            # API Express
├── db/                 # Scripts SQL de inicialización
├── frontend/           # Aplicación React + Vite
├── scripts/dev.mjs     # Orquestador cross-platform (DB + backend + frontend)
├── docker-compose.yml  # Servicio PostgreSQL
└── .env.example        # Variables de entorno de ejemplo
```

## Notas

- Los scripts SQL de `db/` se ejecutan solo la primera vez que se crea el volumen de PostgreSQL. Para reinicializar la base de datos (esto **borra** los datos): `docker compose down -v`.
- El archivo `.env` no se sube al repositorio. Usa `.env.example` como plantilla.
- El comando `npm run dev` funciona en Linux, macOS y Windows.
