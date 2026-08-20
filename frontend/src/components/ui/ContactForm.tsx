import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "./Button";
import { SuccessBurst } from "../motion/SuccessBurst";
import { sendContactMessage } from "../../lib/supabase/contact";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    const form = new FormData(event.currentTarget);
    setIsSending(true);
    setSendError(null);
    try {
      await sendContactMessage({
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        message: String(form.get("message") || ""),
      });
      setSent(true);
    } catch (error) {
      console.error("Kon bericht niet versturen:", error);
      setSendError("Er ging iets mis bij het versturen. Probeer het opnieuw, of mail rechtstreeks naar Sophie.");
    } finally {
      setIsSending(false);
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative overflow-hidden rounded-3xl p-8 text-center"
      >
        <SuccessBurst />
        <motion.p
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.1 }}
          className="font-display text-xl text-cacao"
        >
          Dankjewel! 💌
        </motion.p>
        <p className="mt-2 text-cacao-soft">
          Je bericht is verstuurd. Sophie antwoordt zo snel mogelijk op het e-mailadres dat je
          hebt opgegeven.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 font-body text-sm font-semibold text-cherry underline underline-offset-4"
        >
          Nog een bericht sturen
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="rounded-3xl border border-cacao/10 p-8 sm:p-10">
      <h3 className="font-display text-2xl text-cacao">Stuur een berichtje</h3>
      <div className="mt-6 grid gap-5">
        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Naam
          <input
            name="name"
            required
            type="text"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Jouw e-mailadres
          <input
            name="email"
            required
            type="email"
            placeholder="jij@voorbeeld.be"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao placeholder:text-cacao-soft/60 focus:border-cherry"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
          Bericht
          <textarea
            name="message"
            required
            rows={5}
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
          />
        </label>
      </div>
      {sendError && <p className="mt-4 text-sm text-cherry">{sendError}</p>}
      <div className="mt-6">
        <Button type="submit" className={isSending ? "pointer-events-none opacity-60" : undefined}>
          {isSending ? "Bezig met versturen…" : "Verstuur bericht"}
        </Button>
      </div>
    </form>
  );
}
