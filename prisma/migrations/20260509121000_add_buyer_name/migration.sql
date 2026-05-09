-- Agrega `buyerName` a Sale y Reserva.
-- Buyer App va a enviar el nombre junto con el id al crear la reserva, y
-- la venta lo persiste para que toda info del comprador (nombre + total
-- de compras) se compute desde la propia BD del Seller App.
--
-- Backfill: para filas existentes (dev) usamos buyerId como placeholder.
-- En prod no hay datos previos, así que el UPDATE es no-op.

ALTER TABLE "Sale" ADD COLUMN "buyerName" TEXT;
UPDATE "Sale" SET "buyerName" = "buyerId" WHERE "buyerName" IS NULL;
ALTER TABLE "Sale" ALTER COLUMN "buyerName" SET NOT NULL;

ALTER TABLE "Reserva" ADD COLUMN "buyerName" TEXT;
UPDATE "Reserva" SET "buyerName" = "buyerId" WHERE "buyerName" IS NULL;
ALTER TABLE "Reserva" ALTER COLUMN "buyerName" SET NOT NULL;
