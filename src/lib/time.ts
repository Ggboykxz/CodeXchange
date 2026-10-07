/**
 * Temps relatif partagé (fil, notifications, détail d'une discussion).
 *
 * Les valeurs courtes (`3h`, `12j`) sont des abréviations neutres, sauf le
 * « il n'y a pas encore une minute » qui, lui, est une vraie phrase : on la
 * confie à `Intl.RelativeTimeFormat`, qui couvre fr, en… mais aussi sw et ar
 * sans qu'on ait rien à traduire.
 */
const instant = (locale: string) =>
  new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" }).format(
    0,
    "second"
  );

/** Format court façon Reddit : « maintenant », « 3m », « 5h », « 12j », puis la date. */
export function timeAgo(iso: string, locale: string = "fr"): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return instant(locale);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}j`;
  return new Date(iso).toLocaleDateString(locale);
}

/** Format long « il y a 3 h » / « 3 hr. ago » — utilisé dans les titres et les `aria`. */
export function timeAgoLong(iso: string, locale: string = "fr"): string {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return instant(locale);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  return date.toLocaleDateString(locale);
}
