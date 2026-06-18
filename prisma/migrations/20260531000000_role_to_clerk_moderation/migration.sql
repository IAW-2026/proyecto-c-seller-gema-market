-- El rol del usuario se modela ahora en Clerk (`publicMetadata.role`), no en la
-- DB. Se elimina la columna y el enum asociado.

-- AlterTable
ALTER TABLE "Seller" DROP COLUMN "role";

-- DropEnum
DROP TYPE "SellerRole";

-- Moderación del admin: suspensión de tiendas y ocultamiento de productos.

-- AlterTable
ALTER TABLE "Seller" ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "hiddenByAdmin" BOOLEAN NOT NULL DEFAULT false;
