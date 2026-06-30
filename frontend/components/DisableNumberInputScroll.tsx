"use client";

import { useEffect } from "react";

export default function DisableNumberInputScroll() {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (document.activeElement && document.activeElement.tagName === "INPUT") {
        const input = document.activeElement as HTMLInputElement;
        if (input.type === "number") {
          input.blur();
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return null;
}
