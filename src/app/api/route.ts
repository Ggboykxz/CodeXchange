import { json } from "@/lib/api";

export async function GET() {
  return json({ message: "Hello, world!" });
}