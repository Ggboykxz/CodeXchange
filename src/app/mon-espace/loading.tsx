import { SqueletteListe } from "@/components/skeleton";

export default function Chargement() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="h-10 w-56 animate-pulse rounded-md bg-cx-muted" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-cx-muted" />
      <SqueletteListe nombre={4} />
    </div>
  );
}
