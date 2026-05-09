-- Agrega `trackingCode` a Sale.
-- Lo devuelve la Shipping App cuando el seller dispara el envío (paid → shipping).
-- Null mientras la venta está en `paid`.
ALTER TABLE "Sale" ADD COLUMN "trackingCode" TEXT;
