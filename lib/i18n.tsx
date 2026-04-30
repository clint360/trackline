"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "fr";

// Minimal but complete translation table for user-facing surfaces.
const T = {
  // Brand / common
  brand_tagline: { en: "Cameroon · Bus Booking", fr: "Cameroun · Réservation de Bus" },
  back: { en: "Back", fr: "Retour" },
  cancel: { en: "Cancel", fr: "Annuler" },
  continue: { en: "Continue", fr: "Continuer" },
  total: { en: "Total", fr: "Total" },
  loading: { en: "Loading…", fr: "Chargement…" },
  search: { en: "Search", fr: "Rechercher" },
  add: { en: "Add", fr: "Ajouter" },
  remove: { en: "Remove", fr: "Supprimer" },
  edit: { en: "Edit", fr: "Modifier" },
  save: { en: "Save", fr: "Enregistrer" },

  // Stepper
  step_route: { en: "Route", fr: "Trajet" },
  step_trip: { en: "Trip", fr: "Voyage" },
  step_seat: { en: "Seat", fr: "Place" },
  step_passenger: { en: "Passenger", fr: "Passager" },
  step_payment: { en: "Payment", fr: "Paiement" },
  step_ticket: { en: "Ticket", fr: "Billet" },

  // Step 1 — route
  where_to_next: { en: "Where to next?", fr: "Où allez-vous ?" },
  compare_subtitle: {
    en: "Compare schedules and book in seconds.",
    fr: "Comparez les horaires et réservez en quelques secondes.",
  },
  from: { en: "From", fr: "Départ" },
  to: { en: "To", fr: "Arrivée" },
  travel_date: { en: "Travel Date", fr: "Date du voyage" },
  search_trips: { en: "Search trips", fr: "Rechercher" },
  swap_cities: { en: "Swap cities", fr: "Inverser" },
  same_city: { en: "Departure and arrival cannot be the same", fr: "Le départ et l’arrivée ne peuvent pas être identiques" },

  // Hero
  hero_badge: { en: "New · Instant booking", fr: "Nouveau · Réservation instantanée" },
  hero_title: {
    en: "Travel between Yaounde, Douala, Bamenda and Buea",
    fr: "Voyagez entre Yaoundé, Douala, Bamenda et Buea",
  },
  hero_subtitle: {
    en: "Real-time seat availability across leading agencies.",
    fr: "Disponibilité des places en temps réel chez les principales agences.",
  },
  agencies: { en: "Agencies", fr: "Agences" },
  daily_trips: { en: "Daily trips", fr: "Voyages/jour" },
  avg_wait: { en: "Avg. wait", fr: "Attente moy." },
  secure_pay: { en: "Secure pay", fr: "Paiement sûr" },
  encrypted_checkout: {
    en: "Encrypted mobile-money checkout",
    fr: "Paiement mobile-money chiffré",
  },

  // Step 2 — trip
  no_trips: {
    en: "No trips found for that route and date.",
    fr: "Aucun voyage trouvé pour cet itinéraire.",
  },
  seats_left: { en: "seats left", fr: "places restantes" },
  almost_full: { en: "Almost full", fr: "Presque plein" },
  fast_filling: { en: "Fast filling", fr: "Se remplit vite" },
  available: { en: "Available", fr: "Disponible" },
  drops_off_at: { en: "Drops off at", fr: "Arrêt à" },
  city_center: { en: "City center", fr: "Centre-ville" },

  // Step 3 — seat
  seats_available: { en: "seats available", fr: "places disponibles" },
  trip_summary: { en: "Trip summary", fr: "Résumé du voyage" },
  agency: { en: "Agency", fr: "Agence" },
  route: { en: "Route", fr: "Itinéraire" },
  date_label: { en: "Date", fr: "Date" },
  departure: { en: "Departure", fr: "Départ" },
  class: { en: "Class", fr: "Classe" },
  seat_label: { en: "Seat", fr: "Place" },
  drop_off: { en: "Drop-off", fr: "Arrêt" },
  select_seat_first: {
    en: "Select a seat to continue.",
    fr: "Sélectionnez une place pour continuer.",
  },
  change_seat_anytime: {
    en: "You can change your seat at any time before payment.",
    fr: "Vous pouvez changer de place à tout moment avant le paiement.",
  },
  legend_available: { en: "Available", fr: "Disponible" },
  legend_selected: { en: "Selected", fr: "Sélectionnée" },
  legend_taken: { en: "Taken", fr: "Occupée" },
  front_of_bus: { en: "Front of bus", fr: "Avant du bus" },

  // Step 4 — passenger
  passenger_details: { en: "Passenger details", fr: "Détails du passager" },
  print_on_ticket: {
    en: "We'll print this on your boarding pass.",
    fr: "Ces informations apparaîtront sur votre billet.",
  },
  full_name: { en: "Full name", fr: "Nom complet" },
  phone_number: { en: "Phone number", fr: "Téléphone" },
  cm_phone_hint: {
    en: "Used for booking confirmation. Cameroon format e.g. 6XX XXX XXX.",
    fr: "Utilisé pour la confirmation. Format Cameroun, ex. 6XX XXX XXX.",
  },
  continue_to_payment: { en: "Continue to payment", fr: "Continuer vers le paiement" },
  email_optional: { en: "Email (optional)", fr: "Email (facultatif)" },
  email_hint: {
    en: "We'll send a digital copy of your ticket here.",
    fr: "Nous enverrons une copie de votre billet à cette adresse.",
  },

  // Step 5 — payment
  payment: { en: "Payment", fr: "Paiement" },
  payment_subtitle: {
    en: "Mobile-money payment, instant confirmation.",
    fr: "Paiement mobile-money, confirmation instantanée.",
  },
  pay_with_mtn: { en: "Pay with MTN Mobile Money", fr: "Payer avec MTN Mobile Money" },
  pay_with_orange: { en: "Pay with Orange Money", fr: "Payer avec Orange Money" },
  mobile_money_phone: { en: "Mobile-money phone", fr: "Téléphone mobile-money" },
  pay: { en: "Pay", fr: "Payer" },
  processing: { en: "Processing payment…", fr: "Paiement en cours…" },
  encrypted_note: {
    en: "256-bit encrypted, no card stored.",
    fr: "Chiffrement 256 bits, aucune carte conservée.",
  },
  order_summary: { en: "Order summary", fr: "Récapitulatif" },
  passenger: { en: "Passenger", fr: "Passager" },
  payment_declined: { en: "Payment declined", fr: "Paiement refusé" },
  payment_confirmed: { en: "Payment confirmed", fr: "Paiement confirmé" },
  choose_payment: { en: "Choose a payment method", fr: "Choisissez un mode de paiement" },

  // Fapshi flow
  follow_instructions: {
    en: "Check your phone",
    fr: "Vérifiez votre téléphone",
  },
  follow_instructions_body: {
    en: "We've sent a payment request to your mobile money. Approve the prompt on your phone with your secret code to complete the payment.",
    fr: "Nous avons envoyé une demande de paiement sur votre mobile money. Approuvez la demande sur votre téléphone avec votre code secret pour finaliser.",
  },
  do_not_close: {
    en: "Don't close this page — we're waiting for confirmation.",
    fr: "Ne fermez pas cette page — nous attendons la confirmation.",
  },
  amount_to_pay: { en: "Amount to pay", fr: "Montant à payer" },
  ref: { en: "Reference", fr: "Référence" },
  status_checking: { en: "Checking your transaction…", fr: "Vérification de votre transaction…" },
  status_pending: { en: "Waiting for you to approve on your phone…", fr: "En attente de votre approbation sur le téléphone…" },
  status_almost: { en: "Almost there…", fr: "Presque terminé…" },
  status_confirming: { en: "Confirming with the operator…", fr: "Confirmation auprès de l’opérateur…" },
  payment_failed_title: { en: "Payment failed", fr: "Paiement échoué" },
  payment_failed_body: {
    en: "Your payment couldn't be completed. You can try again or use a different number.",
    fr: "Votre paiement n'a pas pu être finalisé. Réessayez ou utilisez un autre numéro.",
  },
  payment_expired: {
    en: "The payment request expired. Please try again.",
    fr: "La demande de paiement a expiré. Veuillez réessayer.",
  },
  try_again: { en: "Try again", fr: "Réessayer" },
  resume_payment: {
    en: "Resuming your previous payment…",
    fr: "Reprise de votre paiement précédent…",
  },

  // Step 6 — ticket
  booking_confirmed: { en: "Booking confirmed", fr: "Réservation confirmée" },
  ticket_ready: { en: "Your ticket is ready 🎉", fr: "Votre billet est prêt 🎉" },
  sms_copy: {
    en: "A copy was also sent via SMS to your phone.",
    fr: "Une copie a été envoyée par SMS à votre téléphone.",
  },
  download_png: { en: "Download PNG", fr: "Télécharger PNG" },
  download_pdf: { en: "Download PDF", fr: "Télécharger PDF" },
  book_another: { en: "Book another trip", fr: "Réserver un autre voyage" },
  lookup_link: { en: "Lookup link", fr: "Lien de vérification" },
  png_downloaded: { en: "PNG downloaded", fr: "PNG téléchargé" },
  pdf_downloaded: { en: "PDF downloaded", fr: "PDF téléchargé" },
  export_failed_png: { en: "Could not export PNG", fr: "Échec de l’export PNG" },
  export_failed_pdf: { en: "Could not export PDF", fr: "Échec de l’export PDF" },

  // Ticket card
  boarding_pass: { en: "Trackline Boarding Pass", fr: "Carte d’embarquement Trackline" },
  consignment_no: { en: "Consignment №", fr: "Référence №" },
  amount: { en: "Amount", fr: "Montant" },
  ticket_footer: {
    en: "Present this ticket and a valid ID at boarding. Powered by Trackline.",
    fr: "Présentez ce billet et une pièce d'identité valide à l'embarquement.",
  },

  // WhatsApp
  whatsapp_help: { en: "Need help?", fr: "Besoin d’aide ?" },
  whatsapp_message: {
    en: "Hello, I need help booking a trip",
    fr: "Bonjour, j'ai besoin d'aide pour réserver un voyage",
  },

  // Operator nav
  operator_dashboard: { en: "Operator dashboard →", fr: "Espace opérateur →" },

  // Check ticket modal
  check_ticket: { en: "Check ticket", fr: "Vérifier le billet" },
  check_ticket_title: {
    en: "Find your ticket",
    fr: "Retrouvez votre billet",
  },
  check_ticket_body: {
    en: "Enter the consignment number from your boarding pass.",
    fr: "Entrez le numéro de référence figurant sur votre billet.",
  },
  check_ticket_hint: {
    en: "Format: TRP-XXX-YYY-XXXXXXXX",
    fr: "Format : TRP-XXX-YYY-XXXXXXXX",
  },
  ticket_lookup_required: {
    en: "Enter a consignment number",
    fr: "Saisissez un numéro de référence",
  },
  ticket_not_found: {
    en: "We couldn't find that ticket. Double-check the number.",
    fr: "Billet introuvable. Vérifiez le numéro.",
  },
  find_ticket: { en: "Find my ticket", fr: "Trouver mon billet" },
  checking: { en: "Checking…", fr: "Vérification…" },
};

type Key = keyof typeof T;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

const STORAGE_KEY = "trackline:lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "en" || saved === "fr") setLangState(saved);
    else if (typeof navigator !== "undefined" && navigator.language?.startsWith("fr")) {
      setLangState("fr");
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: Key) => T[key]?.[lang] ?? (T[key] as any)?.en ?? key;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}
