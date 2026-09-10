import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, ClipboardList, FileText, Paperclip, StickyNote, Wallet } from "lucide-react";
import { useCabinet } from "@/lib/cabinet/store";
import { dt, fmtDate, statusMeta } from "@/lib/cabinet/utils";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { GhostButton } from "@/components/cabinet/Modal";

export const Route = createFileRoute("/historique/$id")({
  head: () => ({
    meta: [
      { title: "Historique du patient — Cabinet" },
      {
        name: "description",
        content: "Chronologie complète du patient : consultations, notes, certificats et paiements.",
      },
      { property: "og:title", content: "Historique du patient — Cabinet" },
      { property: "og:description", content: "Consultations, notes, certificats et paiements du patient." },
    ],
  }),
  component: HistoryPage,
});

type Kind = "Consultations" | "Diagnostic" | "Notes" | "Certificats" | "Comptabilité";
const kinds: Kind[] = ["Consultations", "Diagnostic", "Notes", "Certificats", "Comptabilité"];

interface Entry {
  id: string;
  kind: Kind;
  date: string;
  time?: string;
  title: string;
  detail?: string;
  badge?: string;
  attachments?: number;
}

const kindStyle: Record<Kind, { icon: typeof CalendarDays; cls: string }> = {
  Consultations: { icon: CalendarDays, cls: "bg-frost text-twilight" },
  Diagnostic: { icon: ClipboardList, cls: "bg-warning-soft text-warning" },
  Notes: { icon: StickyNote, cls: "bg-cyan text-twilight" },
  Certificats: { icon: FileText, cls: "bg-success-soft text-success" },
  Comptabilité: { icon: Wallet, cls: "bg-danger-soft text-danger" },
};

function HistoryPage() {
  const { id } = useParams({ from: "/historique/$id" });
  const { data } = useCabinet();
  const [filters, setFilters] = useState<Kind[]>(kinds);

  const patient = data.patients.find((p) => p.id === id);

  const entries = useMemo<Entry[]>(() => {
    if (!patient) return [];
    const out: Entry[] = [];
    for (const a of data.appointments.filter((x) => x.patientId === patient.id)) {
      out.push({
        id: a.id,
        kind: "Consultations",
        date: a.date,
        time: a.time,
        title: a.reason || "Consultation",
        badge: statusMeta[a.status].label,
      });
    }
    for (const n of data.notes.filter((x) => x.patientId === patient.id)) {
      out.push({
        id: n.id,
        kind: "Notes",
        date: n.date,
        title: "Note de consultation",
        detail: n.text,
        attachments: n.attachments?.length ?? 0,
      });
    }
    for (const c of data.certificates.filter((x) => x.patientId === patient.id)) {
      out.push({
        id: c.id,
        kind: "Certificats",
        date: c.documentDate,
        title: c.type,
        detail: c.text,
        ...(c.days ? { badge: `${c.days} jour(s)` } : {}),
      });
    }
    for (const g of data.diagnostics.filter((x) => x.patientId === patient.id)) {
      out.push({
        id: g.id,
        kind: "Diagnostic",
        date: g.date,
        title: g.reason || "Entretien avec le patient",
        ...(g.content.trim() ? { detail: g.content.trim() } : {}),
        badge: g.status === "brouillon" ? "Brouillon" : "Terminé",
      });
    }
    for (const p of data.payments.filter((x) => x.patientId === patient.id)) {
      out.push({
        id: p.id,
        kind: "Comptabilité",
        date: p.date,
        title: dt(p.amount),
        badge: p.method === "cash" ? "Espèces" : p.method === "cnam_paid" ? "CNAM réglé" : "CNAM en attente",
      });
    }
    return out.sort((a, b) => (b.date + (b.time ?? "")).localeCompare(a.date + (a.time ?? "")));
  }, [data, patient]);

  if (!patient) {
    return (
      <ScreenTransition>
        <PageHeader title="Patient introuvable" subtitle="Ce dossier n'existe plus" />
        <Link to="/patients" search={{ p: undefined }}>
          <GhostButton>Retour aux patients</GhostButton>
        </Link>
      </ScreenTransition>
    );
  }

  const shown = entries.filter((e) => filters.includes(e.kind));
  const total = data.payments
    .filter((p) => p.patientId === patient.id)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <ScreenTransition>
      <PageHeader
        title={`Historique — ${patient.name}`}
        subtitle={`${patient.code} · ${entries.length} événement(s) · ${dt(total)} encaissés`}
        actions={
          <Link to="/patients" search={{ p: patient.id }}>
            <GhostButton>Ouvrir le dossier</GhostButton>
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {kinds.map((k) => {
          const active = filters.includes(k);
          return (
            <button
              key={k}
              onClick={() => setFilters(active ? filters.filter((f) => f !== k) : [...filters, k])}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-teal text-white" : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {k}
            </button>
          );
        })}
      </div>

      <Card>
        {shown.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucun événement à afficher.</p>
        ) : (
          <ol className="relative ml-3 border-l border-border">
            {shown.map((e) => {
              const Icon = kindStyle[e.kind].icon;
              return (
                <li key={e.kind + e.id} className="mb-6 ml-6 last:mb-0">
                  <span
                    className={`absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full ${kindStyle[e.kind].cls}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="num text-sm font-semibold">
                      {fmtDate(e.date, "dd/MM/yyyy")}
                      {e.time ? ` · ${e.time}` : ""}
                    </span>
                    <span className="label-caps text-muted-foreground">{e.kind}</span>
                    {e.badge && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{e.badge}</span>
                    )}
                  </div>
                  <p className="mt-1 font-medium">{e.title}</p>
                  {e.detail && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{e.detail}</p>}
                  {!!e.attachments && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Paperclip className="h-3 w-3" /> {e.attachments} pièce(s) jointe(s)
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </ScreenTransition>
  );
}
