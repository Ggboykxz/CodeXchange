import { SqueletteBarre, SqueletteListe } from "@/components/skeleton";

export default function Chargement() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <SqueletteBarre className="h-8 w-48 rounded-md" />
      <SqueletteBarre className="h-3 w-72 rounded-md" />
      <SqueletteListe nombre={6} />
    </div>
  );
}
