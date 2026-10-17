import { version } from "../../package.json";

export const APP_NAME = "Hoop Finder";
export const APP_VERSION = version;
export const SITE_URL = "https://www.hoopfinder.fi";
/** Court map. Old `/?court=` links redirect here. */
export const MAP_PATH = "/map";
/** Homepage. `?info` keeps it open after the first visit, when `/` opens the map. */
export const INFO_PARAM = "info";
export const INFO_HREF = `/?${INFO_PARAM}`;
/** Court list. `/courts/lipas`, `/courts/osm`, and `/courts/submitted` without an id redirect here. */
export const COURT_INDEX_PATH = "/courts";
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
export const BUY_ME_A_COFFEE_URL = "https://www.buymeacoffee.com/kirkkala";
export const GITHUB_URL = "https://github.com/kirkkala/hoopfinder";
/** Nominatim and Overpass ask for a contact URL in the user agent. */
export const USER_AGENT = `HoopFinder/0.1 (${GITHUB_URL})`;

/** Nominatim place search cache. Court data is the committed `data/courts.json`. */
export const COURT_DATA_REVALIDATE = 86400;

/**
 * Largest photo the upload form accepts. The file is sent through the app
 * before it is resized, and Vercel stops a request at about 8 MB.
 */
export const COURT_PHOTO_MAX_BYTES = 8 * 1024 * 1024;
