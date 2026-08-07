import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/useAuth";

export function AccountPage() {
  const { session, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("De wachtwoorden komen niet overeen.");
      setSuccess(false);
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl font-semibold text-cacao">Account</h1>
      <p className="mt-1 text-sm text-cacao-soft">Ingelogd als {session?.user.email}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-cacao">Wachtwoord wijzigen</h2>

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
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

        <label className="flex flex-col gap-2 text-sm font-medium text-cacao">
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

        {error && <p className="text-sm text-cherry">{error}</p>}
        {success && <p className="text-sm text-cacao">Wachtwoord gewijzigd.</p>}

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-cherry px-6 py-3 font-semibold text-cream hover:bg-cherry-dark disabled:opacity-60"
          >
            {submitting ? "Bezig met opslaan…" : "Wachtwoord opslaan"}
          </button>
        </div>
      </form>
    </div>
  );
}
