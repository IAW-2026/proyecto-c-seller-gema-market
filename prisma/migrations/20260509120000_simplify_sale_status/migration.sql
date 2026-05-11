-- Reduce el enum SaleStatus a los estados realmente usados por la app:
-- paid, shipping, delivered, shipping_failed.
-- Se eliminan: pending_payment, cancelled, disputed, refunded.
-- En esta app la venta nace post-aprobación de pago, no hay cancelación ni
-- reembolso desde el lado del seller, y no existe el concepto de disputa.

-- 1. Limpieza preventiva: descartar filas con estados ya no soportados.
--    En dev viene del seed; en prod no debería existir nada (no hay flujo
--    que produzca esos estados), pero el DELETE es idempotente.
DELETE FROM "Sale"
WHERE "status" IN ('pending_payment', 'cancelled', 'disputed', 'refunded');

-- 2. Sacar el default antes de cambiar el tipo de la columna.
ALTER TABLE "Sale" ALTER COLUMN "status" DROP DEFAULT;

-- 3. Renombrar el enum viejo y crear el nuevo.
ALTER TYPE "SaleStatus" RENAME TO "SaleStatus_old";
CREATE TYPE "SaleStatus" AS ENUM ('paid', 'shipping', 'delivered', 'shipping_failed');

-- 4. Migrar la columna al nuevo enum.
ALTER TABLE "Sale"
  ALTER COLUMN "status" TYPE "SaleStatus"
  USING ("status"::text::"SaleStatus");

-- 5. Nuevo default + drop del enum viejo.
ALTER TABLE "Sale" ALTER COLUMN "status" SET DEFAULT 'paid';
DROP TYPE "SaleStatus_old";
