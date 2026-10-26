import { cookies, headers } from "next/headers";
import { LOCATION_COOKIE, PREFS_COOKIE, parsePrefs, type Prefs } from "./prefs";
import { isLocation, type Location } from "./regions";

export async function readPrefs(): Promise<Prefs> {
  const store = await cookies();
  return parsePrefs(store.get(PREFS_COOKIE)?.value);
}

export interface LocationChoice {
  location: Location | null;
  /** True when the location came from the visitor's IP rather than their choice. */
  detected: boolean;
}

/** The Local page's country: the cookie if set, else Vercel's IP country when supported. */
export async function readLocation(): Promise<LocationChoice> {
  const store = await cookies();
  const chosen = store.get(LOCATION_COOKIE)?.value?.toUpperCase();
  if (isLocation(chosen)) return { location: chosen, detected: false };
  const country = (await headers()).get("x-vercel-ip-country")?.toUpperCase();
  if (isLocation(country)) return { location: country, detected: true };
  return { location: null, detected: false };
}
