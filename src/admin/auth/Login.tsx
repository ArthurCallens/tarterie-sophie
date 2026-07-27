import { useState, type FormEvent } from "react";
import { Navigate, useLocation, type Location } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function Login() {
  const { session, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/admin/products";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError(error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-cream-dark p-8 shadow-[var(--shadow-card)]"
      >
        <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Tarterie Sophie</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-cacao">Dashboard inloggen</h1>

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

        <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-cacao">
          Wachtwoord
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-cacao/15 bg-cream px-4 py-3 text-base text-cacao focus:border-cherry"
          />
        </label>

        {error && <p className="mt-4 text-sm text-cherry">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-cherry px-6 py-3 font-semibold text-cream transition-colors hover:bg-cherry-dark disabled:opacity-60"
        >
          {submitting ? "Bezig met inloggen…" : "Inloggen"}
        </button>
      </form>
    </div>
  );
}
