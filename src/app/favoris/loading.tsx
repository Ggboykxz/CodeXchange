import { SqueletteListe } from "@/components/skeleton";

export default function Chargement() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="h-8 w-32 animate-pulse rounded-md bg-cx-muted" />
      <SqueletteListe nombre={4} />
    </main>
  );
}
