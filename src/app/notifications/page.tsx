import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { getSessionUserId } from "@/lib/session";
import { listNotifications, unreadCount } from "@/lib/notifications";
import { localeCourante, t } from "@/lib/i18n";
import FiltresNotifications, { type FiltreNotif } from "./filtres";

export const dynamic = "force-dynamic";

export const metadata = { title: "Notifications" };

/** /notifications — centre de notifications de l'utilisateur connecté. */
export default async function PageNotifications({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  const params = await searchParams;
  const filtreDemande = params.filtre;
  const filtre: FiltreNotif =
    filtreDemande === "non-lues" || filtreDemande === "lues" ? filtreDemande : "toutes";

  const [notifications, nonLues, locale] = await Promise.all([
    listNotifications(userId, {
      limit: 50,
      unreadOnly: filtre === "non-lues" ? true : undefined,
    }),
    unreadCount(userId),
    localeCourante(),
  ]);

  // Regroupement par période (jour / semaine / plus ancien).
  const maintenant = new Date();
  const uneJournee = 86_400_000;
  const groupements: Array<{ cle: string; titre: string; items: typeof notifications }> = [
    { cle: "today", titre: t(locale, "notifications.group_today"), items: [] },
    { cle: "week", titre: t(locale, "notifications.group_week"), items: [] },
    { cle: "older", titre: t(locale, "notifications.group_older"), items: [] },
  ];
  for (const notification of notifications) {
    const age = maintenant.getTime() - new Date(notification.createdAt).getTime();
    if (age < uneJournee) groupements[0].items.push(notification);
    else if (age < 7 * uneJournee) groupements[1].items.push(notification);
    else groupements[2].items.push(notification);
  }
  const visibles = groupements.filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "notifications.title")}</h1>
          <p className="mt-1 text-sm text-cx-muted-fg">
            {nonLues === 1
              ? t(locale, "notifications.unread_one")
              : `${nonLues} ${t(locale, "notifications.unread_many")}`}
          </p>
        </div>
        {notifications.length > 0 ? (
          <form action="/api/notifications/tout-lire" method="post">
            <button
              type="submit"
              className="rounded-lg border border-cx-border px-3 py-2 text-sm font-medium text-cx-muted-fg hover:bg-cx-muted hover:text-cx-fg"
            >
              {t(locale, "notifications.mark_all")}
            </button>
          </form>
        ) : null}
      </header>

      <FiltresNotifications actif={filtre} />

      {visibles.length === 0 ? (
        <EmptyState
          titre={t(locale, "notifications.empty_title")}
          description={t(locale, "notifications.empty_desc")}
          cta={t(locale, "nav.forum")}
          href="/forum"
        />
      ) : (
        <div className="flex flex-col gap-6">
          {visibles.map((groupe) => (
            <section key={groupe.cle}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cx-muted-fg">
                {groupe.titre}
              </h2>
              <ul className="flex flex-col gap-3">
                {groupe.items.map((notification) => (
                  <li
                    key={notification.id}
                    className={`rounded-xl border px-5 py-4 shadow-sm transition ${
                      notification.isRead
                        ? "border-cx-border bg-cx-card"
                        : "border-cx-primary/40 bg-cx-primary/5"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cx-card-fg">{notification.text}</p>
                        <p className="mt-1 text-xs text-cx-muted-fg">
                          {new Date(notification.createdAt).toLocaleDateString(
                            locale === "en" ? "en-GB" : "fr-FR",
                            { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {notification.lien ? (
                          <Link
                            href={notification.lien}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-cx-primary hover:bg-cx-muted"
                          >
                            {t(locale, "notifications.see")}
                          </Link>
                        ) : null}
                        {!notification.isRead ? (
                          <form action={`/api/notifications/${notification.id}/lu`} method="post">
                            <button
                              type="submit"
                              className="rounded-lg px-2 py-1 text-xs font-medium text-cx-muted-fg hover:bg-cx-muted"
                            >
                              {t(locale, "notifications.mark_read")}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
