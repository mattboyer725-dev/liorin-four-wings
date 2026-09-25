import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bindLichessToken, completeField, upgradeBoundBot } from "@/lib/conquest/server";
import {
  LICHESS_HANDLE,
  LICHESS_TOKEN_CREATE,
  LICHESS_TOKEN_SCOPES,
  LICHESS_TOKEN_STORAGE_KEY,
} from "@/lib/platforms/identity";

export function FieldHandshake() {
  const qc = useQueryClient();
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(LICHESS_TOKEN_STORAGE_KEY) ?? "";
    if (stored) setToken(stored);
  }, []);

  const persist = (t: string) => {
    sessionStorage.setItem(LICHESS_TOKEN_STORAGE_KEY, t.trim());
  };

  const bind = useMutation({
    mutationFn: (t: string) => bindLichessToken({ data: { token: t } }),
    onSuccess: (res) => {
      if (res.ok) {
        persist(token);
        setMsg(`Bound to @${res.username}${res.title ? ` · ${res.title}` : " · not BOT yet"}. Token stays on this device.`);
        void qc.invalidateQueries({ queryKey: ["command"] });
      } else setMsg(res.error);
    },
    onError: (e) => setMsg(e.message),
  });

  const upgrade = useMutation({
    mutationFn: (t: string) => upgradeBoundBot({ data: { token: t } }),
    onSuccess: (res) => {
      if (res.ok) {
        persist(token);
        setMsg(`@${res.username} is BOT.`);
        void qc.invalidateQueries({ queryKey: ["command"] });
      } else setMsg("error" in res ? res.error : "Upgrade failed");
    },
    onError: (e) => setMsg(e.message),
  });

  const complete = useMutation({
    mutationFn: (t: string) => completeField({ data: { token: t } }),
    onSuccess: (res) => {
      if (res.ok) {
        persist(token);
        setMsg(
          `@${res.username} is BOT. Team Lichess Bots: ${res.teamNote}. Token was not stored on the server. Paste the engine bio on the public profile.`,
        );
        void qc.invalidateQueries({ queryKey: ["command"] });
      } else setMsg("error" in res ? res.error : "Complete field failed");
    },
    onError: (e) => setMsg(e.message),
  });

  const pending = bind.isPending || upgrade.isPending || complete.isPending;
  const ready = token.trim().length >= 8;

  return (
    <section className="rounded-lg border border-border bg-surface p-5 md:p-6">
      <h2 className="text-sm font-semibold tracking-[0.08em] text-fg">Lichess BOT handshake</h2>
      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
        @{LICHESS_HANDLE} is live and still untitled. Do not play a game on it until the BOT upgrade —
        zero games is required. Mint a personal token while logged in as @{LICHESS_HANDLE}, paste it
        here, then complete the field. Scopes: {LICHESS_TOKEN_SCOPES}. The token never enters the
        shared campaign store.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="Personal access token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          aria-label="Lichess personal access token"
        />
        <a href={LICHESS_TOKEN_CREATE} target="_blank" rel="noreferrer">
          <Button variant="outline">Mint token</Button>
        </a>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => complete.mutate(token)} disabled={pending || !ready}>
          {complete.isPending ? "Completing…" : "Complete field"}
        </Button>
        <Button variant="outline" onClick={() => bind.mutate(token)} disabled={pending || !ready}>
          {bind.isPending ? "Binding…" : "Bind"}
        </Button>
        <Button variant="ghost" onClick={() => upgrade.mutate(token)} disabled={pending || !ready}>
          {upgrade.isPending ? "Upgrading…" : "Upgrade to BOT"}
        </Button>
      </div>
      {msg ? <p className="mt-3 text-xs leading-relaxed text-fg">{msg}</p> : null}
    </section>
  );
}
