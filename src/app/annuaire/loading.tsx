import { SqueletteGrille } from "@/components/skeleton";

export default function Chargement() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="h-8 w-36 animate-pulse rounded-md bg-cx-muted" />
      <SqueletteGrille />
    </main>
  );
}
