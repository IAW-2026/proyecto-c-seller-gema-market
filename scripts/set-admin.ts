// Asigna (o quita) el rol `seller_admin` a un usuario de Clerk por email.
//
// El rol vive en `publicMetadata.role` de Clerk — no en la DB. Como Clerk es un
// servicio externo, el rol no se puede sembrar desde Prisma; este script lo
// setea vía la Backend API.
//
// Uso:
//   npx tsx scripts/set-admin.ts <email>            → marca como seller_admin
//   npx tsx scripts/set-admin.ts <email> --revoke   → vuelve a seller
//
// Requiere CLERK_SECRET_KEY en .env. El usuario ya debe existir en Clerk
// (registrate primero con ese email en /sign-up).

import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';

async function main() {
  const email = process.argv[2];
  const revoke = process.argv.includes('--revoke');
  if (!email) {
    console.error('Uso: npx tsx scripts/set-admin.ts <email> [--revoke]');
    process.exit(1);
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('Falta CLERK_SECRET_KEY en .env.');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  const { data: users } = await clerk.users.getUserList({ emailAddress: [email] });
  const user = users[0];
  if (!user) {
    console.error(`No se encontró ningún usuario de Clerk con email ${email}.`);
    console.error('Registrate primero con ese email en /sign-up y volvé a correr esto.');
    process.exit(1);
  }

  const role = revoke ? 'seller' : 'seller_admin';
  await clerk.users.updateUserMetadata(user.id, {
    publicMetadata: { ...user.publicMetadata, role },
  });

  console.log(`✔ ${email} → role: "${role}"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
