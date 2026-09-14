const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%";

export function randomPassword(length = 10): string {
  const pool = UPPER + LOWER + DIGITS;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)] as string;
  let pw = pick(UPPER) + pick(LOWER) + pick(DIGITS) + pick(SYMBOLS);
  while (pw.length < length) pw += pick(pool);
  return pw
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function buildCredentialsEmail(doc: { name: string; email: string }, password: string, cabinetName: string) {
  return {
    to: doc.email,
    subject: `Vos identifiants de connexion — ${cabinetName}`,
    body: `Bonjour ${doc.name},

Voici vos identifiants de connexion à l'espace Cabinet :

Email : ${doc.email}
Mot de passe : ${password}

Merci de conserver ce message en lieu sûr et de modifier ce mot de passe après votre première connexion (Paramètres > Sécurité).

${cabinetName}`,
  };
}
