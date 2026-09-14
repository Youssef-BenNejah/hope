import { useCallback, useState } from "react";
import { Eye, EyeOff, LogIn, ShieldCheck, Stethoscope, UsersRound } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCabinet } from "@/lib/cabinet/store";
import logo from "@/assets/logo.png";

export function LockScreen() {
  const { data, unlock } = useCabinet();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const attemptLogin = useCallback(
    (mailRaw: string, passwordRaw: string) => {
      const mail = mailRaw.trim().toLowerCase();
      if (!mail || !passwordRaw) {
        setError("Renseignez l'email et le mot de passe");
        return;
      }
      setSubmitting(true);
      window.setTimeout(() => {
        const isAdmin =
          mail === (data.settings.adminEmail || "admin@cabinet.tn").toLowerCase() &&
          passwordRaw === (data.settings.adminPassword || "Admin@2024");
        const staff = data.doctors.find(
          (d) => d.active && d.email.trim().toLowerCase() === mail && d.password === passwordRaw,
        );

        if (isAdmin) {
          setError("");
          unlock({ admin: true });
        } else if (staff) {
          setError("");
          unlock({ userId: staff.id });
          navigate({ to: "/" });
        } else {
          setError("Email ou mot de passe incorrect");
        }
        setSubmitting(false);
      }, 250);
    },
    [data.doctors, data.settings.adminEmail, data.settings.adminPassword, unlock, navigate],
  );

  const submit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      attemptLogin(email, password);
    },
    [attemptLogin, email, password],
  );

  const quickLogin = useCallback(
    (mail: string, pass: string) => {
      setEmail(mail);
      setPassword(pass);
      attemptLogin(mail, pass);
    },
    [attemptLogin],
  );

  const quickDoctor =
    data.doctors.find((d) => d.active && d.role === "medecin" && d.name === data.settings.doctorName) ??
    data.doctors.find((d) => d.active && d.role === "medecin");
  const quickSecretaire = data.doctors.find((d) => d.active && d.role === "secretaire");
  const quickOptions = [
    quickDoctor && { label: "Médecin", icon: Stethoscope, email: quickDoctor.email, password: quickDoctor.password },
    quickSecretaire && {
      label: "Secrétaire",
      icon: UsersRound,
      email: quickSecretaire.email,
      password: quickSecretaire.password,
    },
    {
      label: "Admin",
      icon: ShieldCheck,
      email: data.settings.adminEmail || "admin@cabinet.tn",
      password: data.settings.adminPassword || "Admin@2024",
    },
  ].filter((o): o is { label: string; icon: typeof Stethoscope; email: string; password: string } => !!o);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #03045E 0%, #052a7a 55%, #0077B6 100%)" }}
    >
      <img
        src={logo}
        alt="Cabinet"
        className="h-24 w-24 drop-shadow-[0_0_24px_rgba(144,224,239,0.35)]"
      />
      <h1 className="mt-6 text-2xl font-semibold text-[#EAF2FA]">Cabinet</h1>
      <p className="mt-1 text-sm text-frost">{data.settings.doctorName}</p>

      <form onSubmit={submit} className={`mt-8 w-full max-w-sm space-y-3 ${error ? "animate-shake" : ""}`}>
        <div>
          <label className="mb-1 block text-xs font-medium text-frost/80">Email</label>
          <input
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="nom@cabinet.tn"
            className={`w-full rounded-xl border-2 bg-white/10 px-4 py-3 text-sm text-[#EAF2FA] placeholder:text-frost/40 outline-none transition-colors focus:bg-white/15 ${
              error ? "border-[#C4432E]" : "border-white/25 focus:border-frost"
            }`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-frost/80">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              className={`w-full rounded-xl border-2 bg-white/10 px-4 py-3 pr-11 text-sm text-[#EAF2FA] placeholder:text-frost/40 outline-none transition-colors focus:bg-white/15 ${
                error ? "border-[#C4432E]" : "border-white/25 focus:border-frost"
              }`}
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

        <p className={`h-5 text-sm ${error ? "text-[#e2705a]" : "text-transparent"}`}>{error || "-"}</p>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-frost py-3 text-sm font-semibold text-twilight transition-colors hover:bg-white disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" /> {submitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="mt-6 w-full max-w-sm">
        <p className="mb-2 text-center text-[11px] uppercase tracking-wide text-frost/50">Connexion rapide (démo)</p>
        <div className="flex justify-center gap-2">
          {quickOptions.map((o) => (
            <button
              key={o.label}
              type="button"
              disabled={submitting}
              onClick={() => quickLogin(o.email, o.password)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-frost transition-colors hover:border-frost/60 hover:bg-white/15 disabled:opacity-60"
            >
              <o.icon className="h-3.5 w-3.5" /> {o.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-frost/60">
        Identifiants créés et communiqués par l'administration (page Administration).
      </p>
    </div>
  );
}
