export const LOCALES = ["fi", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fi";

type Pair<T> = { fi: T; en: T };

const messages = {
  appName: {
    fi: "Hoop Finder Suomi",
    en: "Hoop Finder Finland",
  },
  region: {
    fi: "Suomi",
    en: "Finland",
  },
  tagline: {
    fi: "Löydä kenttä, käy heittelemässä.",
    en: "Find a hoop, go out and play.",
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
    fi: "Hoop Finder Suomi — ulkokoripallokentät Suomessa",
    en: "Hoop Finder Finland — outdoor basketball courts in Finland",
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
  dataFetchedAt: { fi: "Tiedot haettu", en: "Data fetched" },
  addedAt: { fi: "Lisätty", en: "Added" },
  betaTooltip: {
    fi: "Varhainen beta-versio. Ei valmis, saattaa sisältää bugeja.",
    en: "Early beta preview. Not ready yet, might contain bugs.",
  },
  language: { fi: "Language", en: "Language" },
  menu: { fi: "Valikko", en: "Menu" },
  info: { fi: "Tietoa palvelusta", en: "About the service" },
  introTitle: { fi: "Koripallokentät suomessa", en: "Basketball courts in Finland" },
  introLead: {
    fi: "Hoop Finderin kartalla on {count} Suomen ulkokoripallokenttää. Olit sitten reissussa, mökillä, sukulaisten luona tai haluat tsekata kodin läheltä uuden kentän, täältä niitä löytyy!",
    en: "Hoop Finder has {count} outdoor basketball courts in Finland. Whether you're on a trip, at the cottage, visiting relatives or want to check a new court close to home — here you can find them!",
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
    fi: "koodaili sivuston omana harrasteprojektina, hakien kenttien tiedot parista avoimesta rajapinnasta ja antamalla käyttäjien itse lisätä palveluun puuttuvia kenttiä.",
    en: "built this site as a side project, fetching the court data from a few open APIs and allowing users to add missing courts to the service.",
  },
  introCreatedBy2: {
    fi: "Motivaationa tähän oli saada isot ja pienet ihmiset ulos liikkumaan enemmän koripallon kanssa.",
    en: "The motivation for this is to get big and small humans out of the house and move more with a basketball."
  },
  supportDeveloper: { fi: "Tue kehittäjää", en: "Support the developer" },
  okBroCta: { fi: "Tämä selvä!", en: "Understood!" },
  madeWith: { fi: 'Made with', en: "Made with" },
  love: { fi: "love", en: "love" },
  courtDataFrom: {
    fi: "Lähdedata:",
    en: "Sources:",
  },
  footerHide: { fi: "Piilota alapalkki", en: "Hide footer" },
  footerShow: { fi: "Näytä alapalkki", en: "Show footer" },
  osmContributors: {
    fi: "contributors",
    en: "contributors",
  },
  osmLicenseLead: {
    fi: "Lisenssi",
    en: "License",
  },
  osmLicense: {
    fi: "Open Database License",
    en: "Open Database License",
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
    granted: { fi: "Sijaintisi", en: "Locate" },
    denied: { fi: "Sijainti estetty", en: "Location blocked" },
    unavailable: { fi: "Ei GPS:ää", en: "No GPS" },
  },
  emptyTitle: { fi: "Airball", en: "Airball" },
  emptyHint: {
    fi: "Ei kenttiä näkyvissä, kokeile toista hakusanaa tai zoomaa karttaa.",
    en: "No hoops visible. Try another search term or zoom the map.",
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
  showDirections: { fi: "Reittiohjeet", en: "Directions" },
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
  fieldTypes: {
    full: { fi: "Normaali koripallo\u00adkenttä", en: "Full court" },
    "one-hoop": { fi: "Yhden korin kenttä", en: "One hoop" },
    mini: { fi: "Minikoripallokenttä", en: "Mini court" },
    street: { fi: "Katukoris", en: "Streetball" },
  } satisfies Record<string, Pair<string>>,
  waterPoints: {
    yes: { fi: "On", en: "Yes" },
    no: { fi: "Ei ole", en: "No" },
    seasonal: { fi: "Kausittainen", en: "Seasonal" },
  } satisfies Record<string, Pair<string>>,
  lengthM: { fi: "Pituus (m)", en: "Length (m)" },
  widthM: { fi: "Leveys (m)", en: "Width (m)" },
  addCourtUnknown: { fi: "Ei tietoa", en: "Not known" },
  addCourtYesNoHint: {
    fi: "Jätä valitsematta jos et tiedä:",
    en: "If you don't know, leave it unselected:",
  },
  surface: { fi: "Pinta", en: "Surface" },
  surfaceNotes: { fi: "Pintatiedot", en: "Surface notes" },
  dimensions: { fi: "Mitat", en: "Dimensions" },
  area: { fi: "Pinta-ala", en: "Area" },
  toilet: { fi: "WC", en: "Toilet" },
  adjustableRim: { fi: "Säädettävä kori", en: "Adjustable rim" },
  hoopHeight: { fi: "Korin korkeus", en: "Hoop height" },
  hoopHeights: {
    official: { fi: "305 cm", en: "305 cm" },
    lower: { fi: "Alle 305 cm", en: "Under 305 cm" },
  },
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
  addCourt: { fi: "Lisää kenttä", en: "Add court" },
  addCourtConfirmHere: { fi: "Lisää kenttä", en: "Add court" },
  addCourtExit: { fi: "Poistu", en: "Exit" },
  addCourtLead: {
    fi: "Puuttuko Hoop Finderistä kenttä? Täällä voit lisätä sen.",
    en: "Make the service better by adding a missing court.",
  },
  addCourtHint: {
    fi: "Paikanna itsesi kartalta tai zoomaa lähemmäs ja napsauta lisätäksesi kentän.",
    en: "Locate yourself on the map or zoom in closer and tap the map to add it.",
  },
  addCourtInfoOpen: { fi: "Ohje", en: "Help" },
  addCourtHintZoom: {
    fi: "Zoomaa lähemmäs merkitäksesi korin sijainnin mahdollisimman tarkasti.",
    en: "Zoom in closer to mark the hoop location as accurately as possible.",
  },
  addCourtZoomTitle: { fi: "Zoomaa lähemmäs", en: "Zoom in closer" },
  addCourtName: { fi: "Kentän nimi", en: "Court name" },
  addCourtNamePlaceholder: {
    fi: "Esim. Puiston koripallokenttä",
    en: "e.g. Park basketball court",
  },
  addCourtAddress: { fi: "Osoite", en: "Address" },
  addCourtAddressPlaceholder: {
    fi: "Paratiisitie 13, 00100 Helsinki",
    en: "Paratiisitie 13, 00100 Helsinki",
  },
  addCourtAddressLoading: {
    fi: "Haetaan osoitetta…",
    en: "Looking up the address…",
  },
  addCourtEmail: { fi: "Sähköposti", en: "Email" },
  addCourtEmailHelp: {
    fi: "Lähetämme sähköpostiisi vahvistuslinkin.",
    en: "We'll send a confirmation link to your email.",
  },
  addCourtEmailUpdates: {
    fi: "Ylläpito voi tarvittaessa myös kysyä lisätietoja tai ilmoittaa päivityksistä. Emme lähetä spammia eikä sähköpostiosoitettasi näytetä palvelussa.",
    en: "An admin may also ask for extra details, or tell you about updates. We won't spam you and your email address is not shown in the service.",
  },
  addCourtSubmit: { fi: "Tallenna", en: "Save" },
  addCourtRequiredMark: { fi: "pakollinen", en: "required" },
  addCourtMissing: {
    fi: (fields: string) => `Täytä vielä: ${fields}.`,
    en: (fields: string) => `Still needed: ${fields}.`,
  },
  addCourtMeasure: {
    fi: "Mitat ja pinta-ala kirjoitetaan numeroina.",
    en: "Enter dimensions and area as numbers.",
  },
  addCourtGreeting: { fi: "Terveiset kehittäjälle", en: "A note for the developer" },
  addCourtGreetingHint: {
    fi: "Palaute tai terveiset. Ei näy muille käyttäjille, vain ylläpito näkee tämän.",
    en: "Feedback or greetings. Hidden from other visitors. Only an admin can see this.",
  },
  addCourtCancel: { fi: "Sulje", en: "Close" },
  addCourtShowMap: { fi: "Näytä kartta", en: "Show map" },
  addCourtShowForm: { fi: "Näytä lomake", en: "Show form" },
  addCourtDiscardAsk: {
    fi: "Sulje ja poista syöttämäsi tiedot?",
    en: "Close and delete what you entered?",
  },
  addCourtDiscardConfirm: { fi: "Sulje", en: "Close" },
  addCourtDiscardKeep: { fi: "Palaa lomakkeeseen", en: "Back to the form" },
  addCourtSending: { fi: "Lähetetään…", en: "Sending…" },
  addCourtError: {
    fi: "Lähetys epäonnistui. Kokeile uudelleen.",
    en: "Could not send. Try again.",
  },
  addCourtRateLimit: {
    fi: "Liian monta lähetystä. Kokeile myöhemmin uudelleen.",
    en: "Too many submissions. Try again later.",
  },
  addCourtEmailError: {
    fi: "Vahvistusviestin lähetys epäonnistui. Kokeile uudelleen.",
    en: "Could not send the confirmation email. Try again.",
  },
  addCourtInvalid: {
    fi: "Tarkista tiedot. Sähköpostin pitää olla kelvollinen.",
    en: "Check the details. Email must be valid.",
  },
  addCourtUnavailable: {
    fi: "Kenttien lisääminen ei ole juuri nyt käytössä.",
    en: "Adding courts is not available right now.",
  },
  addCourtTooClose: {
    fi: "Tässä on jo kenttä ihan lähellä",
    en: "There is already a court close by",
  },
  addCourtTooCloseBody: {
    fi: "Valitse toinen paikka kartalta.",
    en: "Pick another place on the map.",
  },
  addCourtSuccessLead: {
    fi: "Kiitos kun autat tekemään palvelusta paremman!",
    en: "Thank you for contributing with making the service better!",
  },
  addCourtSuccess: {
    fi: "Sait sähköpostiisi vahvistuslinkin, klikkaa sitä ja kenttä julkaistaan pian!",
    en: "You received a confirmation link in your email, click it and the court will be published soon!",
  },
  confirmThanksTitle: { fi: "Kiitos!", en: "Thank you!" },
  confirmThanksBody: {
    fi: "Ylläpito sai ilmotuksen vahvistuksesta, tarkistaa tiedot ja hyväksyy lisäyksesi pian!",
    en: "Administrator was notified of the confirmation. They will check the details and approve it soon!",
  },
  confirmCourtInvalidTitle: {
    fi: "Linkki ei kelpaa",
    en: "Link is not valid",
  },
  confirmCourtInvalid: {
    fi: "Vahvistuslinkki ei ole voimassa.",
    en: "This confirmation link is not valid.",
  },
  confirmNotifyFailedTitle: {
    fi: "Ilmoitus ei lähtenyt",
    en: "The notification didn't send",
  },
  confirmNotifyFailed: {
    fi: "Avaa vahvistuslinkki uudelleen.",
    en: "Open the confirmation link again.",
  },
  addCourtOutsideFinland: {
    fi: "Valitse paikka Suomesta.",
    en: "Pick a place in Finland.",
  },
  addCourtOnWater: {
    fi: "Älä laita kenttää veteen",
    en: "Don't place the court in the water",
  },
  addCourtOnWaterBody: {
    fi: "Hoop Finder ei ole vesipallokenttäpaikannin",
    en: "Hoop Finder is not a water polo court locator.",
  },
  pendingComingSoon: {
    fi: "Käyttäjän lisäämä kenttä.",
    en: "Court added by a visitor.",
  },
  pendingAddedOn: {
    fi: (date: string) => `Kenttä on lisätty käyttäjän toimesta ${date}`,
    en: (date: string) => `Court added by a visitor on ${date}`,
  },
  statusUnderReview: { fi: "Odottaa tarkistusta", en: "Waiting to be checked" },
  statusAwaitingEmail: {
    fi: "Odottaa vahvistusta",
    en: "Waiting for confirmation",
  },
  pendingPublishAfterReview: {
    fi: "Kentän tiedot julkaistaan palvelussa kun ylläpito on tarkistanut sen.",
    en: "The court information is published after an admin has reviewed it.",
  },
  sourceSubmitted: {
    fi: "Käyttäjän lisäämä",
    en: "Added by a visitor",
  },
  signIn: { fi: "Kirjaudu", en: "Sign in" },
  signOut: { fi: "Kirjaudu ulos", en: "Sign out" },
  signInNotRequired: {
    fi: "Kirjautuminen toistaiseksi vain pääkäyttäjille.",
    en: "Only for system administrators for now.",
  },
  signInTitle: { fi: "Kirjaudu", en: "Sign in" },
  signInGoogle: { fi: "Google sign in", en: "Google sign in" },
  signInNotAdmin: {
    fi: (email: string) =>
      `Sähköpostiosoitteellasi ${email} ei ole ylläpito-oikeutta.`,
    en: (email: string) =>
      `Your email address ${email} does not have admin access.`,
  },
  signInUnavailable: {
    fi: "Google-kirjautuminen ei ole vielä käytössä.",
    en: "Google sign-in is not available yet.",
  },
  signInError: {
    fi: "Kirjautuminen epäonnistui. Yritä uudelleen.",
    en: "Sign-in failed. Try again.",
  },
  adminNav: { fi: "Hallinta", en: "Admin" },
  adminTitle: { fi: "Hallintapaneeli", en: "Admin panel" },
  adminEmpty: {
    fi: "Ei käyttäjien lisäämiä kenttiä.",
    en: "No visitor-submitted courts.",
  },
  adminUnavailable: {
    fi: "Hallintapaneeli ei ole juuri nyt käytössä.",
    en: "Admin panel is not available right now.",
  },
  adminCourtCount: {
    fi: (count: number) => {
      const noun = count === 1 ? "kenttä" : "kenttää";
      return `${count} ${noun}`;
    },
    en: (count: number) => {
      const noun = count === 1 ? "court" : "courts";
      return `${count} ${noun}`;
    },
  },
  adminFilter: { fi: "Suodatus", en: "Filter" },
  adminFilterAll: { fi: "Kaikki", en: "All" },
  adminFilterPending: { fi: "Odottaa", en: "Pending" },
  adminFilterUnconfirmed: { fi: "Vahvistamatta", en: "Unconfirmed" },
  adminFilterEmpty: {
    fi: "Ei kenttiä tässä näkymässä.",
    en: "No courts in this view.",
  },
  adminStatusPublished: { fi: "Julkaistu", en: "Published" },
  adminStatusPending: { fi: "Odottaa julkaisua", en: "Pending publication" },
  adminStatusConfirmed: { fi: "Vahvistettu", en: "Confirmed" },
  adminStatusUnconfirmed: { fi: "Vahvistamatta", en: "Unconfirmed" },
  adminUnconfirmedNotice: {
    fi: "Käyttäjä ei ole vielä vahvistanut kentän lisäystä.",
    en: "The visitor has not confirmed the email link yet.",
  },
  adminEdit: { fi: "Muokkaa", en: "Edit" },
  adminEditCancel: { fi: "Peruuta", en: "Cancel" },
  adminEditError: {
    fi: "Tallennus epäonnistui. Kokeile uudelleen.",
    en: "Could not save. Try again.",
  },
  adminPublish: { fi: "Julkaise", en: "Publish" },
  adminPublishConfirm: {
    fi: (name: string) =>
      `Julkaistaanko “${name}”? Käyttäjälle lähetetään sähköposti.`,
    en: (name: string) =>
      `Publish “${name}”? An email will be sent to the visitor.`,
  },
  adminUnpublish: { fi: "Piilota", en: "Unpublish" },
  adminUnpublishConfirm: {
    fi: (name: string) => `Piilotetaanko “${name}”?`,
    en: (name: string) => `Hide “${name}”?`,
  },
  adminSaving: { fi: "Tallennetaan…", en: "Saving…" },
  adminStatusError: {
    fi: "Tilan vaihto epäonnistui. Kokeile uudelleen.",
    en: "Could not update status. Try again.",
  },
  adminSubmittedAt: { fi: "Lähetetty", en: "Submitted" },
  adminDelete: { fi: "Poista", en: "Delete" },
  adminDeleteConfirm: {
    fi: (name: string) =>
      `Poistetaanko “${name}” pysyvästi? Tätä ei voi perua.`,
    en: (name: string) =>
      `Delete “${name}” permanently? This cannot be undone.`,
  },
  adminDeleteError: {
    fi: "Poisto epäonnistui. Kokeile uudelleen.",
    en: "Could not delete the court. Try again.",
  },
  statusPending: { fi: "Tarkistettavana", en: "Pending review" },
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
      fi: "Hiekka\u00adteko\u00adnurmi",
      en: "Sand-infilled turf",
    },
    sand: { fi: "Hiekka", en: "Sand" },
    stone: { fi: "Kivi", en: "Stone" },
    "rock-dust": { fi: "Kivituhka", en: "Rock dust" },
    gravel: { fi: "Sora", en: "Gravel" },
    fine_gravel: { fi: "Hieno sora", en: "Fine gravel" },
    other: { fi: "Muu", en: "Other" },
  } satisfies Record<string, Pair<string>>,
  loadingCourts: { fi: "Haetaan kenttiä…", en: "Fetching courts…" },
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
  notFoundTitle: { fi: "Airball!", en: "Airball!" },
  notFoundHint: {
    fi: "Kenttä hukassa (404 - sivua ei löydy).",
    en: "Court is missing (404 - page not found).",
  },
  backToHoops: { fi: "Takaisin kartalle", en: "Back to the hoops" },
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
