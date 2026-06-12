export const ORDER_PERMISSION_KEYS = [
  'changeStatus',
  'validateOrder',
  'manageFrais',
  'manageCommission',
  'assignAgent',
  'manageCentres',
  'markPaid',
  'cancelOrder',
] as const;

export type OrderPermissionKey = (typeof ORDER_PERMISSION_KEYS)[number];
export type OrderPermissions = Record<OrderPermissionKey, boolean>;

export const DEFAULT_ORDER_PERMISSIONS: OrderPermissions = {
  changeStatus: true,
  validateOrder: false,
  manageFrais: false,
  manageCommission: false,
  assignAgent: false,
  manageCentres: false,
  markPaid: false,
  cancelOrder: false,
};

export const ADMIN_ORDER_PERMISSIONS: OrderPermissions = Object.fromEntries(
  ORDER_PERMISSION_KEYS.map((k) => [k, true]),
) as OrderPermissions;

export const ORDER_PERMISSION_LABELS: Record<
  OrderPermissionKey,
  { label: string; hint: string }
> = {
  changeStatus: {
    label: 'Changer le statut',
    hint: 'Programmé, en cours, effectué…',
  },
  validateOrder: {
    label: 'Valider une commande',
    hint: 'Passer de « En attente » à « Prise en compte »',
  },
  manageFrais: {
    label: 'Gérer les frais supplémentaires',
    hint: 'Cocher et enregistrer les frais sur la commande',
  },
  manageCommission: {
    label: 'Modifier la commission',
    hint: 'Montant ou pourcentage partenaire (interne)',
  },
  assignAgent: {
    label: 'Affecter un agent',
    hint: 'Choisir un autre technicien ou coursier',
  },
  manageCentres: {
    label: 'Gérer les centres d’analyse',
    hint: 'Affecter les laboratoires par analyse',
  },
  markPaid: {
    label: 'Marquer comme payée',
    hint: 'Indiquer manuellement le paiement reçu',
  },
  cancelOrder: {
    label: 'Annuler la commande',
    hint: 'Passer le statut à « Annulé »',
  },
};

export function isFieldAgentRole(role: string | undefined): boolean {
  return role === 'technicien' || role === 'coursier';
}

export function mergeOrderPermissions(
  stored: Partial<OrderPermissions> | null | undefined,
): OrderPermissions {
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_ORDER_PERMISSIONS };
  }
  const merged = { ...DEFAULT_ORDER_PERMISSIONS };
  for (const key of ORDER_PERMISSION_KEYS) {
    if (typeof stored[key] === 'boolean') {
      merged[key] = stored[key] as boolean;
    }
  }
  return merged;
}

export function resolveOrderPermissionsForRole(
  role: string | undefined,
  stored: Partial<OrderPermissions> | null | undefined,
): OrderPermissions {
  if (role === 'super_admin' || role === 'operateur') {
    return { ...ADMIN_ORDER_PERMISSIONS };
  }
  if (!isFieldAgentRole(role)) {
    return { ...DEFAULT_ORDER_PERMISSIONS };
  }
  return mergeOrderPermissions(stored);
}

export function hasOrderGestionAccess(perms: OrderPermissions): boolean {
  return (
    perms.manageFrais ||
    perms.manageCommission ||
    perms.assignAgent ||
    perms.validateOrder
  );
}

export function canFieldAgentChangeStatus(
  perms: OrderPermissions,
  currentStatus: string,
  nextStatus: string,
): boolean {
  if (nextStatus === currentStatus) {
    return false;
  }
  if (nextStatus === 'annule') {
    return perms.cancelOrder;
  }
  if (currentStatus === 'en_attente' && nextStatus === 'prise_en_compte') {
    return perms.validateOrder;
  }
  return perms.changeStatus;
}

export function canInteractWithOrderStatus(perms: OrderPermissions): boolean {
  return (
    perms.changeStatus || perms.validateOrder || perms.cancelOrder
  );
}
