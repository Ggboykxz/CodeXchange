import { SqueletteDetail } from "@/components/skeleton";

export default function Chargement() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="h-4 w-24 animate-pulse rounded-md bg-cx-muted" />
      <div className="h-8 w-2/3 animate-pulse rounded-md bg-cx-muted" />
      <SqueletteDetail />
      <div className="flex flex-col gap-3">
        <div className="h-20 animate-pulse rounded-xl border border-cx-border bg-cx-card" />
        <div className="h-20 animate-pulse rounded-xl border border-cx-border bg-cx-card" />
      </div>
    </div>
  );
}
