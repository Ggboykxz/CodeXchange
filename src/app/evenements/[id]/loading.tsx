import { SqueletteBarre, SqueletteDetail } from "@/components/skeleton";

export default function Chargement() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-10">
      <SqueletteBarre className="h-4 w-24 rounded-md" />
      <SqueletteBarre className="h-8 w-2/3 rounded-md" />
      <SqueletteDetail />
      <div className="flex flex-col gap-3">
        <SqueletteBarre className="h-20 rounded-xl border border-cx-border bg-cx-card" />
        <SqueletteBarre className="h-20 rounded-xl border border-cx-border bg-cx-card" />
      </div>
    </div>
  );
}
