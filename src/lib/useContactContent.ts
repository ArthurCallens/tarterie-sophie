import { useContext } from "react";
import { ContactContentContext } from "./contact-content-context";

/** null until the fetch resolves — callers should render a sensible empty state until then. */
export function useContactContent() {
  return useContext(ContactContentContext);
}
