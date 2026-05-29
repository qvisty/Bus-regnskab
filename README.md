# Fælles buskørsel – HE · HD · EE

Vue-webapp til planlægning og afregning af fælles weekendkørsel mellem skolerne
**HE, HD og EE**. Konverteret fra regnearket `Fælles_buskørsel.xlsx`.

Appen har fire sider:

| Side             | Svarer til Excel-fane | Indhold |
|------------------|-----------------------|---------|
| **Oversigt**     | (ny)                  | Nøgletal for sæsonen, afregning pr. periode i kort form, kommende behov og advarsler om manglende overførsler. |
| **Planlægning**  | Planlægning           | Én række pr. dato med filtre og CSV-eksport. Sæt behov (HE/HD/EE) og antal billetter. Fælles kørsel, busudgift, indtægt og overskud beregnes automatisk. |
| **Afregning**    | Afregning             | Pr. periode (kalenderår/skoleår): udgifter − indtægter delt på tre skoler, med visuel "hvem betaler hvem". |
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

## Deploy til Vercel (git-integration)

Projektet indeholder `vercel.json` og bygger som en almindelig Vite/Vue-SPA.

1. Gå til [vercel.com/new](https://vercel.com/new) og importér GitHub-repoet
   `qvisty/Bus-regnskab` (framework registreres automatisk som **Vite**).
2. Tilføj evt. `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY` under
   *Environment Variables* for delt data (uden dem kører appen i lokal tilstand).
3. Klik **Deploy**. Herefter deployes der automatisk ved hvert push.

Build-kommando: `npm run build`, output-mappe: `dist`.

## Statisk demo på GitHub Pages

En selvstændig demo-udgave (uden backend – al data ligger i browserens
localStorage) bygges med:

```bash
npm run build:demo
```

Den bruger hash-routing og relative stier, så den kan ligge under et
underbibliotek. Workflowet [`.github/workflows/deploy-demo.yml`](.github/workflows/deploy-demo.yml)
bygger og udgiver den automatisk til GitHub Pages.

**Engangsopsætning:** I repoets *Settings → Pages* sættes **Source** til
**GitHub Actions**. Demoen vises derefter med et tydeligt "Demo"-badge og en
knap til at nulstille data – ændringer deles ikke og påvirker ikke produktion.

## Teknologi

Vue 3 · TypeScript · Vite · Vue Router · Supabase JS. Ingen øvrige
runtime-afhængigheder.
