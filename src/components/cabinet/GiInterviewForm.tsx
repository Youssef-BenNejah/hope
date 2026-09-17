import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import {
  ATCD_CHIR,
  ATCD_DIG,
  ATCD_FAM,
  ATCD_HEPATO,
  ATCD_MED,
  BRISTOL,
  CARACTERISTIQUES,
  DEBUTS,
  EVOLUTIONS,
  FACTEURS_AGGRAVANTS,
  FACTEURS_SOULAGEANTS,
  IRRADIATIONS,
  LOCALISATIONS,
  PARENTES,
  RED_FLAGS,
  RELATIONS_REPAS,
  SYMPTOM_GROUPS,
  type SymptomGroup,
  type SymptomItem,
} from "@/lib/cabinet/gi-interview";
import type { CustomSymptomGroup } from "@/lib/cabinet/types";
import { GhostButton, inputCls } from "./Modal";

type Checked = Record<string, boolean>;
type Extra = Record<string, string>;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-teal bg-teal text-white"
          : "border-border bg-background text-muted-foreground hover:border-teal/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
  onAdd,
}: {
  options: readonly string[];
  selected: (v: string) => boolean;
  onToggle: (v: string) => void;
  onAdd?: (v: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState("");

  const submit = () => {
    const v = val.trim();
    if (v) onAdd?.(v);
    setVal("");
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => (
        <Chip key={o} active={selected(o)} onClick={() => onToggle(o)}>
          {o}
        </Chip>
      ))}
      {onAdd &&
        (adding ? (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              } else if (e.key === "Escape") {
                setVal("");
                setAdding(false);
              }
            }}
            onBlur={submit}
            placeholder="Ajouter…"
            className="w-28 rounded-full border border-teal bg-background px-2.5 py-1 text-xs outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-teal hover:text-teal"
          >
            + Ajouter
          </button>
        ))}
    </div>
  );
}

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Section({
  title,
  count,
  open,
  onToggle,
  children,
  tone = "default",
}: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div className={`overflow-hidden rounded-lg border ${tone === "danger" ? "border-danger/40" : "border-border"}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium ${
          tone === "danger" ? "bg-danger-soft text-danger" : "bg-muted/50 hover:bg-muted"
        }`}
      >
        <span className="flex items-center gap-2">
          {tone === "danger" && <AlertTriangle className="h-4 w-4" />}
          {title}
          {!!count && (
            <span
              className={`num rounded-full px-2 py-0.5 text-[11px] ${
                tone === "danger" ? "bg-danger text-white" : "bg-teal text-white"
              }`}
            >
              {count}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 border-t border-border px-3 py-3">{children}</div>}
    </div>
  );
}

function itemsLabel(items: SymptomItem[], checked: Checked, prefix: string) {
  return items.filter((it) => checked[`${prefix}:${it.id}`]).map((it) => it.label);
}

export function GiInterviewForm({
  onChange,
  customGroups = [],
}: {
  onChange: (text: string) => void;
  customGroups?: CustomSymptomGroup[];
}) {
  const [checked, setChecked] = useState<Checked>({});
  const [extra, setExtra] = useState<Extra>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ flags: true, douleur: false });
  const [customOptions, setCustomOptions] = useState<Record<string, string[]>>({});

  const toItems = (labels: string[]): SymptomItem[] => labels.map((label) => ({ id: label, label }));

  // Fusionne : ajouts persistants (Paramètres, extendsGroupId) + ajouts ponctuels de cet entretien (customOptions)
  const mergedExtras = new Map<string, string[]>();
  const addToMerged = (key: string, vals: string[]) =>
    mergedExtras.set(key, [...(mergedExtras.get(key) ?? []), ...vals]);
  for (const g of customGroups) {
    if (g.extendsGroupId) addToMerged(g.extendsGroupId, g.items);
  }
  for (const [key, vals] of Object.entries(customOptions)) addToMerged(key, vals);
  const extrasFor = (key: string) => mergedExtras.get(key) ?? [];

  const addCustom = (key: string, value: string) => {
    const v = value.trim();
    if (!v) return;
    setCustomOptions((c) => (c[key]?.includes(v) ? c : { ...c, [key]: [...(c[key] ?? []), v] }));
  };
  const withCustom = (key: string, base: readonly string[]) => {
    const added = customOptions[key] ?? [];
    return [...base, ...added.filter((v) => !base.includes(v))];
  };

  const effectiveFlags: SymptomItem[] = [...RED_FLAGS, ...toItems(extrasFor("flags"))];
  const effAtcdMed: SymptomItem[] = [...ATCD_MED, ...toItems(extrasFor("atcd:med"))];
  const effAtcdDig: SymptomItem[] = [...ATCD_DIG, ...toItems(extrasFor("atcd:dig"))];
  const effAtcdHepato: SymptomItem[] = [...ATCD_HEPATO, ...toItems(extrasFor("atcd:hepato"))];
  const effAtcdChir: SymptomItem[] = [...ATCD_CHIR, ...toItems(extrasFor("atcd:chir"))];
  const effAtcdFam: SymptomItem[] = [...ATCD_FAM, ...toItems(extrasFor("atcd:fam"))];

  const allGroups: SymptomGroup[] = [
    ...SYMPTOM_GROUPS.map((g) => ({
      ...g,
      items: [...g.items, ...toItems(extrasFor(g.id))],
    })),
    ...customGroups
      .filter((g) => !g.extendsGroupId)
      .map((g) => {
        const ownId = `custom:${g.id}`;
        return {
          id: ownId,
          title: g.title,
          items: [...toItems(g.items), ...toItems(extrasFor(ownId))],
        };
      }),
  ];

  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }));
  const isOn = (key: string) => !!checked[key];
  const setField = (key: string, value: string) => setExtra((e) => ({ ...e, [key]: value }));
  const toggleSection = (id: string) => setOpenSections((s) => ({ ...s, [id]: !s[id] }));

  const redFlagCount = effectiveFlags.filter((f) => checked[`flag:${f.id}`]).length;

  const buildText = () => {
    const lines: string[] = [];

    const activeFlags = itemsLabel(effectiveFlags, checked, "flag");
    if (activeFlags.length) lines.push(`🚨 Red flags : ${activeFlags.join(", ")}`);

    for (const g of allGroups) {
      const active = itemsLabel(g.items, checked, `grp:${g.id}`);
      if (!active.length) continue;
      lines.push(`${g.title} : ${active.join(", ")}`);

      if (g.id === "douleur") {
        const loc = withCustom("douleur:loc", LOCALISATIONS).filter((v) => checked[`douleur:loc:${v}`]);
        const carac = withCustom("douleur:carac", CARACTERISTIQUES).filter((v) => checked[`douleur:carac:${v}`]);
        const irr = withCustom("douleur:irr", IRRADIATIONS).filter((v) => checked[`douleur:irr:${v}`]);
        const rel = withCustom("douleur:rel", RELATIONS_REPAS).filter((v) => checked[`douleur:rel:${v}`]);
        const agg = withCustom("douleur:agg", FACTEURS_AGGRAVANTS).filter((v) => checked[`douleur:agg:${v}`]);
        const soul = withCustom("douleur:soul", FACTEURS_SOULAGEANTS).filter((v) => checked[`douleur:soul:${v}`]);
        if (loc.length) lines.push(`  - Localisation : ${loc.join(", ")}`);
        if (carac.length) lines.push(`  - Caractéristique : ${carac.join(", ")}`);
        if (extra["douleur:eva"]) lines.push(`  - EVA : ${extra["douleur:eva"]}/10`);
        if (extra["douleur:debut"] || extra["douleur:continuite"])
          lines.push(
            `  - Début/durée : ${extra["douleur:debut"] || "—"}${extra["douleur:continuite"] ? `, ${extra["douleur:continuite"]}` : ""}`,
          );
        if (rel.length) lines.push(`  - Relation aux repas : ${rel.join(", ")}`);
        if (irr.length) lines.push(`  - Irradiation : ${irr.join(", ")}`);
        if (agg.length) lines.push(`  - Aggravée par : ${agg.join(", ")}`);
        if (soul.length) lines.push(`  - Soulagée par : ${soul.join(", ")}`);
      } else if (g.id === "transit") {
        if (extra["transit:selles"]) lines.push(`  - Selles/j : ${extra["transit:selles"]}`);
        if (extra["transit:bristol"]) lines.push(`  - Bristol : ${extra["transit:bristol"]}`);
        if (extra[`grpExtra:${g.id}:debut`] || extra[`grpExtra:${g.id}:evolution`] || extra[`grpExtra:${g.id}:eva`])
          lines.push(
            `  - Début : ${extra[`grpExtra:${g.id}:debut`] || "—"} ; Évolution : ${extra[`grpExtra:${g.id}:evolution`] || "—"}${
              extra[`grpExtra:${g.id}:eva`] ? ` ; EVA : ${extra[`grpExtra:${g.id}:eva`]}/10` : ""
            }`,
          );
      } else {
        const debut = extra[`grpExtra:${g.id}:debut`];
        const evolution = extra[`grpExtra:${g.id}:evolution`];
        const eva = extra[`grpExtra:${g.id}:eva`];
        if (debut || evolution || eva)
          lines.push(
            `  - Début : ${debut || "—"} ; Évolution : ${evolution || "—"}${eva ? ` ; EVA : ${eva}/10` : ""}`,
          );
      }
    }

    const med = itemsLabel(effAtcdMed, checked, "atcd:med");
    if (med.length) lines.push(`ATCD médicaux : ${med.join(", ")}`);
    const dig = itemsLabel(effAtcdDig, checked, "atcd:dig");
    if (dig.length) lines.push(`ATCD digestifs : ${dig.join(", ")}`);
    const hep = itemsLabel(effAtcdHepato, checked, "atcd:hepato");
    if (hep.length) lines.push(`ATCD hépato-bilio-pancréatiques : ${hep.join(", ")}`);
    const chir = itemsLabel(effAtcdChir, checked, "atcd:chir");
    if (chir.length) {
      lines.push(`ATCD chirurgicaux : ${chir.join(", ")}${extra["chir:details"] ? ` — ${extra["chir:details"]}` : ""}`);
    }
    const fam = itemsLabel(effAtcdFam, checked, "atcd:fam");
    if (fam.length) {
      const parente = extra["fam:parente"];
      const age = extra["fam:age"];
      lines.push(
        `ATCD familiaux : ${fam.join(", ")}${parente ? ` (${parente}${age ? `, dg à ${age} ans` : ""})` : ""}`,
      );
    }

    const habLines: string[] = [];
    if (extra["hab:tabac"]) habLines.push(`Tabac : ${extra["hab:tabac"]}${extra["hab:tabacPA"] ? ` (${extra["hab:tabacPA"]} PA)` : ""}`);
    if (extra["hab:alcool"]) habLines.push(`Alcool : ${extra["hab:alcool"]}${extra["hab:alcoolUnites"] ? ` (${extra["hab:alcoolUnites"]} unités/j)` : ""}`);
    if (extra["hab:ains"]) habLines.push(`AINS : ${extra["hab:ains"]}`);
    if (extra["hab:cannabis"]) habLines.push(`Cannabis/autres toxiques : ${extra["hab:cannabis"]}`);
    if (habLines.length) lines.push(`Habitudes : ${habLines.join(" ; ")}`);

    return lines.join("\n");
  };

  useEffect(() => {
    onChange(buildText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, extra]);

  return (
    <div className="space-y-3">
      <Section
        title="Red flags"
        count={redFlagCount}
        open={!!openSections['flags']}
        onToggle={() => toggleSection("flags")}
        tone="danger"
      >
        <ChipGroup options={effectiveFlags.map((f) => f.label)} selected={(v) => isOn(`flag:${v}`)} onToggle={(v) => toggle(`flag:${v}`)} onAdd={(v) => { addCustom("flags", v); toggle(`flag:${v}`); }} />
      </Section>

      {allGroups.map((g) => {
        const count = itemsLabel(g.items, checked, `grp:${g.id}`).length;
        return (
          <Section key={g.id} title={g.title} count={count} open={!!openSections[g.id]} onToggle={() => toggleSection(g.id)}>
            <ChipGroup
              options={g.items.map((it) => it.label)}
              selected={(v) => isOn(`grp:${g.id}:${v}`)}
              onToggle={(v) => toggle(`grp:${g.id}:${v}`)}
              onAdd={(v) => {
                addCustom(g.id, v);
                toggle(`grp:${g.id}:${v}`);
              }}
            />

            {g.id === "douleur" && count > 0 && (
              <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                <MiniField label="Localisation">
                  <ChipGroup options={withCustom("douleur:loc", LOCALISATIONS)} selected={(v) => isOn(`douleur:loc:${v}`)} onToggle={(v) => toggle(`douleur:loc:${v}`)} onAdd={(v) => { addCustom("douleur:loc", v); toggle(`douleur:loc:${v}`); }} />
                </MiniField>
                <MiniField label="Caractéristique">
                  <ChipGroup options={withCustom("douleur:carac", CARACTERISTIQUES)} selected={(v) => isOn(`douleur:carac:${v}`)} onToggle={(v) => toggle(`douleur:carac:${v}`)} onAdd={(v) => { addCustom("douleur:carac", v); toggle(`douleur:carac:${v}`); }} />
                </MiniField>
                <MiniField label="Relation aux repas">
                  <ChipGroup options={withCustom("douleur:rel", RELATIONS_REPAS)} selected={(v) => isOn(`douleur:rel:${v}`)} onToggle={(v) => toggle(`douleur:rel:${v}`)} onAdd={(v) => { addCustom("douleur:rel", v); toggle(`douleur:rel:${v}`); }} />
                </MiniField>
                <MiniField label="Irradiation">
                  <ChipGroup options={withCustom("douleur:irr", IRRADIATIONS)} selected={(v) => isOn(`douleur:irr:${v}`)} onToggle={(v) => toggle(`douleur:irr:${v}`)} onAdd={(v) => { addCustom("douleur:irr", v); toggle(`douleur:irr:${v}`); }} />
                </MiniField>
                <MiniField label="Aggravée par">
                  <ChipGroup options={withCustom("douleur:agg", FACTEURS_AGGRAVANTS)} selected={(v) => isOn(`douleur:agg:${v}`)} onToggle={(v) => toggle(`douleur:agg:${v}`)} onAdd={(v) => { addCustom("douleur:agg", v); toggle(`douleur:agg:${v}`); }} />
                </MiniField>
                <MiniField label="Soulagée par">
                  <ChipGroup options={withCustom("douleur:soul", FACTEURS_SOULAGEANTS)} selected={(v) => isOn(`douleur:soul:${v}`)} onToggle={(v) => toggle(`douleur:soul:${v}`)} onAdd={(v) => { addCustom("douleur:soul", v); toggle(`douleur:soul:${v}`); }} />
                </MiniField>
                <MiniField label="Début / durée">
                  <input
                    className={`${inputCls} py-1.5 text-xs`}
                    placeholder="Ex. 3 jours"
                    value={extra["douleur:debut"] ?? ""}
                    onChange={(e) => setField("douleur:debut", e.target.value)}
                  />
                </MiniField>
                <MiniField label="Continue / intermittente">
                  <select
                    className={`${inputCls} py-1.5 text-xs`}
                    value={extra["douleur:continuite"] ?? ""}
                    onChange={(e) => setField("douleur:continuite", e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="continue">Continue</option>
                    <option value="intermittente">Intermittente</option>
                  </select>
                </MiniField>
                <MiniField label="EVA (0–10)">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className={`${inputCls} num py-1.5 text-xs`}
                    value={extra["douleur:eva"] ?? ""}
                    onChange={(e) => setField("douleur:eva", e.target.value)}
                  />
                </MiniField>
              </div>
            )}

            {g.id === "transit" && count > 0 && (
              <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                <MiniField label="Nombre de selles / jour">
                  <input
                    type="number"
                    min={0}
                    className={`${inputCls} num py-1.5 text-xs`}
                    value={extra["transit:selles"] ?? ""}
                    onChange={(e) => setField("transit:selles", e.target.value)}
                  />
                </MiniField>
                <MiniField label="Consistance — échelle de Bristol">
                  <ChipGroup options={withCustom("bristol", BRISTOL)} selected={(v) => extra["transit:bristol"] === v} onToggle={(v) => setField("transit:bristol", extra["transit:bristol"] === v ? "" : v)} onAdd={(v) => { addCustom("bristol", v); setField("transit:bristol", v); }} />
                </MiniField>
                <MiniField label="Début">
                  <ChipGroup
                    options={withCustom("debuts", DEBUTS)}
                    selected={(v) => extra[`grpExtra:${g.id}:debut`] === v}
                    onToggle={(v) => setField(`grpExtra:${g.id}:debut`, extra[`grpExtra:${g.id}:debut`] === v ? "" : v)}
                    onAdd={(v) => {
                      addCustom("debuts", v);
                      setField(`grpExtra:${g.id}:debut`, v);
                    }}
                  />
                </MiniField>
                <MiniField label="Évolution">
                  <ChipGroup
                    options={withCustom("evolutions", EVOLUTIONS)}
                    selected={(v) => extra[`grpExtra:${g.id}:evolution`] === v}
                    onToggle={(v) => setField(`grpExtra:${g.id}:evolution`, extra[`grpExtra:${g.id}:evolution`] === v ? "" : v)}
                    onAdd={(v) => {
                      addCustom("evolutions", v);
                      setField(`grpExtra:${g.id}:evolution`, v);
                    }}
                  />
                </MiniField>
              </div>
            )}

            {g.id !== "douleur" && g.id !== "transit" && count > 0 && (
              <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
                <MiniField label="Début">
                  <ChipGroup
                    options={withCustom("debuts", DEBUTS)}
                    selected={(v) => extra[`grpExtra:${g.id}:debut`] === v}
                    onToggle={(v) => setField(`grpExtra:${g.id}:debut`, extra[`grpExtra:${g.id}:debut`] === v ? "" : v)}
                    onAdd={(v) => {
                      addCustom("debuts", v);
                      setField(`grpExtra:${g.id}:debut`, v);
                    }}
                  />
                </MiniField>
                <MiniField label="Évolution">
                  <ChipGroup
                    options={withCustom("evolutions", EVOLUTIONS)}
                    selected={(v) => extra[`grpExtra:${g.id}:evolution`] === v}
                    onToggle={(v) => setField(`grpExtra:${g.id}:evolution`, extra[`grpExtra:${g.id}:evolution`] === v ? "" : v)}
                    onAdd={(v) => {
                      addCustom("evolutions", v);
                      setField(`grpExtra:${g.id}:evolution`, v);
                    }}
                  />
                </MiniField>
                <MiniField label="Intensité EVA (0–10)">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className={`${inputCls} num py-1.5 text-xs`}
                    value={extra[`grpExtra:${g.id}:eva`] ?? ""}
                    onChange={(e) => setField(`grpExtra:${g.id}:eva`, e.target.value)}
                  />
                </MiniField>
              </div>
            )}
          </Section>
        );
      })}

      <Section
        title="Antécédents médicaux"
        count={itemsLabel(ATCD_MED, checked, "atcd:med").length}
        open={!!openSections['atcdMed']}
        onToggle={() => toggleSection("atcdMed")}
      >
        <ChipGroup options={effAtcdMed.map((i) => i.label)} selected={(v) => isOn(`atcd:med:${v}`)} onToggle={(v) => toggle(`atcd:med:${v}`)} onAdd={(v) => { addCustom("atcd:med", v); toggle(`atcd:med:${v}`); }} />
      </Section>

      <Section
        title="Antécédents digestifs"
        count={itemsLabel(ATCD_DIG, checked, "atcd:dig").length}
        open={!!openSections['atcdDig']}
        onToggle={() => toggleSection("atcdDig")}
      >
        <ChipGroup options={effAtcdDig.map((i) => i.label)} selected={(v) => isOn(`atcd:dig:${v}`)} onToggle={(v) => toggle(`atcd:dig:${v}`)} onAdd={(v) => { addCustom("atcd:dig", v); toggle(`atcd:dig:${v}`); }} />
      </Section>

      <Section
        title="Antécédents hépato-bilio-pancréatiques"
        count={itemsLabel(ATCD_HEPATO, checked, "atcd:hepato").length}
        open={!!openSections['atcdHepato']}
        onToggle={() => toggleSection("atcdHepato")}
      >
        <ChipGroup options={effAtcdHepato.map((i) => i.label)} selected={(v) => isOn(`atcd:hepato:${v}`)} onToggle={(v) => toggle(`atcd:hepato:${v}`)} onAdd={(v) => { addCustom("atcd:hepato", v); toggle(`atcd:hepato:${v}`); }} />
      </Section>

      <Section
        title="Antécédents chirurgicaux"
        count={itemsLabel(ATCD_CHIR, checked, "atcd:chir").length}
        open={!!openSections['atcdChir']}
        onToggle={() => toggleSection("atcdChir")}
      >
        <ChipGroup options={effAtcdChir.map((i) => i.label)} selected={(v) => isOn(`atcd:chir:${v}`)} onToggle={(v) => toggle(`atcd:chir:${v}`)} onAdd={(v) => { addCustom("atcd:chir", v); toggle(`atcd:chir:${v}`); }} />
        <MiniField label="Détails (intervention – année – indication)">
          <input
            className={`${inputCls} py-1.5 text-xs`}
            placeholder="Ex. Cholécystectomie – 2019 – lithiase symptomatique"
            value={extra["chir:details"] ?? ""}
            onChange={(e) => setField("chir:details", e.target.value)}
          />
        </MiniField>
      </Section>

      <Section
        title="Antécédents familiaux"
        count={itemsLabel(ATCD_FAM, checked, "atcd:fam").length}
        open={!!openSections['atcdFam']}
        onToggle={() => toggleSection("atcdFam")}
      >
        <ChipGroup options={effAtcdFam.map((i) => i.label)} selected={(v) => isOn(`atcd:fam:${v}`)} onToggle={(v) => toggle(`atcd:fam:${v}`)} onAdd={(v) => { addCustom("atcd:fam", v); toggle(`atcd:fam:${v}`); }} />
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniField label="Parenté">
            <ChipGroup options={withCustom("parente", PARENTES)} selected={(v) => extra["fam:parente"] === v} onToggle={(v) => setField("fam:parente", extra["fam:parente"] === v ? "" : v)} onAdd={(v) => { addCustom("parente", v); setField("fam:parente", v); }} />
          </MiniField>
          <MiniField label="Âge au diagnostic">
            <input
              type="number"
              min={0}
              className={`${inputCls} num py-1.5 text-xs`}
              value={extra["fam:age"] ?? ""}
              onChange={(e) => setField("fam:age", e.target.value)}
            />
          </MiniField>
        </div>
      </Section>

      <Section title="Habitudes / facteurs de risque" open={!!openSections['hab']} onToggle={() => toggleSection("hab")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniField label="Tabac">
            <div className="flex items-center gap-2">
              <ChipGroup options={withCustom("hab:tabac", ["Non", "Oui"])} selected={(v) => extra["hab:tabac"] === v} onToggle={(v) => setField("hab:tabac", extra["hab:tabac"] === v ? "" : v)} onAdd={(v) => { addCustom("hab:tabac", v); setField("hab:tabac", v); }} />
              {extra["hab:tabac"] === "Oui" && (
                <input
                  className={`${inputCls} num w-24 py-1.5 text-xs`}
                  placeholder="PA"
                  value={extra["hab:tabacPA"] ?? ""}
                  onChange={(e) => setField("hab:tabacPA", e.target.value)}
                />
              )}
            </div>
          </MiniField>
          <MiniField label="Alcool">
            <div className="flex items-center gap-2">
              <ChipGroup options={withCustom("hab:alcool", ["Non", "Oui"])} selected={(v) => extra["hab:alcool"] === v} onToggle={(v) => setField("hab:alcool", extra["hab:alcool"] === v ? "" : v)} onAdd={(v) => { addCustom("hab:alcool", v); setField("hab:alcool", v); }} />
              {extra["hab:alcool"] === "Oui" && (
                <input
                  className={`${inputCls} num w-28 py-1.5 text-xs`}
                  placeholder="unités/j"
                  value={extra["hab:alcoolUnites"] ?? ""}
                  onChange={(e) => setField("hab:alcoolUnites", e.target.value)}
                />
              )}
            </div>
          </MiniField>
          <MiniField label="AINS">
            <ChipGroup options={withCustom("hab:ains", ["Non", "Oui"])} selected={(v) => extra["hab:ains"] === v} onToggle={(v) => setField("hab:ains", extra["hab:ains"] === v ? "" : v)} onAdd={(v) => { addCustom("hab:ains", v); setField("hab:ains", v); }} />
          </MiniField>
          <MiniField label="Cannabis / autres toxiques">
            <ChipGroup options={withCustom("hab:cannabis", ["Non", "Oui"])} selected={(v) => extra["hab:cannabis"] === v} onToggle={(v) => setField("hab:cannabis", extra["hab:cannabis"] === v ? "" : v)} onAdd={(v) => { addCustom("hab:cannabis", v); setField("hab:cannabis", v); }} />
          </MiniField>
        </div>
      </Section>

      <div className="flex justify-end">
        <GhostButton
          type="button"
          onClick={() => {
            setChecked({});
            setExtra({});
            setCustomOptions({});
          }}
        >
          Réinitialiser l'interrogatoire
        </GhostButton>
      </div>
    </div>
  );
}
