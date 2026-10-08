import { NextResponse } from "next/server";
import { enabledProviders } from "@/lib/oauth";

/**
 * GET /api/oauth/providers — liste des boutons à afficher (B6).
 *
 * Source unique : la modale d'authentification interroge ce point au lieu
 * de deviner la configuration depuis des variables côté client. Un
 * fournisseur sans credentials n'apparaît jamais (plutôt qu'un bouton
 * qui échouerait au retour d'autorisation).
 */
export async function GET() {
  return NextResponse.json(
    { providers: enabledProviders(process.env) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
