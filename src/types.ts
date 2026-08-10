/** Skolerne der deler weekendkørslen. */
export type School = 'HE' | 'HD' | 'EE'

/** Én planlægningsdag – svarer til én række i fanen "Planlægning". */
export interface PlanningDay {
  /** ISO-dato, fx "2026-08-09". Bruges som unik nøgle. */
  date: string
  he_need: boolean
  hd_need: boolean
  ee_need: boolean
  he_tickets: number
  hd_tickets: number
  ee_tickets: number
  note: string
  /** Dato hvor HD overførte sin andel (ISO-dato eller null). */
  hd_transferred_date: string | null
  /** Dato hvor EE overførte sin andel (ISO-dato eller null). */
  ee_transferred_date: string | null
}

/**
 * Globale satser. Billetprisen er den samme uanset busstørrelse og rettes
 * ét sted. Busprisen er pr. tur og afhænger af den bestilte busstørrelse.
 */
export interface Settings {
  ticket_price: number
  /** Pris pr. tur – lille bus (19 personer). */
  bus_price_small: number
  /** Pris pr. tur – stor bus (57 personer). */
  bus_price_large: number
  /** Pris pr. tur – dobbeltdækker (83 sæder). */
  bus_price_double: number
}

/** En afregningsperiode – svarer til en kolonne i fanen "Afregning". */
export interface Period {
  id: string
  name: string
  start_date: string
  end_date: string
  /** Dato hvor perioden blev markeret afregnet ("gjort op til nul"), ellers null. */
  settled_at: string | null
}
