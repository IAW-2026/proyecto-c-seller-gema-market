-- Onboarding refactor:
--   1. `fullName` se elimina del Seller — el nombre real vive en Clerk y se
--      lee con `currentUser()` cuando hace falta.
--   2. `clerkUserId` pasa a NOT NULL: a partir de ahora todo Seller proviene
--      de un usuario de Clerk (auto-provision en `getCurrentSeller`).
--
-- Limpieza previa: borramos cualquier Seller huérfano (sin `clerkUserId`).
-- Las FKs hacia Product/Sale/Reserva ya tienen `ON DELETE CASCADE`, así que
-- los hijos se eliminan en la misma transacción.
DELETE FROM "Seller" WHERE "clerkUserId" IS NULL;

ALTER TABLE "Seller" DROP COLUMN "fullName";
ALTER TABLE "Seller" ALTER COLUMN "clerkUserId" SET NOT NULL;
