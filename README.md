[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ADcDbJbt)

# Gema Market — Seller App

Aplicación del vendedor para [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/) — comisión `<!-- completar -->`.

Construida con **Next.js 16 · React 19 · TypeScript · Prisma 7 · PostgreSQL**.

---

## Setup local

### Requisitos

- Node.js 20+
- PostgreSQL 16

### Pasos

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Completar DATABASE_URL en .env

# 3. Crear el schema y correr migraciones
npm run db:migrate

# 4. Cargar datos de prueba
npm run db:seed

# 5. Iniciar servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

---

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run db:migrate` | Crea / actualiza el schema en la DB |
| `npm run db:seed` | Carga datos de prueba |
| `npm run db:studio` | Abre Prisma Studio |

---

Enunciado completo: <https://iaw-2026.github.io/proyecto/>
