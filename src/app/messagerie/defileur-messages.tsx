"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/** Fait défiler la conversation sur le dernier message à chaque rendu. */
export default function DefileurMessages({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [children]);

  return (
    <div
      ref={ref}
      className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      style={{ maxHeight: "460px", scrollBehavior: "smooth" }}
    >
      {children}
    </div>
  );
}
