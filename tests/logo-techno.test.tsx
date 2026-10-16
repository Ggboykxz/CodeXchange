import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LogoTechno, { logoTechno } from "@/components/logo-techno";

describe("LogoTechno", () => {
  it("expose le logo des technologies connues", () => {
    const html = renderToStaticMarkup(<LogoTechno nom="Flutter" className="size-3.5" />);
    expect(html).toContain("<svg");
    expect(html).toContain("size-3.5");
  });

  it("rend une initiale pour les technologies inconnues", () => {
    const html = renderToStaticMarkup(<LogoTechno nom="Zustand" className="size-3.5" />);
    expect(html).not.toContain("<svg");
    expect(html).toContain("Z");
  });

  it("logoTechno renvoie null pour une technologie ignorée", () => {
    expect(logoTechno("CI/CD")).toBeNull();
    expect(logoTechno("AWS")).toBeNull();
  });

  it("logoTechno renvoie l'icône pour une technologie connue", () => {
    const icon = logoTechno("Next.js");
    expect(icon).not.toBeNull();
    expect(icon?.title).toBe("Next.js");
  });
});
