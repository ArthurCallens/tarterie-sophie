import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "./Button";
import { SuccessBurst } from "../motion/SuccessBurst";

export function WorkshopSignupForm({ workshopName }: { workshopName: string }) {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative overflow-hidden rounded-2xl bg-butter/40 p-6 text-center"
      >
        <SuccessBurst />
        <motion.p
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.1 }}
          className="font-display text-lg text-cacao"
        >
          Plekje gereserveerd! 🧁
        </motion.p>
        <p className="mt-2 text-sm text-cacao-soft">
          Sophie bevestigt jouw plekje voor "{workshopName}" per e-mail.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-3 font-body text-sm font-semibold text-cherry underline underline-offset-4"
        >
          Nog iemand inschrijven
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-cacao">
          Naam
          <input
            name="name"
            required
            type="text"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-2.5 text-base text-cacao focus:border-cherry"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-cacao">
          Jouw e-mailadres
          <input
            name="email"
            required
            type="email"
            placeholder="jij@voorbeeld.be"
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-2.5 text-base text-cacao placeholder:text-cacao-soft/60 focus:border-cherry"
          />
        </label>
      </div>
      <div className="mt-1">
        <Button type="submit">Reserveer mijn plekje</Button>
      </div>
    </form>
  );
}
