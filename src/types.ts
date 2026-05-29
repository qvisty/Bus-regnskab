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

/** Globale satser – svarer til "Pris pr. kørsel" og "Pris pr. billet". */
export interface Settings {
  bus_price: number
  ticket_price: number
}

/** En afregningsperiode – svarer til en kolonne i fanen "Afregning". */
export interface Period {
  id: string
  name: string
  start_date: string
  end_date: string
}
