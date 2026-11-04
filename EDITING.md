# Editing the menu, games and tournaments

The site reads these from three files, edited with [Pages CMS](https://app.pagescms.org):

| What | File |
|---|---|
| Menu sections, items and prices | `data/menu.json` |
| Games, rules and photos | `data/games.json` |
| Weekly tournaments (day, time, buy-in) | `data/tournaments.json` |

1. Go to https://app.pagescms.org and sign in with GitHub.
2. Open `yeonvvx/casino-merced` and pick the branch the site is published from.
3. Choose **Menu**, **Games** or **Tournaments** in the sidebar, edit, and press **Save**.

Each save is a commit, so GitHub Pages republishes the site within a couple of minutes.
Uploaded photos go to `assets/uploads/`. Always fill in "Photo description" so the
photo has alt text.

Tournament times use Merced time and the format `6:00 PM`. The countdown, the
flip board, the schedule table and the "twice a week" wording all update from
the tournament list. Turn off **Show on the site** to hide one without deleting it.

To hide a game without deleting it, set its **Status** to **Off (saved, not shown)**; set it back
to **On the site** to show it again. Each game's **BGC approvals** (base-game name and New BGC ID)
are shown in small print wherever the game appears, as the law requires.

The editor's fields are defined in `.pages.yml`.
