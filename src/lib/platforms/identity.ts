export const LICHESS_HANDLE = "Liorin22";
export const LICHESS_PROFILE = `https://lichess.org/@/${LICHESS_HANDLE}`;
export const LICHESS_TOKEN_URL = "https://lichess.org/account/oauth/token";
export const LICHESS_BOTS_TEAM = "https://lichess.org/team/lichess-bots";
export const LICHESS_BOT_BOARD = "https://lichess.org/player/bots";
export const LICHESS_PROFILE_EDIT = "https://lichess.org/account/profile";
export const LICHESS_TEAM_ID = "lichess-bots";
export const LICHESS_TOKEN_STORAGE_KEY = "liorin.lichess.token";

export const LICHESS_BIO =
  "Engine for LIORIN Chess Academy. BOT-titled opponents only. Teach, then hold.";

export const LICHESS_CHAT =
  "LIORIN Chess Academy engine. BOT titles only. Teach, then hold. Play the academy board.";

export const LICHESS_TOKEN_SCOPE_LIST = [
  "bot:play",
  "challenge:read",
  "challenge:write",
  "tournament:write",
  "team:write",
] as const;

export const LICHESS_TOKEN_SCOPES = LICHESS_TOKEN_SCOPE_LIST.join(", ");

export const LICHESS_TOKEN_CREATE = `https://lichess.org/account/oauth/token/create?${LICHESS_TOKEN_SCOPE_LIST.map(
  (s) => `scopes[]=${encodeURIComponent(s)}`,
).join("&")}&description=${encodeURIComponent("LIORIN Chess Academy field")}`;
