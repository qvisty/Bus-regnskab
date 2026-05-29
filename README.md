# Fælles buskørsel – HE · HD · EE

Vue-webapp til planlægning og afregning af fælles weekendkørsel mellem skolerne
**HE, HD og EE**. Konverteret fra regnearket `Fælles_buskørsel.xlsx`.

Appen har tre sider, der svarer til regnearkets faner:

| Side             | Svarer til Excel-fane | Indhold |
|------------------|-----------------------|---------|
| **Planlægning**  | Planlægning           | Én række pr. dato. Sæt behov (HE/HD/EE) og antal billetter. Fælles kørsel, busudgift, indtægt og overskud beregnes automatisk. |
| **Afregning**    | Afregning             | Pr. periode (kalenderår/skoleår): udgifter − indtægter delt på tre skoler, justeret for løbende overførsler. |
| **Aftaler**      | Aftaler               | Spillereglerne for samarbejdet. |

## Beregningsregler (samme som regnearket)

- **Fælles kørsel** = "Ja" når mere end én skole har behov samme dag.
- **Busudgift** = pris pr. kørsel (standard 3.000 kr.) på dage med fælles kørsel, ellers 0.
- **Indtægt** = antal billetter × pris pr. billet (standard 65 kr.).
- **Overskud** = indtægt − busudgift.
- **Samlet pris (periode)** = udgifter − indtægter (negativ = overskud), delt med 3.
- **Afregning ved periodeslut** = pris pr. skole − allerede løbende overført.
- Begge satser rettes ét sted øverst på Planlægning-siden.

## Datalagring

Appen virker i to tilstande:

- **Lokal tilstand** (standard, ingen opsætning): data gemmes i browserens
  `localStorage`. God til at prøve appen.
- **Delt tilstand (Supabase)**: data deles mellem alle tre skoler i realtid.
  Aktiveres ved at sætte miljøvariablerne nedenfor.

Den aktive tilstand vises som et badge øverst til højre.

## Kom i gang lokalt

```bash
npm install
npm run dev
```

Åbn adressen Vite udskriver (typisk http://localhost:5173).

## Aktivér delt data (Supabase)

1. Opret et gratis projekt på [supabase.com](https://supabase.com).
2. Kør indholdet af [`supabase/schema.sql`](supabase/schema.sql) i
   **SQL Editor**.
3. Kopiér **Project URL** og **anon public key** fra *Project Settings → API*.
4. Lav en `.env`-fil (se `.env.example`):

   ```
   VITE_SUPABASE_URL=https://dit-projekt.supabase.co
   VITE_SUPABASE_ANON_KEY=din-anon-noegle
   ```

Første gang appen indlæses med Supabase konfigureret, fyldes tabellerne
automatisk med datoerne for skoleåret 2026/2027 og standardperioderne.

## Deploy til Vercel

Projektet indeholder `vercel.json` og bygger som en almindelig Vite/Vue-SPA.

1. Importér repoet i Vercel (framework registreres som **Vite**).
2. Tilføj evt. `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY` som
   *Environment Variables* for delt data.
3. Deploy. Build-kommando: `npm run build`, output: `dist`.

## Teknologi

Vue 3 · TypeScript · Vite · Vue Router · Supabase JS. Ingen øvrige
runtime-afhængigheder.
