import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import logo from "@/assets/logo.png";
import { errorMessage } from "@/lib/format";
import { useSession } from "./session";

const fieldCls = (hasError: boolean) =>
  `w-full rounded-xl border-2 bg-white/10 px-4 py-3 text-sm text-[#EAF2FA] placeholder:text-frost/40 outline-none transition-colors focus:bg-white/15 ${
    hasError ? "border-[#C4432E]" : "border-white/25 focus:border-frost"
  }`;

export function LoginScreen({ notice }: { notice?: string | undefined }) {
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Renseignez l'email et le mot de passe");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  const message = error || notice || "";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #03045E 0%, #052a7a 55%, #0077B6 100%)" }}
    >
      <img src={logo} alt="Hope" width={96} height={96} className="h-24 w-24 drop-shadow-[0_0_24px_rgba(144,224,239,0.35)]" />
      <h1 className="mt-6 text-2xl font-semibold text-[#EAF2FA]">Administration</h1>

      <form onSubmit={submit} className={`mt-8 w-full max-w-sm space-y-3 ${error ? "animate-shake" : ""}`}>
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-frost/80">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className={fieldCls(!!error)}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-xs font-medium text-frost/80">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className={`${fieldCls(!!error)} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-frost/70 hover:text-frost"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <p role="alert" className={`min-h-5 text-sm ${error ? "text-[#e2705a]" : "text-frost/80"}`}>
          {message}
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-frost py-3 text-sm font-semibold text-twilight transition-colors hover:bg-white disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" /> {submitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
