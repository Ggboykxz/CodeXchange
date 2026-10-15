import { SqueletteLignes } from "@/components/skeleton";

export default function Chargement() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-10">
      <SqueletteLignes nombre={5} />
    </div>
  );
}
