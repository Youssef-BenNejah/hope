import { useCallback, useEffect, useState } from "react";
import { Delete } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCabinet } from "@/lib/cabinet/store";
import logo from "@/assets/logo.png";

export function LockScreen() {
  const { data, unlock } = useCabinet();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const submit = useCallback(
    (value: string) => {
      const staff = data.doctors.find((d) => d.active && d.pin === value);
      const mainDoctor =
        data.doctors.find((d) => d.active && d.name === data.settings.doctorName) ??
        data.doctors.find((d) => d.active && d.role === "medecin");

      if (value === (data.settings.adminPin || "0000")) {
        setError(false);
        window.setTimeout(() => unlock({ admin: true }), 150);
      } else if (staff || value === data.settings.pin) {
        const user = staff ?? mainDoctor;
        setError(false);
        window.setTimeout(() => {
          unlock(user ? { userId: user.id } : {});
          navigate({ to: "/" });
        }, 150);
      } else {
        setError(true);
        window.setTimeout(() => {
          setCode("");
          setError(false);
        }, 500);
      }
    },
    [data.doctors, data.settings.pin, data.settings.adminPin, data.settings.doctorName, unlock, navigate],
  );

  const push = useCallback(
    (digit: string) => {
      setCode((prev) => {
        if (prev.length >= 4) return prev;
        const next = prev + digit;
        if (next.length === 4) window.setTimeout(() => submit(next), 120);
        return next;
      });
    },
    [submit],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) push(e.key);
      if (e.key === "Backspace") setCode((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [push]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #03045E 0%, #052a7a 55%, #0077B6 100%)" }}
    >
      <img
        src={logo}
        alt="Cabinet"
        className="h-24 w-24 drop-shadow-[0_0_24px_rgba(144,224,239,0.35)]"
      />
      <h1 className="mt-6 text-2xl font-semibold text-[#EAF2FA]">Cabinet</h1>
      <p className="mt-1 text-sm text-frost">{data.settings.doctorName}</p>

      <div className={`mt-10 flex gap-3 ${error ? "animate-shake" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 text-2xl num text-[#EAF2FA] transition-colors ${
              error ? "border-[#C4432E]" : code.length > i ? "border-frost bg-white/10" : "border-white/25"
            }`}
          >
            {code[i] ? "•" : ""}
          </div>
        ))}
      </div>

      <p className={`mt-3 h-5 text-sm ${error ? "text-[#e2705a]" : "text-frost/70"}`}>
        {error ? "Code incorrect" : "Médecin : 1234 · Secrétariat : 2580 · Administration : 0000"}
      </p>

      <div className="mt-6 grid w-64 grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button
            key={n}
            onClick={() => push(n)}
            className="h-14 rounded-xl border border-white/20 bg-white/5 text-lg num text-[#EAF2FA] transition-colors hover:bg-white/15"
          >
            {n}
          </button>
        ))}
        <span />
        <button
          onClick={() => push("0")}
          className="h-14 rounded-xl border border-white/20 bg-white/5 text-lg num text-[#EAF2FA] transition-colors hover:bg-white/15"
        >
          0
        </button>
        <button
          onClick={() => setCode((p) => p.slice(0, -1))}
          aria-label="Effacer"
          className="flex h-14 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-[#EAF2FA] transition-colors hover:bg-white/15"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
