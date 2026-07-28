import { useEffect, useState, type ReactNode } from "react";
import { ContactContentContext } from "./contact-content-context";
import { getPageContent } from "./supabase/pageContent";
import type { ContactContent } from "./supabase/types";

/**
 * Fetches the contact/social info once at the site root and shares it —
 * Footer, Contact page, etc. all need it, and without this each would fire
 * its own duplicate request.
 */
export function ContactContentProvider({ children }: { children: ReactNode }) {
  const [contact, setContact] = useState<ContactContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPageContent<ContactContent>("contact").then((data) => {
      if (!cancelled) setContact(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <ContactContentContext.Provider value={contact}>{children}</ContactContentContext.Provider>;
}
