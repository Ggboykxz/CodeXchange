import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LogoTechno from "@/components/logo-techno";

describe("logo techno", () => {
  it("render Flutter logo", () => {
    const html = renderToStaticMarkup(<LogoTechno nom="Flutter" className="size-3.5" />);
    console.log(html.slice(0, 120));
    expect(html).toContain("<svg");
  });
  it("render fallback", () => {
    const html = renderToStaticMarkup(<LogoTechno nom="SwiftUI" className="size-3.5" />);
    console.log(html.slice(0, 120));
    expect(html).toContain("span");
  });
});
