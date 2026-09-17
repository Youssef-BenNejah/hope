/** Config de l'interrogatoire structuré HGE (aide à la saisie) — voir GiInterviewForm. */

export interface SymptomItem {
  id: string;
  label: string;
}

export interface SymptomGroup {
  id: string;
  title: string;
  items: SymptomItem[];
}

const mk = (labels: string[]): SymptomItem[] => labels.map((label) => ({ id: label, label }));

export const RED_FLAGS: SymptomItem[] = mk([
  "Dysphagie / odynophagie",
  "Hématémèse",
  "Méléna",
  "Rectorragies importantes",
  "Anémie ferriprive",
  "Amaigrissement involontaire",
  "Vomissements persistants",
  "Masse abdominale",
  "Ictère",
  "Fièvre persistante",
  "Modification récente du transit",
  "Antécédent personnel de cancer digestif",
  "ATCD familial de CCR / cancer digestif précoce",
  "Saignement sous anticoagulant / AAP",
]);

export const SYMPTOM_GROUPS: SymptomGroup[] = [
  {
    id: "douleur",
    title: "Douleur abdominale",
    items: mk([
      "Épigastralgie",
      "Douleur HCD",
      "Douleur HCG",
      "Douleur péri-ombilicale",
      "Douleur FID",
      "Douleur FIG",
      "Douleur pelvienne",
      "Douleur diffuse",
      "Coliques abdominales",
    ]),
  },
  {
    id: "reflux",
    title: "Reflux / œsophage",
    items: mk([
      "Pyrosis",
      "Régurgitations acides",
      "Régurgitations alimentaires",
      "Douleur rétrosternale",
      "Dysphagie",
      "Odynophagie",
      "Globus pharyngé",
      "Toux chronique",
      "Dysphonie",
      "Symptômes nocturnes",
    ]),
  },
  {
    id: "estomac",
    title: "Estomac / duodénum",
    items: mk([
      "Dyspepsie",
      "Plénitude post-prandiale",
      "Satiété précoce",
      "Ballonnement post-prandial",
      "Nausées",
      "Vomissements",
      "Éructations",
      "Anorexie",
      "Hématémèse",
    ]),
  },
  {
    id: "transit",
    title: "Transit intestinal",
    items: mk([
      "Diarrhée aiguë",
      "Diarrhée chronique",
      "Constipation",
      "Alternance diarrhée/constipation",
      "Urgence défécatoire",
      "Ténesme",
      "Faux besoins",
      "Incontinence fécale",
      "Selles graisseuses / stéatorrhée",
    ]),
  },
  {
    id: "saignement",
    title: "Saignement digestif",
    items: mk([
      "Rectorragies",
      "Hématochézie",
      "Méléna",
      "Hématémèse",
      "Vomissements « marc de café »",
      "Anémie ferriprive",
    ]),
  },
  {
    id: "hepato",
    title: "Hépato-bilio-pancréatique",
    items: mk([
      "Ictère",
      "Prurit",
      "Urines foncées",
      "Selles décolorées",
      "Douleur biliaire",
      "Douleur transfixiante",
      "Ascite",
      "Œdèmes des membres inférieurs",
      "Encéphalopathie / troubles neurocognitifs",
    ]),
  },
  {
    id: "anorectal",
    title: "Symptômes anorectaux",
    items: mk([
      "Douleur anale",
      "Prurit anal",
      "Tuméfaction anale",
      "Prolapsus",
      "Écoulement purulent",
      "Fistule connue",
    ]),
  },
  {
    id: "generaux",
    title: "Signes généraux",
    items: mk(["Amaigrissement", "Anorexie", "Asthénie", "Fièvre", "Sueurs nocturnes", "Altération de l'état général"]),
  },
  {
    id: "extradigestif",
    title: "Signes extra-digestifs (MICI / cœliaque / hépatique)",
    items: mk([
      "Arthralgies",
      "Arthrite",
      "Lombalgies inflammatoires",
      "Érythème noueux",
      "Pyoderma gangrenosum",
      "Uvéite / épisclérite",
      "Aphtose buccale",
      "Lésions cutanées",
    ]),
  },
];

