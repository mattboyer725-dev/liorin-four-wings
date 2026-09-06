export type WingId = "academy" | "conquest" | "combined" | "bit";

export const WING_STORAGE_KEY = "liorin.wing";

export type NavTo =
  | "/academy"
  | "/play"
  | "/learn"
  | "/ratings"
  | "/events"
  | "/admin"
  | "/ops"
  | "/conquest"
  | "/tournaments"
  | "/platforms"
  | "/agents"
  | "/engage"
  | "/about"
  | "/combined"
  | "/bit";

export type NavItem = { to: NavTo; label: string };

export const ACADEMY_NAV: readonly NavItem[] = [
  { to: "/academy", label: "Home" },
  { to: "/play", label: "Play" },
  { to: "/learn", label: "Learn" },
  { to: "/ratings", label: "2700" },
  { to: "/events", label: "Events" },
  { to: "/admin", label: "Recaps" },
  { to: "/ops", label: "Studio" },
];

export const CONQUEST_NAV: readonly NavItem[] = [
  { to: "/conquest", label: "Command" },
  { to: "/tournaments", label: "Hunt" },
  { to: "/platforms", label: "Boards" },
  { to: "/agents", label: "Agents" },
  { to: "/engage", label: "Gauntlet" },
  { to: "/about", label: "Charter" },
];

export const COMBINED_NAV: readonly NavItem[] = [
  { to: "/combined", label: "Hub" },
  { to: "/play", label: "Play" },
  { to: "/learn", label: "Learn" },
  { to: "/ratings", label: "2700" },
  { to: "/tournaments", label: "Hunt" },
  { to: "/agents", label: "Agents" },
  { to: "/admin", label: "Recaps" },
  { to: "/ops", label: "Studio" },
];

export const BIT_NAV: readonly NavItem[] = [
  { to: "/bit", label: "Cart" },
  { to: "/admin", label: "Recaps" },
  { to: "/academy", label: "Academy" },
];

export const WINGS: Record<
  WingId,
  {
    id: WingId;
    era: "OLD" | "NEW" | "BOTH" | "8BIT";
    name: string;
    product: string;
    tagline: string;
    blurb: string;
    home: "/academy" | "/conquest" | "/combined" | "/bit";
    nav: readonly NavItem[];
  }
> = {
  academy: {
    id: "academy",
    era: "OLD",
    name: "Academy",
    product: "LIORIN Chess Academy",
    tagline: "Teach. Then hold.",
    blurb:
      "The original product. Teaching board, move-by-move lessons, the 2700 Club, live broadcasts, and recaps. No agents. No enlistment.",
    home: "/academy",
    nav: ACADEMY_NAV,
  },
  conquest: {
    id: "conquest",
    era: "NEW",
    name: "Conquest",
    product: "LIORIN Conquest",
    tagline: "Shall we play a game?",
    blurb:
      "The new command floor. Six agents map public boards, walk official bot signup, hunt engine tournaments, and climb until number one. Never a human pool.",
    home: "/conquest",
    nav: CONQUEST_NAV,
  },
  combined: {
    id: "combined",
    era: "BOTH",
    name: "Combined",
    product: "LIORIN Combined",
    tagline: "Academy. Then the field.",
    blurb:
      "Both floors on one nav. Teach and hold on the academy board, then launch the agent team into public bot ladders. The charter still holds.",
    home: "/combined",
    nav: COMBINED_NAV,
  },
  bit: {
    id: "bit",
    era: "8BIT",
    name: "8-Bit",
    product: "LIORIN 8-BIT",
    tagline: "PRESS START",
    blurb:
      "The NES cart. Pixel board, square-wave beeps, cold engine. Stages are the academy lessons. Separate from the CRT floors.",
    home: "/bit",
    nav: BIT_NAV,
  },
};

const ACADEMY_PREFIXES = ["/academy", "/play", "/learn", "/ratings", "/events", "/admin", "/ops"];
const CONQUEST_PREFIXES = ["/conquest", "/tournaments", "/platforms", "/agents", "/engage", "/about"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function wingFromPath(pathname: string): WingId | "gate" {
  if (pathname === "/") return "gate";
  if (pathname === "/bit" || pathname.startsWith("/bit/")) return "bit";
  if (pathname === "/academy" || pathname.startsWith("/academy/")) return "academy";
  if (pathname === "/conquest" || pathname.startsWith("/conquest/")) return "conquest";
  if (pathname === "/combined" || pathname.startsWith("/combined/")) return "combined";
  return "gate";
}

export function inferSharedWing(pathname: string): WingId {
  if (pathname === "/bit" || pathname.startsWith("/bit/")) return "bit";
  if (matches(pathname, CONQUEST_PREFIXES) && !matches(pathname, ACADEMY_PREFIXES)) return "conquest";
  if (matches(pathname, ACADEMY_PREFIXES)) return "academy";
  return "combined";
}

export function parseWing(value: string | null | undefined): WingId | null {
  if (value === "academy" || value === "conquest" || value === "combined" || value === "bit") return value;
  return null;
}
