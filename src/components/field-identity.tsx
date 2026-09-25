import { useEffect, useState } from "react";
import type { CommandSnapshot } from "@/lib/agents/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatElo } from "@/lib/conquest/format";
import {
  LICHESS_BIO,
  LICHESS_BOT_BOARD,
  LICHESS_BOTS_TEAM,
  LICHESS_HANDLE,
  LICHESS_PROFILE,
  LICHESS_PROFILE_EDIT,
  LICHESS_TOKEN_CREATE,
  LICHESS_TOKEN_SCOPES,
  LICHESS_TOKEN_STORAGE_KEY,
} from "@/lib/platforms/identity";

export function FieldIdentity({ snap }: { snap?: CommandSnapshot }) {
  const [copied, setCopied] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const lichess = snap?.ranks.find((r) => r.platformId === "lichess");
  const handleRow = snap?.handles.find((h) => h.platformId === "lichess");
  const handle = lichess?.liorinHandle ?? handleRow?.handle ?? LICHESS_HANDLE;
  const title = lichess?.liorinTitle;
  const isBot = (title ?? "").toUpperCase() === "BOT";
  const teamJoined = /lichess bots/i.test(handleRow?.note ?? "");
  const botOne = [...(snap?.onlineBots ?? [])]
    .map((b) => ({ name: b.username, r: b.blitz ?? b.rapid ?? b.bullet ?? 0 }))
    .sort((a, b) => b.r - a.r)[0];
  const gap =
    botOne && lichess?.liorinRating != null ? botOne.r - lichess.liorinRating : null;

  useEffect(() => {
    setHasToken(Boolean(sessionStorage.getItem(LICHESS_TOKEN_STORAGE_KEY)));
  }, []);

  const steps = [
    { done: true, label: `@${handle} created`, href: LICHESS_PROFILE },
    { done: true, label: "Confirmation email completed", href: null },
    { done: hasToken, label: `Mint token · ${LICHESS_TOKEN_SCOPES}`, href: LICHESS_TOKEN_CREATE },
    { done: isBot, label: isBot ? "BOT title live" : "Bind token and upgrade to BOT", href: null },
    {
      done: teamJoined,
      label: teamJoined ? "Team Lichess Bots" : "Join team Lichess Bots",
      href: LICHESS_BOTS_TEAM,
    },
    { done: false, label: "Paste engine bio on the public profile", href: LICHESS_PROFILE_EDIT },
    { done: false, label: "Challenge BOT-titled accounts only", href: LICHESS_BOT_BOARD },
  ];

  return (
    <section className="rounded-lg border border-border bg-surface p-5 md:p-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Registrar · field identity</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-fg">@{handle}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        {isBot
          ? "BOT title is live. Engine play is legal against BOT titles only. Human pools stay refused."
          : "Lichess account is live. Not a BOT title yet — engine play stays illegal until the official upgrade. Do not play a game on this account before the upgrade. This is not the older human account Liorin. Token stays on this device. Human pools stay refused."}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Handle", value: handle },
          { label: "Title", value: title ?? "none" },
          { label: "Live blitz", value: formatElo(lichess?.liorinRating) },
          { label: "Gap to live BOT #1", value: gap != null ? formatElo(gap) : "—" },
        ].map((it) => (
          <div key={it.label} className="rounded-md border border-border bg-bg px-3 py-3">
            <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">{it.label}</dt>
            <dd className="mt-1 truncate tabular text-lg text-primary">{it.value}</dd>
          </div>
        ))}
      </dl>
      <ol className="mt-5 divide-y divide-border overflow-hidden rounded-md border border-border">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3 px-3 py-3">
            <Badge className={s.done ? "text-primary" : "text-muted"}>{s.done ? "Done" : "Next"}</Badge>
            {s.href ? (
              <a href={s.href} target="_blank" rel="noreferrer" className="text-sm text-fg hover:text-primary">
                {s.label}
              </a>
            ) : (
              <span className="text-sm text-fg">{s.label}</span>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-md border border-border-strong bg-raised p-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Engine bio · paste on Lichess</p>
        <p className="mt-2 text-sm leading-relaxed text-fg">{LICHESS_BIO}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(LICHESS_BIO);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Copy bio"}
          </Button>
          <a href={LICHESS_PROFILE} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost">
              Open profile
            </Button>
          </a>
          <a href={LICHESS_TOKEN_CREATE} target="_blank" rel="noreferrer">
            <Button size="sm">Mint token</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
