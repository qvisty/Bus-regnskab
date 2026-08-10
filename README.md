# Fælles buskørsel – HE · HD · EE

Vue-webapp til planlægning og afregning af fælles weekendkørsel mellem skolerne
**HE, HD og EE**. Konverteret fra regnearket `Fælles_buskørsel.xlsx`.

Appen har fire sider:

| Side             | Svarer til Excel-fane | Indhold |
|------------------|-----------------------|---------|
| **Oversigt**     | (ny)                  | Nøgletal for sæsonen, afregning pr. periode i kort form, kommende behov og advarsler om manglende overførsler. |
| **Planlægning**  | Planlægning           | Én række pr. dato med filtre og CSV-eksport. Sæt behov (HE/HD/EE) og antal billetter. Fælles kørsel, busudgift, indtægt og overskud beregnes automatisk. |
| **Afregning**    | Afregning             | Pr. periode (kalenderår/skoleår): kontoudtog pr. skole, "går i nul"-bekræftelse og mulighed for at markere en periode afregnet. Løbende overførsler udledes af overførselsdatoerne på Planlægning. |
| **Statistik**    | (ny)                  | Visualisering af udgift/indtægt/overskud pr. uge, måned og år, samt en billetpris-anbefaling hvis sæsonen tegner til underskud. |
| **Aftaler**      | Aftaler               | Spillereglerne for samarbejdet. |

## Beregningsregler (samme som regnearket)

- **Fælles kørsel** = "Ja" når mere end én skole har behov samme dag.
- **Busstørrelse** vælges automatisk som den mindste bus med plads til dagens
  samlede antal billetter:

  | Bus           | Pladser | Pris pr. km | Pris pr. tur (standard) |
  |---------------|--------:|------------:|------------------------:|
  | Lille bus     | 19      | 10 kr.      | 2.430 kr.               |
  | Stor bus      | 57      | 18 kr.      | 4.375 kr.               |
  | Dobbeltdækker | 83      | 20 kr.      | 4.866 kr.               |

- **Busudgift** = den valgte busstørrelses pris pr. tur på dage med fælles
  kørsel, ellers 0. Overstiger billettallet 83, markeres dagen som overbooket.
- **Indtægt** = antal billetter × pris pr. billet (standard 65 kr.).
  Billetprisen er den samme uanset busstørrelse.
- **Overskud** = indtægt − busudgift.
- **Samlet pris (periode)** = udgifter − indtægter (negativ = overskud), delt med 3.
- **Afregning ved periodeslut** = pris pr. skole − allerede løbende overført.
- Alle satser rettes ét sted øverst på Planlægning-siden.

## Datalagring

Appen virker i to tilstande:

- **Lokal tilstand** (standard, ingen opsætning): data gemmes i browserens
  `localStorage`. God til at prøve appen.
- **Delt tilstand (Supabase)**: data deles mellem alle tre skoler i realtid.
  Aktiveres ved at sætte miljøvariablerne nedenfor.

Den aktive tilstand vises som et badge øverst til højre.

## Adgangskode

Appen er låst bag en fælles adgangskode, som indtastes på forsiden. Adgangen
huskes i browseren, og "Log ud"-knappen i menuen låser igen. Koden gemmes kun
som SHA-256-hash i `src/lib/auth.ts` – skal koden skiftes, udskiftes hashen
dér. Bemærk: låsen er klient-side og holder uvedkommende ude af appen, men er
ikke et egentligt sikkerhedsværn mod tekniske angreb.

## Kom i gang lokalt

```bash
npm install
npm run dev      # udviklingsserver
npm test         # kør testpakken (Vitest)
npm run build    # produktion (typecheck + build)
```

Åbn adressen Vite udskriver (typisk http://localhost:5173).

Regnelogikken er dækket af tests i `src/lib/*.test.ts`, bl.a. en kontrol af
at ISO-ugenumre matcher regnearkets `ISOWEEKNUM`-værdier 1:1.

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

## GitHub Pages

Workflowet [`.github/workflows/deploy-demo.yml`](.github/workflows/deploy-demo.yml)
bygger og udgiver appen automatisk til GitHub Pages ved hvert push til `main`:

- Er repo-secrets **`VITE_SUPABASE_URL`** og **`VITE_SUPABASE_ANON_KEY`** sat
  (*Settings → Secrets and variables → Actions*), bygges den **rigtige udgave
  med delt data** i Supabase ("● Delt"-badge).
- Mangler de, bygges en selvstændig **demo-udgave** i stedet (al data i
  browserens localStorage, "◐ Demo"-badge og en nulstil-knap).

Builden bruger relative stier, så den kan ligge under et underbibliotek.
Demo-udgaven kan også bygges manuelt med `npm run build:demo`.

**Engangsopsætning:** I repoets *Settings → Pages* sættes **Source** til
**GitHub Actions**.

## Teknologi

Vue 3 · TypeScript · Vite · Vue Router · Supabase JS. Ingen øvrige
runtime-afhængigheder.
