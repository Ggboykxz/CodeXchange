/**
 * Applique le thème avant la première peinture (évite le flash).
 * `data-theme` est déjà posé côté serveur depuis le cookie ; ce script
 * réconcilie le cas `auto` avec la préférence système en temps réel.
 */
export function ThemeScript() {
  const script = `(function(){try{var t=document.documentElement.dataset.theme||"auto";if(t!=="auto")return;var m=window.matchMedia("(prefers-color-scheme: dark)");function f(){document.documentElement.style.colorScheme=m.matches?"dark":"light";}m.addEventListener("change",f);f();}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
