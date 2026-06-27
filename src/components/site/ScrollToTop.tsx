import { useEffect } from "react";
import { useLocation } from "@/lib/navigation";

/** Scrolls window to top on every route change. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}
