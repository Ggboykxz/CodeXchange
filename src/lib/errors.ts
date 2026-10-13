/**
 * Codes d'erreur partagés par toute la plateforme.
 *
 * Règle (spec) : la couche métier lève `AppError(code, status)` ; les route
 * handlers répondent `{ error: <code> }` avec le statut correspondant. Aucune
 * chaîne anglaise n'est exposée à l'écran : les pages traduisent le code.
 */
export type Code =
  | "AUTH_INVALID"
  | "AUTH_DUPLICATE_EMAIL"
  | "FORUM_VALIDATION"
  | "JOB_DUPLICATE_APPLICATION"
  | "MENTOR_SELF_REQUEST"
  | "MENTOR_DUPLICATE";

export type Status = 401 | 403 | 409 | 422;

export const STATUS_BY_CODE: Record<Code, Status> = {
  AUTH_INVALID: 401,
  AUTH_DUPLICATE_EMAIL: 409,
  FORUM_VALIDATION: 422,
  JOB_DUPLICATE_APPLICATION: 409,
  MENTOR_SELF_REQUEST: 403,
  MENTOR_DUPLICATE: 409,
};

/** Messages FR affichés à l'utilisateur (copy, pas des erreurs techniques). */
export const MESSAGE_FR: Record<Code, string> = {
  AUTH_INVALID: "E-mail ou mot de passe incorrect.",
  AUTH_DUPLICATE_EMAIL: "Un compte existe déjà avec cet e-mail.",
  FORUM_VALIDATION: "Le formulaire contient des champs invalides.",
  JOB_DUPLICATE_APPLICATION: "Vous avez déjà postulé à cette offre.",
  MENTOR_SELF_REQUEST: "Vous ne pouvez pas demander un mentorat à vous-même.",
  MENTOR_DUPLICATE: "Vous avez déjà envoyé une demande à ce mentor.",
};

export class AppError extends Error {
  readonly code: Code;
  readonly status: Status;

  constructor(code: Code, message?: string) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export type ApiErrorBody = { error: Code | "INTERNAL"; message: string };

/** Mapper une erreur inconnue vers la réponse HTTP standard des route handlers. */
export function errorResponse(error: unknown): { status: number; body: ApiErrorBody } {
  if (isAppError(error)) {
    return { status: error.status, body: { error: error.code, message: MESSAGE_FR[error.code] } };
  }
  return { status: 500, body: { error: "INTERNAL", message: "Une erreur interne est survenue." } };
}
