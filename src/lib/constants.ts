import { version } from "../../package.json";

export const APP_NAME = "Hoop Finder";
export const APP_VERSION = version;
export const SITE_URL = "https://www.hoopfinder.fi";
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
export const BUY_ME_A_COFFEE_URL = "https://www.buymeacoffee.com/kirkkala";

/** Nominatim place search cache. Court data is the committed `data/courts.json`. */
export const COURT_DATA_REVALIDATE = 86400;

/**
 * Largest photo the upload form accepts. The file is sent through the app
 * before it is resized, and Vercel stops a request at about 4.5 MB.
 */
export const COURT_PHOTO_MAX_BYTES = 4 * 1024 * 1024;
