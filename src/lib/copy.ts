export const LOCALES = ["fi", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fi";

type Pair<T> = { fi: T; en: T };

const messages = {
  tagline: {
    fi: "Find a hoop. Go out and play.",
    en: "Find a hoop. Go out and play.",
  },
  metaDescription: {
    fi: "Ulkokoripallokentät Suomessa. Tehty nuorille pelaajille.",
    en: "Outdoor basketball courts in Finland, built for junior players.",
  },
  unnamedCourt: {
    fi: "Koripallokenttä",
    en: "Basketball court",
  },
  backToMap: { fi: "Takaisin kartalle", en: "Back to the map" },
  dataFrom: { fi: "Tiedot haettu", en: "Data updated" },
  beta: { fi: "Beta", en: "Beta" },
  betaTooltip: {
    fi: "Varhainen beta-versio, ei vielä valmis, tulee muuttumaan ja saattaa bugittaa.",
    en: "Early beta preview, functionalities might change and new features are coming, might be buggy.",
  },
  language: { fi: "Kieli", en: "Language" },
  madeWith: { fi: 'Made with', en: "Made with" },
  love: { fi: "love", en: "love" },
  courtDataFrom: {
    fi: "Kenttätiedot lähteistä",
    en: "Court data from",
  },
  sourceListAnd: { fi: " ja ", en: " and " },
  sourceCodeOn: { fi: "Lähdekoodi", en: "Source code" },
  searchLabel: { fi: "Etsi kaupunkia tai aluetta", en: "Search a city or neighborhood" },
  searchPlaceholder: {
    fi: "Kaupunki, alue tai osoite",
    en: "City, neighborhood or address",
  },
  searchInstructions: {
    fi: "Etsi hakusanalla tai paina 'Paikanna' löytääkseen kentät lähistöllä.",
    en: "Use the search or tap 'Near me' to find hoops nearby.",
  },
  nearMe: {
    idle: { fi: "Paikanna", en: "Near me" },
    pending: { fi: "Paikannetaan…", en: "Locating…" },
    granted: { fi: "Sijaintisi", en: "Near you" },
    denied: { fi: "Sijainti estetty", en: "Location blocked" },
    unavailable: { fi: "Ei GPS:ää", en: "No GPS" },
  },
  emptyTitle: { fi: "Airball", en: "Airball" },
  emptyHint: {
    fi: "Ei osumia. Kokeile toista hakusanaa.",
    en: "No hoops match. Try another search term.",
  },
  addressMissing: {
    fi: "Osoitetta ei ilmoitettu",
    en: "Address not reported",
  },
  lights: { fi: "Valot", en: "Lights" },
  freeUse: { fi: "Ilmainen käyttö", en: "Free use" },
  letsGo: { fi: "Mennään", en: "Let's go" },
  close: { fi: "Sulje", en: "Close" },
  distanceAway: {
    fi: (formatted: string) => `${formatted} päässä`,
    en: (formatted: string) => `${formatted} away`,
  },
  courtKind: { fi: "Koripallokenttä", en: "Basketball court" },
  courtKindFrom: {
    fi: (source: string) => `Koripallokenttä · ${source}`,
    en: (source: string) => `Basketball court · ${source}`,
  },
  status: { fi: "Tila", en: "Status" },
  address: { fi: "Osoite", en: "Address" },
  listing: { fi: "Kohde", en: "Listing" },
  viewListing: { fi: "Näytä kohde", en: "View listing" },
  website: { fi: "Verkkosivu", en: "Website" },
  administrator: { fi: "Ylläpitäjä", en: "Administrator" },
  owner: { fi: "Omistaja", en: "Owner" },
  built: { fi: "Rakennettu", en: "Built" },
  courtFacts: { fi: "Kentän tiedot", en: "Court scouting" },
  schoolUse: { fi: "Koulukäyttö", en: "School use" },
  fieldType: { fi: "Kenttätyyppi", en: "Field type" },
  surface: { fi: "Pinta", en: "Surface" },
  surfaceNotes: { fi: "Pintatiedot", en: "Surface notes" },
  dimensions: { fi: "Mitat", en: "Dimensions" },
  area: { fi: "Pinta-ala", en: "Area" },
  toilet: { fi: "WC", en: "Toilet" },
  adjustableRim: { fi: "Säädettävä kori", en: "Adjustable rim" },
  lightingNotes: { fi: "Valaistustiedot", en: "Lighting notes" },
  waterPoint: { fi: "Vesipiste", en: "Water point" },
  matchClock: { fi: "Pelikello", en: "Match clock" },
  scoreboard: { fi: "Tulostaulu", en: "Scoreboard" },
  notesFrom: {
    fi: (source: string) => `Lisätiedot (${source})`,
    en: (source: string) => `Notes from ${source}`,
  },
  notesFromListing: { fi: "Lisätiedot", en: "Notes" },
  yes: { fi: "Kyllä", en: "Yes" },
  no: { fi: "Ei", en: "No" },
  notReported: { fi: "Ei ilmoitettu", en: "Not reported" },
  statusOpen: { fi: "Avoinna", en: "Open" },
  statusTemporarilyClosed: {
    fi: "Tilapäisesti kiinni",
    en: "Temporarily closed",
  },
  statusPermanentlyClosed: {
    fi: "Poistettu käytöstä",
    en: "Permanently closed",
  },
  statusUnknown: { fi: "Ei tiedossa", en: "Unknown" },
  surfaces: {
    asphalt: { fi: "Asfaltti", en: "Asphalt" },
    concrete: { fi: "Betoni", en: "Concrete" },
    synthetic: { fi: "Synteettinen", en: "Synthetic" },
    "artificial-turf": { fi: "Tekonurmi", en: "Artificial turf" },
    "sand-infilled-artificial-turf": {
      fi: "Hiekkatekonurmi",
      en: "Sand-infilled turf",
    },
    sand: { fi: "Hiekka", en: "Sand" },
    stone: { fi: "Kivi", en: "Stone" },
    "rock-dust": { fi: "Kivituhka", en: "Rock dust" },
    gravel: { fi: "Sora", en: "Gravel" },
  } satisfies Record<string, Pair<string>>,
  courtCount: {
    fi: (count: number) => {
      const noun = count === 1 ? "kenttä" : "kenttää";
      return `${count} ${noun} kartalla`;
    },
    en: (count: number) => {
      const noun = count === 1 ? "hoop" : "hoops";
      return `${count} ${noun} on the map`;
    },
  },
  errorTitle: { fi: "Aikalisä", en: "Timeout" },
  errorHint: {
    fi: "Jokin meni pieleen. Yritä uudelleen.",
    en: "The app missed this shot. Try again without leaving the page.",
  },
  tryAgain: { fi: "Yritä uudelleen", en: "Try again" },
  notFoundTitle: { fi: "Huti", en: "Airball" },
  notFoundHint: {
    fi: "Tätä kenttää ei löydy.",
    en: "This hoop is missing, or the id is invalid.",
  },
  backToHoops: { fi: "Takaisin kentille", en: "Back to hoops" },
  courtNotFound: { fi: "Kenttää ei löydy", en: "Court not found" },
};

type Resolve<T> = T extends Pair<infer U>
  ? U
  : T extends object
    ? { [K in keyof T]: Resolve<T[K]> }
    : T;

export type Copy = Resolve<typeof messages> & { locale: Locale };

function isPair(value: unknown): value is Pair<unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    Object.keys(value).length === 2 &&
    "fi" in value &&
    "en" in value
  );
}

function resolveMessages(node: unknown, locale: Locale): unknown {
  if (isPair(node)) return node[locale];
  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [
        key,
        resolveMessages(value, locale),
      ]),
    );
  }
  return node;
}

export function getCopy(locale: Locale = DEFAULT_LOCALE): Copy {
  return {
    locale,
    ...(resolveMessages(messages, locale) as Resolve<typeof messages>),
  };
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "fi" || value === "en";
}
