import 'server-only';
import type { User } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { newId, PREFIXES } from '@/lib/ids';
import {
  parseShopFieldsFromMetadata,
  validateShopFields,
  type ShopFields,
} from '@/lib/auth/shop-fields';
import type { Seller } from '@/types/domain';

// Identidad mínima de un usuario de Clerk, normalizada para que el data layer
// no dependa de la forma camelCase del helper `currentUser()`.
//
// `shopFields` es opcional: viene del `unsafeMetadata` que el form de sign-up
// adjunta a la cuenta. Si está presente y pasa validación, se usa para
// inicializar el `Seller` la primera vez. En el path de update no se toca —
// el panel es la fuente de verdad para esos campos una vez que existen.
export type SellerIdentity = {
  clerkUserId: string;
  email: string;
  phone: string;
  shopFields?: ShopFields;
};

// Normaliza el `User` que devuelve `currentUser()` (camelCase). Lee el
// `unsafeMetadata` para arrastrar los datos de tienda que el form de
// sign-up dejó ahí.
export function identityFromCurrentUser(user: User): SellerIdentity {
  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    '';
  const phoneFromClerk =
    user.phoneNumbers.find((p) => p.id === user.primaryPhoneNumberId)?.phoneNumber ??
    user.phoneNumbers[0]?.phoneNumber ??
    '';

  const shopFields = parseShopFieldsFromMetadata(user.unsafeMetadata);
  const phone = phoneFromClerk || shopFields.phone || '';

  return { clerkUserId: user.id, email, phone, shopFields };
}

// Upsert idempotente del Seller. Usado por `getCurrentSeller()` para
// auto-provisionar en la primera request autenticada que llega a una ruta
// protegida de esta app.
//
// Si `shopFields` viene del sign-up y pasa validación, se usa en el `create`
// para que el seller entre directo al panel sin pasar por `/onboarding`.
// Si no, los campos quedan vacíos y el gate de onboarding actúa.
export async function upsertSellerFromIdentity(identity: SellerIdentity): Promise<Seller> {
  const { clerkUserId, email, phone, shopFields } = identity;
  const validShopFields =
    shopFields && Object.keys(validateShopFields(shopFields)).length === 0
      ? shopFields
      : undefined;

  return prisma.seller.upsert({
    where: { clerkUserId },
    update: {
      email,
      ...(phone ? { phone } : {}),
    },
    create: {
      id: newId(PREFIXES.seller),
      clerkUserId,
      email,
      phone,
      shopName: validShopFields?.shopName ?? '',
      city: validShopFields?.city ?? '',
      street: validShopFields?.street ?? '',
      number: validShopFields?.number ?? '',
      postalCode: validShopFields?.postalCode ?? '',
      apartment: validShopFields?.apartment || null,
    },
  });
}
