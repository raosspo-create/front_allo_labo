export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
};

export type RegisterField = keyof RegisterFormValues;

export type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

export const MIN_REGISTRATION_AGE_YEARS = 18;

const NAME_RE = /^[\p{L}\s'.-]{2,80}$/u;
const PHONE_RE = /^[+]?[\d\s().-]{8,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseBirthDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function validateRegisterField(
  field: RegisterField,
  values: RegisterFormValues,
): string | null {
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();

  switch (field) {
    case 'firstName':
      if (!firstName) return 'Le prénom est obligatoire.';
      if (!NAME_RE.test(firstName)) {
        return 'Prénom invalide (2 à 80 caractères, lettres uniquement).';
      }
      return null;
    case 'lastName':
      if (!lastName) return 'Le nom est obligatoire.';
      if (!NAME_RE.test(lastName)) {
        return 'Nom invalide (2 à 80 caractères, lettres uniquement).';
      }
      return null;
    case 'email':
      if (!email) return 'L’e-mail est obligatoire.';
      if (!EMAIL_RE.test(email)) return 'Adresse e-mail invalide.';
      return null;
    case 'phone':
      if (!phone) return 'Le téléphone est obligatoire.';
      if (!PHONE_RE.test(phone)) {
        return 'Numéro invalide (8 à 24 chiffres, + autorisé).';
      }
      return null;
    case 'dateOfBirth': {
      if (!values.dateOfBirth) return 'La date de naissance est obligatoire.';
      const birth = parseBirthDate(values.dateOfBirth);
      if (!birth) return 'Date de naissance invalide.';
      const today = new Date();
      today.setUTCHours(12, 0, 0, 0);
      if (birth > today) return 'La date ne peut pas être dans le futur.';
      const minAdult = new Date(today);
      minAdult.setUTCFullYear(minAdult.getUTCFullYear() - MIN_REGISTRATION_AGE_YEARS);
      if (birth > minAdult) {
        return 'L’inscription est réservée aux personnes majeures (18 ans et plus).';
      }
      const maxAge = new Date(today);
      maxAge.setUTCFullYear(maxAge.getUTCFullYear() - 120);
      if (birth < maxAge) return 'Date de naissance trop ancienne.';
      return null;
    }
    case 'password':
      if (!values.password) return 'Le mot de passe est obligatoire.';
      if (values.password.length < 8) {
        return 'Minimum 8 caractères.';
      }
      return null;
    case 'confirmPassword':
      if (!values.confirmPassword) return 'Confirmez le mot de passe.';
      if (values.confirmPassword !== values.password) {
        return 'Les mots de passe ne correspondent pas.';
      }
      return null;
    default:
      return null;
  }
}

export function validateRegisterForm(
  values: RegisterFormValues,
): RegisterFieldErrors {
  const fields: RegisterField[] = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'dateOfBirth',
    'password',
    'confirmPassword',
  ];
  const errors: RegisterFieldErrors = {};
  for (const field of fields) {
    const message = validateRegisterField(field, values);
    if (message) errors[field] = message;
  }
  return errors;
}

/** Date la plus récente autorisée (dernier jour possible pour avoir 18 ans). */
export function maxBirthDateForRegistration(): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCFullYear(d.getUTCFullYear() - MIN_REGISTRATION_AGE_YEARS);
  return d.toISOString().slice(0, 10);
}
