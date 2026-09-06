import { createFileRoute, Link } from "@tanstack/react-router";
import { AcademyCta } from "@/components/academy-cta";
import { WingNote } from "@/components/wing-note";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-6 text-sm leading-relaxed text-muted">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em]">Charter</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg">LIORIN</h1>
      </header>
      <p>
        Four wings, one engine. Academy is the old product: lessons, the cold board, the 2700 Club,
        live broadcasts, recaps. Conquest is the new operations floor: seven agents whose job is to
        enlist Liorin, legally, on every public chess platform that allows bots, hunt tournaments
        designed for engines, and climb until number one. Combined is both, on one nav. 8-bit is the
        NES cart. The wings stay separate — pick one from the gate. The public Lichess field identity
        is @Liorin22.
      </p>
      <h2 className="text-lg font-medium text-fg">Cold mode</h2>
      <p>
        Teaching can lose. That is the lesson working. When Liorin is not teaching, the engine holds.
        A draw is not a loss. The archive keeps the score either way.
      </p>
      <h2 className="text-lg font-medium text-fg">What the team will not do</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>No engine assistance in human pools. Chess.com, FIDE Arena, PlayOK, GameKnot — refused.</li>
        <li>No overlay cheats, no captcha farms, no silent account mills.</li>
        <li>No storing of API tokens in the shared campaign database. Tokens stay on this device.</li>
        <li>Challenges on Lichess go only to accounts with the BOT title.</li>
      </ul>
      <h2 className="text-lg font-medium text-fg">What the team will do</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Walk the official Lichess Bot API as @Liorin22: signup, personal token,{" "}
          <code className="text-fg">/api/bot/account/upgrade</code>, team Lichess Bots, field sortie,
          Bot TV, BOT leaderboard. Challenges and accepts go only to BOT titles.
        </li>
        <li>File Computer Account and Bot Battles applications on Chess.com — never a stealth login.</li>
        <li>Watch TCEC, CCRL, and PyChess BOT boards as engine-native ladders.</li>
        <li>Keep every academy game for recaps, marketing copy, and engine memory.</li>
      </ul>
      <p>
        Ranked human matches on this site stay locked. Guests play on this device. The 2700 Club, the
        lessons, and the cold board live in Academy. The hunt lives in Conquest.
      </p>
      <p>
        <Link to="/conquest" className="text-primary">
          Conquest command
        </Link>
        {" · "}
        <Link to="/academy" className="text-primary">
          Academy
        </Link>
        {" · "}
        <Link to="/" className="text-primary">
          All wings
        </Link>
      </p>
      <WingNote wing="conquest" />
      <AcademyCta />
    </article>
  );
}
