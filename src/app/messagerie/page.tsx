import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { listThreads, listMessages } from "@/lib/messagerie";
import FormulaireMessage from "./formulaire-message";
import DefileurMessages from "./defileur-messages";
import { localeCourante, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messagerie" };

type Props = { searchParams: Promise<{ with?: string }> };

export default async function PageMessagerie({ searchParams }: Props) {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  const params = await searchParams;
  const withId = params.with ? Number(params.with) : null;

  const [threads, locale] = await Promise.all([listThreads(userId), localeCourante()]);
  const conversation = withId && Number.isInteger(withId) ? await listMessages(userId, withId) : [];

  const courant = threads.find((t) => t.autreId === withId);

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight">{t(locale, "messaging.title")}</h1>
        <p className="mt-1 text-sm text-cx-muted-fg">
{t(locale, "messaging.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-cx-border bg-cx-card p-2">
          {threads.length === 0 ? (
            <p className="px-3 py-4 text-sm text-cx-muted-fg">
              {t(locale, "messaging.empty_conversations")}
            </p>
          ) : (
            <ul className="flex flex-col">
              {threads.map((t) => (
                <li key={t.autreId}>
                  <Link
                    href={`/messagerie?with=${t.autreId}`}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      withId === t.autreId ? "bg-cx-primary/5 text-cx-primary" : "hover:bg-cx-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t.autreNom}</span>
                      {t.nonLus > 0 ? (
                        <span className="rounded-full bg-cx-primary px-2 text-[11px] font-bold text-cx-primary-fg">
                          {t.nonLus}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-cx-muted-fg">{t.dernierCorps}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex flex-col rounded-xl border border-cx-border bg-cx-card">
          {withId ? (
            <>
              <header className="border-b border-cx-border px-4 py-3">
                <h2 className="font-semibold">{courant?.autreNom ?? "Conversation"}</h2>
              </header>
              <DefileurMessages>
                {conversation.length === 0 ? (
                  <p className="text-sm text-cx-muted-fg">{t(locale, "messaging.no_messages")}</p>
                ) : (
                  conversation.map((m) => {
                    const estLeMien = m.senderId === userId;
                    return (
                      <div key={m.id} className={`flex ${estLeMien ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            estLeMien ? "bg-cx-primary text-cx-primary-fg" : "bg-cx-muted text-cx-fg"
                          }`}
                        >
                          {m.corps}
                          <div className="mt-1 text-right text-xs opacity-90">
                            {m.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
    </DefileurMessages>
              <footer className="border-t border-cx-border p-3">
                <FormulaireMessage destinataireId={withId} onEnvoye={() => {}} />
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-10 text-sm text-cx-muted-fg">
              {t(locale, "messaging.select")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
