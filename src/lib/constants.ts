import { version } from "../../package.json";

export const APP_NAME = "Hoop Finder";
export const APP_VERSION = version;
export const SITE_URL = "https://www.hoopfinder.fi";
/** Court map. Old `/map` and `/?court=` links redirect here. */
export const MAP_PATH = "/kartta";
/** Homepage. `?info` keeps it open after the first visit, when `/` opens the map. */
export const INFO_PARAM = "info";
export const INFO_HREF = `/?${INFO_PARAM}`;
/** Court list. Old `/courts` paths redirect here. */
export const COURT_INDEX_PATH = "/koripallokentat";
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
export const BUY_ME_A_COFFEE_URL = "https://www.buymeacoffee.com/kirkkala";
export const GITHUB_URL = "https://github.com/kirkkala/hoopfinder";
/** Nominatim and Overpass ask for a contact URL in the user agent. */
export const USER_AGENT = `HoopFinder/0.1 (${GITHUB_URL})`;

/** Nominatim place search cache. Court data is the committed `data/courts.json`. */
export const COURT_DATA_REVALIDATE = 86400;

/**
 * Largest photo the form will open. A phone picture is often bigger than this
 * used to allow, and it is shrunk in the browser before upload.
 */
export const COURT_PHOTO_MAX_BYTES = 32 * 1024 * 1024;

/**
 * Vercel refuses a function request above 4.5 MB and does not run the route.
 * The file sent from the form stays under this, with room for the other fields.
 */
export const COURT_PHOTO_REQUEST_BYTES = 4 * 1024 * 1024;
