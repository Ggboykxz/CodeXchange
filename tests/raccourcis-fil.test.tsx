// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRaccourcisFil } from "@/lib/use-raccourcis-fil";

/** jsdom n'implémente pas le défilement : le hook doit rester silencieux. */
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn() as unknown as typeof Element.prototype.scrollIntoView;
});

afterEach(() => {
  cleanup();
});

function Fil() {
  const ids = [11, 22, 33];
  const { actifId } = useRaccourcisFil(ids);
  return (
    <div>
      <input aria-label="champ libre" />
      <ul>
        {ids.map((id) => (
          <li key={id} data-fil-item data-id={id} data-actif={actifId === id ? "true" : undefined}>
            <a href={`#sujet-${id}`} data-lien-principal>
              Sujet {id}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function actif(): string | null {
  return document.querySelector<HTMLElement>('[data-fil-item][data-actif="true"]')?.dataset.id ?? null;
}

describe("raccourcis du fil (j/k/Entrée/Échap)", () => {
  it("j descend, k remonte et Échap quitte", () => {
    render(<Fil />);
    expect(actif()).toBeNull();

    fireEvent.keyDown(document, { key: "j" });
    expect(actif()).toBe("11");

    fireEvent.keyDown(document, { key: "j" });
    expect(actif()).toBe("22");

    fireEvent.keyDown(document, { key: "k" });
    expect(actif()).toBe("11");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(actif()).toBeNull();
  });

  it("ne détourne pas la frappe dans un champ de saisie", () => {
    const { getByLabelText } = render(<Fil />);
    const champ = getByLabelText("champ libre");
    champ.focus();

    fireEvent.keyDown(champ, { key: "j" });
    expect(actif()).toBeNull();
  });

  it("Entrée ouvre le sujet actif", () => {
    render(<Fil />);
    fireEvent.keyDown(document, { key: "j" });
    const lien = document.querySelector<HTMLAnchorElement>("[data-lien-principal]");
    const clic = vi.fn();
    lien?.addEventListener("click", clic);

    fireEvent.keyDown(document, { key: "Enter" });
    expect(clic).toHaveBeenCalledTimes(1);
  });

  it("ignore les combinaisons avec modificateur", () => {
    render(<Fil />);
    fireEvent.keyDown(document, { key: "j", ctrlKey: true });
    expect(actif()).toBeNull();
  });
});
