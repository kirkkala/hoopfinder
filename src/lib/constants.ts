import { version } from "../../package.json";

export const APP_NAME = "Hoop Finder";
export const APP_VERSION = version;
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/** Nominatim place search cache. Court data is the committed `data/courts.json`. */
export const COURT_DATA_REVALIDATE = 86400;
