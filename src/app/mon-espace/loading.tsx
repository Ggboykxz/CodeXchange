import { SqueletteBarre, SqueletteListe } from "@/components/skeleton";

export default function Chargement() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <SqueletteBarre className="h-10 w-56 rounded-md" />
      <SqueletteBarre className="h-10 w-full rounded-lg" />
      <SqueletteListe nombre={4} />
    </div>
  );
}
