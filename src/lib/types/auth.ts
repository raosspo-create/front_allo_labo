import type { OrderPermissions } from '@/lib/order-permissions';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth?: string | null;
  role: string;
  active: boolean;
  createdAt: string;
  orderPermissions?: OrderPermissions;
};

export const ROLE_SUPER_ADMIN = 'super_admin' as const;
export const ROLE_OPERATEUR = 'operateur' as const;

export const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  technicien: 'Technicien',
  coursier: 'Coursier',
  operateur: 'Opérateur',
  super_admin: 'Super administrateur',
};

export function isSuperAdmin(role: string | undefined): boolean {
  return role === ROLE_SUPER_ADMIN;
}

/** super_admin + operateur : accès gestion (commandes, référentiels, stats…). */
export function isStaffAdmin(role: string | undefined): boolean {
  return role === ROLE_SUPER_ADMIN || role === ROLE_OPERATEUR;
}

/** Création / modification des comptes utilisateurs. */
export function canManageUserAccounts(role: string | undefined): boolean {
  return isSuperAdmin(role);
}
