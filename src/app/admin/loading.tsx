import { SqueletteStats, SqueletteListe } from "@/components/skeleton";

export default function Chargement() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="h-8 w-40 animate-pulse rounded-md bg-cx-muted" />
      <SqueletteStats />
      <SqueletteListe nombre={3} />
    </div>
  );
}
