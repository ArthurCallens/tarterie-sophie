import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export function ResetPassword() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) setError(error);
    else navigate("/admin/orders", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl bg-cream-dark p-8 shadow-[var(--shadow-card)]">
        <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Tarterie Sophie</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-cacao">Nieuw wachtwoord instellen</h1>

        {loading ? (
          <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>
        ) : !session ? (
          <p className="mt-6 text-sm text-cherry">
            Deze link is ongeldig of verlopen. Vraag een nieuwe resetlink aan via "Wachtwoord vergeten?" op de
            inlogpagina.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mt-6 flex flex-col gap-2 text-sm font-medium text-cacao">
              Nieuw wachtwoord
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
              />
            </label>

            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-cacao">
              Bevestig nieuw wachtwoord
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
              />
            </label>

            {error && <p className="mt-4 text-sm text-cherry">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-cherry px-6 py-3 font-semibold text-cream transition-colors hover:bg-cherry-dark disabled:opacity-60"
            >
              {submitting ? "Bezig met opslaan…" : "Wachtwoord instellen"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
