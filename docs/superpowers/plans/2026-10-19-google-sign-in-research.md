# Google sign-in: what it takes, and what must change to scale (research, 19 Oct 2026)

Owner, 19 Oct 2026: "research what Google sign-in would need, and what has to be reworked so it
works well at scale". Nothing here is built yet; this is the map and a proposed order.

## Where the app stands

- No accounts. "This is me" (`shared/me.service.ts`) keeps a player id in localStorage; nothing
  is written to the database.
- Everything is public and anyone may write what `firestore.rules` allows (create leagues, add
  players, play, delete softly, restore, change settings).
- **Four live listeners on whole collections**: `GameService` (all games), `PlayerService` (all
  players), `LeagueService` (all leagues), `TournamentService` (all tournaments). Every visitor
  downloads every league's data; per-league views, rankings and stats are computed from it on
  the device. With 5 leagues and ~500 games that is fine and fast (offline cache).
- The 2017 games have no `league` field (`leagueOf()` falls back to `legacy`); their migration is
  ready but not run (CLAUDE.md).

## The scale problem is the listeners, not sign-in

With hundreds of leagues, every phone would download every game of every league (and Firestore
bills each document read: the free Spark plan allows 50,000 reads a day, so a few hundred users
opening the app would exhaust it). And once leagues can be private, **rules are not filters**:
a query must itself ask only for documents the rules allow, or the whole query is refused. So
whatever we do about sign-in, the data layer has to move to per-league queries:

| Today | Needed |
| --- | --- |
| all games | `games where league == X` for the league on screen (and `in` up to 30 leagues for "my leagues") |
| all players | the league's players (`players` ids from the league, fetched by id / `in`) |
| all leagues | the user's leagues (membership), plus a name-prefix query for search |
| all tournaments | `tournaments where league == X` |
| overall ranking / overall profile over every league | over the user's leagues only (or precomputed later) |

This is the biggest piece of work; the views mostly stay, since they already work per league.
Prerequisite: **run the 2017 migration first** — a game without `league` never matches
`where league == X`, so the legacy fallback cannot survive per-league queries.

## Sign-in itself (Firebase Authentication, Google provider)

- Library: `firebase/auth` from the SDK already used, with `rxfire/auth` (`authState`) for the
  signals — no new dependency (AngularFire would be a second binding layer for the same SDK).
- Sign-in method: **`signInWithPopup`**. `signInWithRedirect` breaks on browsers that block
  third-party storage (Safari, Firefox, Chrome's phase-out) when the app is not served from the
  auth domain — and the app is on `bwojtyca.github.io` while `authDomain` is
  `football-league-b6e95.firebaseapp.com` (Firebase: "Best practices for using
  signInWithRedirect on browsers that block third-party storage access"). Popup works on
  GitHub Pages; the installed iOS app (standalone PWA) is the case to test, and the fallback
  there is moving hosting to Firebase Hosting (same domain as `authDomain`; free on Spark).
- Console: enable the Google provider, add `bwojtyca.github.io` to authorised domains.
- Free: Google sign-in has no per-user cost on Spark.
- **Guests stay** (owner's plan: "Google sign-in with a guest mode that joins leagues by link"):
  Firebase **anonymous auth** gives every visitor a uid without a screen, so rules can say
  `request.auth != null` everywhere (no anonymous scripts), and a guest who later signs in with
  Google keeps the same uid (`linkWithPopup`), so nothing they did is lost.

## Data model additions (all optional fields; old documents untouched)

- `users/{uid}`: `player` (the player id this account is), `leagues` (ids, for the "my leagues"
  query), `created`. Readable by its owner only.
- `players/{id}`: `uid?` — who claimed this player. Claiming replaces "This is me" on the device
  (the device choice stays for guests). One account ↔ one player; a claim of an already claimed
  player is refused by the rules.
- `leagues/{id}`: `owner?` (uid), `admins?` (uids), `members?` (uids), `visibility?`
  (`'public' | 'link' | 'private'`, absent = public, as today), `invite?` handled below.
- Existing leagues get an owner by a one-off script the owner runs (as the 2017 migration):
  the owner's uid on his leagues; the rest stay ownerless and public until someone claims them
  (or are archived).

## Rules (one step at a time, each tested on the emulator first)

1. **Auth required to write** (`request.auth != null`, anonymous counts). No behaviour change for
   people, blocks scripted writes. Add **App Check** (reCAPTCHA Enterprise / v3, free tier)
   later against abuse.
2. **Moderators**: league settings, archive, delete and restore, removing players → `owner` or
   `admins` only (CLAUDE.md: "anyone may use it until sign-in brings a moderator"). This also
   allows **real deletion** of a league with its games and tournaments by its owner — today
   that needs the project owner's credentials (19 Oct: 10 test leagues, 52 games, 15
   tournaments waiting).
3. **Members play**: creating games in a league, scoring, tournaments → members (and anyone on a
   public league, as today, if the owner wants that kept).
4. **Private leagues**: `read` on a league's games, tournaments and the league itself only for
   members when `visibility != 'public'`; needs the per-league queries above.
5. **Joining by link**: the invite link carries a code; `leagues/{id}/invites/{code}` exists (made
   by an admin); a user adds themself to `members` with a write the rules check against
   `exists(.../invites/$(code))`. Revoking = deleting the invite document.

## What changes in the UI (small, proportionate)

- A "Zaloguj przez Google" row in the app menu / rail; the avatar of the account there.
- First sign-in: "Którym graczem jesteś?" becomes "claim your player" (the same sheet), stored on
  the account instead of the device.
- League settings: owner/admins, visibility, invite link; other users see settings read-only.
- Delete league: for its admins, "delete for good" next to "delete" (soft).

## Proposed order

1. Run the 2017 migration (ready; owner's go and gcloud token) — unblocks per-league queries.
2. Per-league data layer (games, tournaments, players, leagues of the user) — the scaling step,
   invisible to users; check with the Tour + e2e, then ship.
3. Anonymous + Google auth, `users/{uid}`, claiming a player; rules step 1 (auth to write).
4. League owners/admins (+ the owner's one-off script), rules step 2; real deletion for admins.
5. Members, visibility, invite links; rules steps 3–5.
6. App Check.

Steps 2 and 3 are independent; 2 is the bigger one and pays off even without sign-in.

## Open questions for the owner

- Should public leagues stay playable by anyone (guests included), or only by members?
- Overall ranking across all leagues: keep it (over the user's leagues) or drop it?
- Hosting: stay on GitHub Pages (popup sign-in) or move to Firebase Hosting (needed if the
  installed iOS app cannot complete the popup)?
- Who moderates ownerless leagues created before sign-in?
