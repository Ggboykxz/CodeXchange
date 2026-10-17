/**
 * Applique le mode léger avant la première peinture (évite le flash).
 * Lit localStorage `cx-data-saver` (1/0) et la préférence système
 * `prefers-reduced-data: reduce`.
 */
export function DataSaverScript() {
  const script = `(function(){try{var d=localStorage.getItem("cx-data-saver");var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-data: reduce)").matches;var on=d==="1"|| (d===null && reduce);if(on)document.documentElement.classList.add("data-saver");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