/** Cibles pouvant recevoir des éléments ajoutés par un médecin (extension d'un groupe existant). */
export const EXTENDABLE_GROUPS: { id: string; title: string }[] = [
  { id: "flags", title: "Red flags" },
  ...SYMPTOM_GROUPS.map((g) => ({ id: g.id, title: g.title })),
];

export const LOCALISATIONS = [
  "Épigastre",
  "HCD",
  "HCG",
  "FID",
  "FIG",
  "Hypogastre",
  "Péri-ombilicale",
  "Diffuse",
  "Pelvienne",
];
export const CARACTERISTIQUES = [
  "Brûlure",
  "Crampiforme / colique",
  "Pesanteur",
  "Piqûre",
  "Constrictive",
  "Transfixiante",
];
export const IRRADIATIONS = ["Dos", "Épaule droite", "Épaule gauche", "Thorax"];
export const RELATIONS_REPAS = ["À jeun", "Post-prandiale immédiate", "1–3 h après repas", "Nocturne", "Sans relation"];
export const FACTEURS_AGGRAVANTS = ["Repas", "Alcool", "Mouvement", "Position"];
export const FACTEURS_SOULAGEANTS = ["Repas", "Vomissement", "Selles", "Gaz", "IPP", "Antalgique"];
export const DEBUTS = ["< 1 semaine", "1–4 semaines", "1–6 mois", "> 6 mois"];
export const EVOLUTIONS = ["Aiguë", "Chronique", "Récidivante", "Progressive"];
export const BRISTOL = ["1", "2", "3", "4", "5", "6", "7"];

export const ATCD_MED: SymptomItem[] = mk([
  "HTA",
  "Diabète type 2",
  "Dyslipidémie",
  "Obésité",
  "Cardiopathie ischémique",
  "Insuffisance cardiaque",
  "Fibrillation atriale",
  "AVC / AIT",
  "TVP / EP",
  "Insuffisance rénale chronique",
  "BPCO",
  "Asthme",
  "Dysthyroïdie",
  "Maladie auto-immune",
  "Anémie",
  "Trouble de la coagulation",
  "Allergie médicamenteuse",
]);

export const ATCD_DIG: SymptomItem[] = mk([
  "RGO",
  "Œsophagite",
  "Hernie hiatale",
  "Ulcère gastro-duodénal",
  "Gastrite / gastropathie",
  "H. pylori",
  "MICI (Crohn / RCH)",
  "SII",
  "Diverticulose / diverticulite",
  "Polype(s) digestif(s)",
  "Cancer colorectal antérieur",
  "Hémorragie digestive",
  "Maladie cœliaque",
]);

export const ATCD_HEPATO: SymptomItem[] = mk([
  "Hépatite B",
  "Hépatite C",
  "Stéatose hépatique métabolique (MASLD)",
  "Hépatopathie chronique",
  "Cirrhose",
  "Hypertension portale",
  "Varices œsophagiennes",
  "Varices gastro-œsophagiennes",
  "Varices gastriques isolées",
  "Ascite",
  "Encéphalopathie hépatique",
  "Carcinome hépatocellulaire",
  "Lithiase vésiculaire",
  "Cholécystite",
  "Angiocholite",
  "Pancréatite aiguë",
  "Pancréatite chronique",
  "Tumeur pancréatique",
]);

export const ATCD_CHIR: SymptomItem[] = mk([
  "Appendicectomie",
  "Cholécystectomie",
  "Cure de hernie",
  "Chirurgie gastrique",
  "Chirurgie duodénale",
  "Chirurgie du grêle",
  "Colectomie",
  "Chirurgie rectale / anale",
  "Chirurgie hépatique",
  "Chirurgie biliaire",
  "Chirurgie pancréatique",
  "Chirurgie bariatrique",
]);

export const ATCD_FAM: SymptomItem[] = mk([
  "Cancer colorectal",
  "Cancer gastrique",
  "Cancer pancréatique",
  "Cancer hépatique",
  "Cancer biliaire",
  "MICI",
  "Polypose digestive",
  "Syndrome de Lynch",
  "Maladie cœliaque",
  "Pancréatite héréditaire",
]);

export const PARENTES = ["Père", "Mère", "Frère/Sœur", "Enfant", "Autre"];
