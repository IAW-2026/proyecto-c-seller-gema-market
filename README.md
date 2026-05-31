[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ADcDbJbt)

# Gema Market — Seller App

Aplicación del vendedor para [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/) — comisión `<!-- completar -->`.

Construida con **Next.js 16 · React 19 · TypeScript · Prisma 7 · PostgreSQL**.

---

## 🔑 Usuarios de prueba

Dos cuentas listas para evaluar la app en `/sign-in`:

| Rol | Email | Contraseña |
|---|---|---|
| Vendedor (`seller`) | `seller_no_admin+clerk_test@unihousing.com` | `UnihousingSeller` |
| Administrador (`seller_admin`) | `seller_admin+clerk_test@unihousing.com` | `UnihousingAdmin` |

> **Código de verificación:** son emails de prueba de Clerk (sufijo `+clerk_test`), así
> que no se envía ningún correo real. Si en algún flujo se pide un código de
> verificación, usá el código fijo de test: **`424242`**.

Más detalle sobre roles y accesos en [Roles y acceso](#roles-y-acceso).

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

## Roles y acceso

La autenticación es con **Clerk**. El rol vive en `publicMetadata.role` del usuario
de Clerk (no en la base de datos) y puede ser:

| Rol | Acceso | Cómo se asigna |
|---|---|---|
| `seller` (por defecto) | Panel del vendedor (`/dashboard`, publicaciones, pedidos, stock, tienda). Es el rol de cualquier usuario nuevo. | Automático al registrarse en `/sign-up`. |
| `seller_admin` | Panel de administración (`/admin`): gestión de categorías, moderación de tiendas y productos, reporte global de ventas y métricas. | Manualmente, con el script de abajo. |

Tras el login, `/` redirige según el rol: `seller_admin` → `/admin`, `seller` → `/dashboard`.

### Crear un usuario admin

1. Registrate normalmente en `/sign-up` con el email que quieras hacer admin.
2. Asigná el rol (requiere `CLERK_SECRET_KEY` en `.env`):

```bash
npx tsx scripts/set-admin.ts tu-email@ejemplo.com
# Para revertir a seller:
npx tsx scripts/set-admin.ts tu-email@ejemplo.com --revoke
```

3. Cerrá y volvé a iniciar sesión: ahora entrás directo al panel `/admin`.

> El seed crea, además del seller principal, tres tiendas extra (una **suspendida**)
> y un producto **oculto por admin**, para que el panel de administración tenga datos
> que moderar desde el primer momento.

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
| `npm run test` | Tests (Vitest) |
| `npx tsx scripts/set-admin.ts <email>` | Asigna el rol `seller_admin` en Clerk |

---

Enunciado completo: <https://iaw-2026.github.io/proyecto/>
