import { SqueletteBarre, SqueletteGrille } from "@/components/skeleton";

export default function Chargement() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <SqueletteBarre className="h-8 w-28 rounded-md" />
      <SqueletteGrille nombre={4} />
    </div>
  );
}
