import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FileText, Paperclip, SendHorizontal, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import type { NoteAttachment } from "@/lib/cabinet/types";
import { fmtAgo, resizeImage } from "@/lib/cabinet/utils";
import { PageHeader, ScreenTransition } from "@/components/cabinet/Page";

const QUICK_ACTIONS = [
  "📞 Peux-tu appeler à l'accueil ?",
  "🧑‍⚕️ Patient en salle d'attente",
  "📋 RDV à confirmer",
  "💊 Volet CNAM à faire signer",
  "⏱️ J'ai 15 min de retard",
  "✅ C'est noté, merci",
];

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Cabinet" },
      {
        name: "description",
        content: "Messagerie interne du cabinet : conversations entre le médecin et le secrétariat, avec pièces jointes.",
      },
      { property: "og:title", content: "Messages — Cabinet" },
      { property: "og:description", content: "Discussion instantanée de l'équipe du cabinet." },
    ],
  }),
  component: MessagesPage,
});

const initials = (name: string) =>
  name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const fileTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

function MessagesPage() {
  const { data, update, newId, currentUser, patientName } = useCabinet();
  const navigate = useNavigate();
  const meId = currentUser?.id ?? data.doctors.find((d) => d.name === data.settings.doctorName)?.id ?? "doc-amine";
  const team = data.doctors.filter((d) => d.active);
  const nameOf = (id?: string) => data.doctors.find((d) => d.id === id)?.name ?? "Inconnu";

  const [active, setActive] = useState<string>("team");
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<NoteAttachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const insertQuick = (phrase: string) => {
    setDraft((d) => (d.trim() ? `${d.trim()} ${phrase}` : phrase));
    taRef.current?.focus();
  };

  const inConv = (m: (typeof data.messages)[number], key: string) => {
    if (key === "team") return !m.toId;
    return (
      (m.fromId === meId && m.toId === key) || (m.fromId === key && m.toId === meId)
    );
  };

  const convs = useMemo(() => {
    const list = [
      { key: "team", label: "Équipe", team: true as const },
      ...team.filter((d) => d.id !== meId).map((d) => ({ key: d.id, label: d.name, team: false as const })),
    ];
    return list
      .map((c) => {
        const msgs = data.messages.filter((m) => inConv(m, c.key)).sort((a, b) => a.date.localeCompare(b.date));
        const last = msgs.at(-1);
        const unread = msgs.filter((m) => !m.read && m.fromId !== meId).length;
        return { ...c, last, unread, lastDate: last?.date ?? "" };
      })
      .sort((a, b) => {
        if (a.key === "team") return -1;
        if (b.key === "team") return 1;
        return b.lastDate.localeCompare(a.lastDate);
      });
  }, [data.messages, team, meId]);

  const thread = useMemo(
    () => data.messages.filter((m) => inConv(m, active)).sort((a, b) => a.date.localeCompare(b.date)),
    [data.messages, active, meId],
  );

  // Marquer comme lu à l'ouverture d'un fil
  useEffect(() => {
    const unreadIds = thread.filter((m) => !m.read && m.fromId !== meId).map((m) => m.id);
    if (unreadIds.length === 0) return;
    update((d) => ({
      ...d,
      messages: d.messages.map((m) => (unreadIds.includes(m.id) ? { ...m, read: true } : m)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, thread.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [active, thread.length]);

  const addFiles = async (files: File[]) => {
    const out: NoteAttachment[] = [];
    for (const f of files) {
      try {
        if (f.type.startsWith("image/")) {
          out.push({ id: newId(), name: f.name, type: f.type, dataUrl: await resizeImage(f, 1100) });
        } else {
          if (f.size > 3_000_000) {
            toast.error(`${f.name} dépasse 3 Mo`);
            continue;
          }
          const dataUrl = await new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onerror = () => rej(new Error("lecture impossible"));
            r.onload = () => res(String(r.result));
            r.readAsDataURL(f);
          });
          out.push({ id: newId(), name: f.name, type: f.type || "application/octet-stream", dataUrl });
        }
      } catch {
        toast.error(`${f.name} : import impossible`);
      }
    }
    if (out.length) setPending((p) => [...p, ...out]);
  };

  const send = () => {
    if (!draft.trim() && pending.length === 0) return;
    update(
      (d) => ({
        ...d,
        messages: [
          ...d.messages,
          {
            id: newId(),
            fromId: meId,
            ...(active === "team" ? {} : { toId: active }),
            text: draft.trim(),
            ...(pending.length ? { attachments: pending } : {}),
            date: new Date().toISOString(),
            read: false,
          },
        ],
      }),
      `Message — ${active === "team" ? "canal Équipe" : nameOf(active)}`,
    );
    setDraft("");
    setPending([]);
  };

  const activeConv = convs.find((c) => c.key === active);

  return (
    <ScreenTransition>
      <PageHeader title="Messages" subtitle="Messagerie interne du cabinet" />

      <div className="grid h-[calc(100vh-13rem)] min-h-[420px] overflow-hidden rounded-xl border border-border bg-card md:grid-cols-[280px_1fr]">
        {/* Liste des conversations */}
        <div className={`flex flex-col border-border md:border-r ${active && "hidden md:flex"}`}>
          <p className="border-b border-border px-4 py-3 text-sm font-semibold">Conversations</p>
          <div className="flex-1 overflow-y-auto">
            {convs.map((c) => (
              <button
                key={c.key}
                onClick={() => setActive(c.key)}
                className={`flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors last:border-0 ${
                  active === c.key ? "bg-cyan/40 dark:bg-muted" : "hover:bg-muted/60"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    c.team ? "bg-twilight text-frost" : "bg-frost text-twilight"
                  }`}
                >
                  {c.team ? <Users className="h-5 w-5" /> : initials(c.label)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${c.unread ? "font-semibold" : "font-medium"}`}>{c.label}</span>
                    {c.last && (
                      <span className="num shrink-0 text-[11px] text-muted-foreground">{fmtAgo(c.last.date)}</span>
                    )}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {c.last
                        ? `${c.last.fromId === meId ? "Vous : " : ""}${
                            c.last.text || (c.last.attachments?.length ? "📎 pièce jointe" : "")
                          }`
                        : "Démarrer la conversation"}
                    </span>
                    {c.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-surf px-1.5 text-[11px] font-semibold text-twilight">
                        {c.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Fil de discussion */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <button
              onClick={() => setActive("")}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted md:hidden"
              aria-label="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                active === "team" ? "bg-twilight text-frost" : "bg-frost text-twilight"
              }`}
            >
              {active === "team" ? <Users className="h-4 w-4" /> : initials(activeConv?.label ?? "?")}
            </span>
            <p className="truncate text-sm font-semibold">{activeConv?.label ?? "Sélectionnez une conversation"}</p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
            {thread.length === 0 && (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Aucun message. Écrivez le premier ci-dessous.
              </p>
            )}
            {thread.map((m, i) => {
              const mine = m.fromId === meId;
              const showSender = active === "team" && !mine && thread[i - 1]?.fromId !== m.fromId;
              return (
                <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  {showSender && (
                    <span className="mb-0.5 ml-1 text-[11px] font-medium text-muted-foreground">{nameOf(m.fromId)}</span>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? "rounded-br-md bg-teal text-white"
                        : "rounded-bl-md border border-border bg-card text-foreground"
                    }`}
                  >
                    {m.patientId && (
                      <button
                        onClick={() => navigate({ to: "/patients", search: { p: m.patientId } })}
                        className={`mb-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                          mine ? "bg-white/20" : "bg-frost text-twilight"
                        }`}
                      >
                        <UserRound className="h-3 w-3" /> {patientName(m.patientId)}
                      </button>
                    )}
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mb-1 flex flex-wrap gap-2">
                        {m.attachments.map((a) =>
                          a.type.startsWith("image/") ? (
                            <a key={a.id} href={a.dataUrl} target="_blank" rel="noreferrer">
                              <img
                                src={a.dataUrl}
                                alt={a.name}
                                className="max-h-44 max-w-[220px] rounded-lg object-cover"
                              />
                            </a>
                          ) : (
                            <a
                              key={a.id}
                              href={a.dataUrl}
                              download={a.name}
                              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                                mine ? "bg-white/15 text-white" : "border border-border bg-background"
                              }`}
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="max-w-[160px] truncate">{a.name}</span>
                            </a>
                          ),
                        )}
                      </div>
                    )}
                    {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                    <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                      {fileTime(m.date)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Composeur */}
          {active && (
            <div className="border-t border-border p-3">
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa}
                    onClick={() => insertQuick(qa)}
                    className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-teal hover:bg-teal/10 hover:text-teal"
                  >
                    {qa}
                  </button>
                ))}
              </div>
              {pending.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pending.map((a) => (
                    <span
                      key={a.id}
                      className="flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-xs"
                    >
                      {a.type.startsWith("image/") ? (
                        <img src={a.dataUrl} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <FileText className="h-4 w-4 text-teal" />
                      )}
                      <span className="max-w-[140px] truncate">{a.name}</span>
                      <button
                        onClick={() => setPending((p) => p.filter((x) => x.id !== a.id))}
                        aria-label="Retirer"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void addFiles(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-teal"
                  aria-label="Joindre un fichier"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <textarea
                  ref={taRef}
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Écrivez un message…"
                  className="max-h-32 min-h-[40px] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-teal"
                />
                <button
                  onClick={send}
                  disabled={!draft.trim() && pending.length === 0}
                  className="shrink-0 rounded-full bg-teal p-2.5 text-white transition-colors hover:bg-surf disabled:opacity-40"
                  aria-label="Envoyer"
                >
                  <SendHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScreenTransition>
  );
}
