import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/** Right-hand side panel with overlay; closes on Escape or overlay click. */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#03045E]/50 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">{title}</div>
          <button onClick={onClose} aria-label="Fermer" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  );
}
