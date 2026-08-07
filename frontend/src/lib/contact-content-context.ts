import { createContext } from "react";
import type { ContactContent } from "./supabase/types";

export const ContactContentContext = createContext<ContactContent | null>(null);
