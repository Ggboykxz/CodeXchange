export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-black tracking-tight">CodeXchange</h1>
      <p className="text-lg text-[var(--cx-muted)]">
        La plateforme africaine des développeurs — par les devs, pour les devs.
      </p>
      <p className="text-sm text-[var(--cx-muted)]">Chantier en cours · démo le 25 octobre.</p>
    </main>
  );
}
