import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./useAuth";

export function ForgotPassword() {
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await sendPasswordResetEmail(email);
    setSubmitting(false);
    if (error) setError(error);
    else setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl bg-cream-dark p-8 shadow-[var(--shadow-card)]">
        <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Tarterie Sophie</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-cacao">Wachtwoord vergeten</h1>

        {sent ? (
          <p className="mt-6 text-sm text-cacao-soft">
            Als er een account bestaat voor <strong>{email}</strong>, is er een e-mail onderweg met een link om een
            nieuw wachtwoord in te stellen.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mt-6 flex flex-col gap-2 text-sm font-medium text-cacao">
              E-mailadres
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
              />
            </label>

            {error && <p className="mt-4 text-sm text-cherry">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-cherry px-6 py-3 font-semibold text-cream transition-colors hover:bg-cherry-dark disabled:opacity-60"
            >
              {submitting ? "Bezig met versturen…" : "Verstuur resetlink"}
            </button>
          </form>
        )}

        <Link to="/admin/login" className="mt-6 block text-center text-sm text-cacao-soft underline">
          Terug naar inloggen
        </Link>
      </div>
    </div>
  );
}
