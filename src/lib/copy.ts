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
    fi: "Löydä ulkokoripallokentät Suomesta. Etsi kaupungilla, alueella tai sijainnilla ja ota pallo mukaan.",
    en: "Find outdoor basketball courts in Finland. Search by city, neighborhood or your location — then go hoop.",
  },
  metaDescriptionCount: {
    fi: (count: number) =>
      `Löydä ulkokoripallokentät Suomesta. ${count} kenttää kartalla — etsi kaupungilla, alueella tai sijainnilla.`,
    en: (count: number) =>
      `Find outdoor basketball courts in Finland. ${count} hoops on the map — search by city, neighborhood or location.`,
  },
  metaOgImageAlt: {
    fi: "Hoop Finder — ulkokoripallokentät Suomessa",
    en: "Hoop Finder — outdoor basketball courts in Finland",
  },
  metaCourtDescription: {
    fi: (name: string, place: string) =>
      `${name} — ${place}. Ulkokoripallokenttä Suomessa. Löydä kartalta Hoop Finderista.`,
    en: (name: string, place: string) =>
      `${name} — ${place}. Outdoor basketball court in Finland. Find it on the Hoop Finder map.`,
  },
  unnamedCourt: {
    fi: "Koripallokenttä",
    en: "Basketball court",
  },
  backToMap: { fi: "Takaisin kartalle", en: "Back to the map" },
  dataFrom: { fi: "Kenttädata päivitetty:", en: "Court data updated:" },
  dataFromSource: { fi: "Rajapintatieto", en: "API information" },
  source: { fi: "Lähde", en: "Source" },
  dataFetchedAt: { fi: "Tiedot haettu", en: "Data fetched" },
  betaTooltip: {
    fi: "Varhainen beta-versio. Ei valmis, saattaa sisältää bugeja.",
    en: "Early beta preview. Not ready yet, might contain bugs.",
  },
  language: { fi: "Language", en: "Language" },
  menu: { fi: "Valikko", en: "Menu" },
  info: { fi: "Info", en: "Info" },
  introTitle: { fi: "Ota pallo mukaan", en: "Bring a ball along" },
  introLead: {
    fi: "Hoop Finderista löytyy {count} ulkokoripallokenttää Suomesta. Olit sitten reissussa, mökillä, sukulaisten luona tai haluat löytää uuden kentän kodin läheltä — täältä löydät paikan heittää.",
    en: "Hoop Finder has {count} outdoor basketball courts in Finland. Whether you're on a trip, at the cottage, visiting relatives or want to find a new court close to home — here you can find a place to hoop.",
  },
  introLocationBenefit: {
    fi: "Salli sijaintisi, niin näet kuinka kaukana kukin kenttä sijaitsee.",
    en: "Allow your location to see the distance to each court.",
  },
  introLocationOptional: {
    fi: "Voit toki käyttää palvelua ilman sijainnin jakamistakin.",
    en: "You can of course use the service without sharing your location.",
  },
  introLocationGranted: {
    fi: "Olet sallinut sijainnin jakamisen, etäisyys kentille näytetään palvelussa.",
    en: "You have allowed location information, distance to each court is shown for you.",
  },
  introCreatedByTitle: {
    fi: "Kuka tämän teki ja miksi",
    en: "Who built this and why"
  },
  introCreatedBy1: {
    fi: "koodaili sivuston harrasteprojektina käyttäen Lipas ja OpenStreetMaps avoimia rajapintoja.",
    en: "built this site as a side project using the open APIs of Lipas and OpenStreetMaps.",
  },
  introCreatedBy2: {
    fi: "Motivaationa saada isot ja pienet ihmiset liikkumaan koripallon kanssa.",
    en: "With a motivation to get big and small humans to move more with a basketball." 
  },
  introCreatedBySourceCode: {
    fi: "Lähdekoodi löytyy Githubista",
    en: "Source code is on Github"
  },
  introSupport: { fi: "Tue kehittäjää", en: "Support the developer" },
  introCta: { fi: "ok bro", en: "ok bro" },
  madeWith: { fi: 'Made with', en: "Made with" },
  love: { fi: "love", en: "love" },
  courtDataFrom: {
    fi: "Kenttätiedot lähteistä",
    en: "Court data from",
  },
  sourceListAnd: { fi: " ja ", en: " and " },
  sourceCodeOn: { fi: "Lähdekoodi", en: "Source code" },
  feedback: { fi: "Palaute", en: "Feedback" },
  feedbackSubject: {
    fi: "Palaute%20hoopfinder.fi%20-%20palvelusta",
    en: "Feedback%20from%20hoopfinder.fi%20-%20service"
  },
  feedbackBody: { 
    fi: "Kiitos%20jos%20otat%20hetken%20antaaksesi%20palautetta%20palvelusta%2C%20kiitokset%2C%20kehitysehdotukset%20ja%20bugiraportit%20on%20tervetulleita%21",
    en: "Thank%20you%20if%20you%20take%20a%20moment%20to%20give%20feedback%2C%20suggestions%2C%20and%20bug%20reports%20are%20welcome%21"
  },
  searchLabel: { fi: "Etsi kaupunkia tai aluetta", en: "Search a city or neighborhood" },
  searchPlaceholder: {
    fi: "Kaupunki, alue tai osoite",
    en: "City, neighborhood or address",
  },
  searchInstructions: {
    fi: "Etsi hakusanalla tai käytä paikannusta löytääkseen kentät lähellä sinua.",
    en: "Search or use geolocation to find hoops near you.",
  },
  nearMe: {
    idle: { fi: "Paikanna", en: "Locate me" },
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
  distanceAway: { fi: "Etäisyys", en: "Distance" },
  locateToSeeDistance: {
    fi: "Salli selaimen paikannus niin näet etäisyyden kentälle.",
    en: "Allow geolocation to see the distance to the hoop.",
  },
  locationBlockedHelp: {
    fi: "Sijainnin jakaminen on estetty selaimen asetuksista tälle sivustolle.",
    en: "Location sharing is blocked in your browser settings for this site.",
  },
  lights: { fi: "Valot", en: "Lights" },
  freeUse: { fi: "Ilmainen käyttö", en: "Free use" },
  letsGo: { fi: "Katso kentän tiedot", en: "See court info" },
  close: { fi: "Sulje", en: "Close" },
  scrollForMore: { fi: "Vieritä alas", en: "Scroll for more" },
  courtKind: { fi: "Koripallokenttä", en: "Basketball court" },
  status: { fi: "Tila", en: "Status" },
  address: { fi: "Osoite", en: "Address" },
  showDirections: { fi: "Reittiohjeet (Google maps)", en: "Directions (Google maps)" },
  travelModes: {
    driving: { fi: "Auto", en: "Drive" },
    walking: { fi: "Kävely", en: "Walk" },
    bicycling: { fi: "Pyörä", en: "Bike" },
    transit: { fi: "Joukkoliikenne", en: "Transit" },
  },
  website: { fi: "Verkkosivu", en: "Website" },
  googleMaps: { fi: "maps.google.fi", en: "maps.google.com" },
  administrator: { fi: "Ylläpitäjä", en: "Administrator" },
  owner: { fi: "Omistaja", en: "Owner" },
  // LIPAS search-meta.owner.name / search-meta.admin.name for the v2 codes.
  owners: {
    city: { fi: "Kunta", en: "Municipality" },
    "city-main-owner": {
      fi: "Kuntaenemmistöinen yritys",
      en: "Municipality major owner",
    },
    "company-ltd": { fi: "Yritys", en: "Company ltd" },
    foundation: { fi: "Säätiö", en: "Foundation" },
    "municipal-consortium": { fi: "Kuntayhtymä", en: "Municipal consortium" },
    other: { fi: "Muu", en: "Other" },
    "registered-association": {
      fi: "Rekisteröity yhdistys",
      en: "Registered association",
    },
    state: { fi: "Valtio", en: "State" },
    unknown: { fi: "Ei tiedossa", en: "Unknown" },
  } satisfies Record<string, Pair<string>>,
  admins: {
    "city-education": {
      fi: "Kunta / opetustoimi",
      en: "Municipality / Education",
    },
    "city-other": { fi: "Kunta / muu", en: "Municipality / Other" },
    "city-sports": { fi: "Kunta / liikuntatoimi", en: "Municipality / Sports" },
    "city-technical-services": {
      fi: "Kunta / tekninen toimi",
      en: "Municipality / Technical services",
    },
    "municipal-consortium": { fi: "Kuntayhtymä", en: "Municipal consortium" },
    other: { fi: "Muu", en: "Other" },
    "private-association": {
      fi: "Rekisteröity yhdistys",
      en: "Private / Association",
    },
    "private-company": { fi: "Yritys", en: "Private / Company" },
    "private-foundation": { fi: "Säätiö", en: "Private / Foundation" },
    state: { fi: "Valtio", en: "State" },
    unknown: { fi: "Ei tiedossa", en: "Unknown" },
  } satisfies Record<string, Pair<string>>,
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
    fine_gravel: { fi: "Hieno sora", en: "Fine gravel" },
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
