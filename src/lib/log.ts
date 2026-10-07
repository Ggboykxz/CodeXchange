/**
 * Journalisation structurée (J8).
 *
 * Jusqu'ici chaque handler gérait ses erreurs avec un `console.error("... :", msg)`,
 * illisible en production et intracable. On centralise par un seul format
 * JSON (une ligne par événement, fields `ts/level/message/` plus contexte),
 * prêt à être ramassé par Vercel Logs / Grafana.
 *
 * En développement on simplifie pour rester lisible ; en production, chaque
 * ligne est un objet JSON autonome.
 */

export type LogLevel = "info" | "warn" | "error";

/** Sérialisation de l'événement — exportée pour être testable en node. */
export function buildLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): string {
  const entry = { level, message, ts: new Date().toISOString(), ...context };
  return JSON.stringify(entry);
}

/** Ligne unique, prête pour le stdout/stderr du process. */
export function formatLogLine(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): string {
  if (process.env.NODE_ENV === "production") {
    return buildLogEntry(level, message, context);
  }
  const ctx = context ? ` ${JSON.stringify(context)}` : "";
  return `[${level}] ${message}${ctx}`;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const line = formatLogLine(level, message, context);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
  /** Enroule le pattern `console.error("X error:", msg)` des handlers de routes. */
  route: (label: string, err: unknown, extra?: Record<string, unknown>) =>
    emit("error", label, {
      error: err instanceof Error ? err.message : String(err),
      ...extra,
    }),
};
