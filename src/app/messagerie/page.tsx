import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { listThreads, listMessages } from "@/lib/messagerie";
import FormulaireMessage from "./formulaire-message";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messagerie" };

type Props = { searchParams: Promise<{ with?: string }> };

export default async function PageMessagerie({ searchParams }: Props) {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  const params = await searchParams;
  const withId = params.with ? Number(params.with) : null;

  const threads = await listThreads(userId);
  const conversation = withId && Number.isInteger(withId) ? await listMessages(userId, withId) : [];

  const courant = threads.find((t) => t.autreId === withId);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Messagerie</h1>
        <p className="mt-1 text-sm text-cx-muted-fg">
          Vos conversations privées avec les membres de la communauté.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-cx-border bg-cx-card p-2">
          {threads.length === 0 ? (
            <p className="px-3 py-4 text-sm text-cx-muted-fg">
              Aucune conversation. Démarrez-en une depuis un profil.
            </p>
          ) : (
            <ul className="flex flex-col">
              {threads.map((t) => (
                <li key={t.autreId}>
                  <Link
                    href={`/messagerie?with=${t.autreId}`}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      withId === t.autreId ? "bg-cx-primary/10 text-cx-primary" : "hover:bg-cx-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t.autreNom}</span>
                      {t.nonLus > 0 ? (
                        <span className="rounded-full bg-cx-primary px-2 text-[10px] font-bold text-cx-primary-fg">
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
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: "460px" }}>
                {conversation.length === 0 ? (
                  <p className="text-sm text-cx-muted-fg">Aucun message pour le moment.</p>
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
                          <div className="mt-1 text-[10px] opacity-70 text-right">
                            {m.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <footer className="border-t border-cx-border p-3">
                <FormulaireMessage destinataireId={withId} onEnvoye={() => {}} />
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-10 text-sm text-cx-muted-fg">
              Sélectionne une conversation à gauche, ou réponds à un membre depuis son profil.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
