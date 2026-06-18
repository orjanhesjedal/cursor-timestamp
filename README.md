# Cursor Timestamp

An Obsidian plugin that inserts a configurable, timezone-aware date and time stamp wherever the cursor is. It is built for teams: pin a fixed time zone so collaborators in different places read the same instant, and prepend a name so every note shows who wrote what, and when.

```
Comment by Nathan 2026-06-18 @14:30:07:
2026-06-18 @14:30:07 CET Nathan wrote:
```

## Features

- Insert **date + time** at the cursor with one command or the ribbon button.
- Separate **Insert date** and **Insert time** commands for quick partial stamps.
- **Time zone**: follow this computer, or pin any IANA zone (for example `Europe/Oslo`). Conversions, including daylight saving, use the platform's time-zone database, so they are always correct.
- Optional **time-zone label** (`CET`, `GMT+2`, or the long name), placed before the date or after the time.
- Configurable **date** and **time** formats using familiar tokens.
- **Prefix** and **suffix** text, which together cover both `Comment by Nathan …:` and `… Nathan wrote:` layouts.
- **Bold**, **italic**, and **coloured** text. Colour uses an inline HTML span; bold and italic use plain Markdown when no colour is set, so notes stay clean.
- A **live preview** in settings so you can see the exact output before using it.
- Every command appears under **Settings → Hotkeys**, so you can bind your own shortcut.

## Install

### Manual (no build needed)

1. In your vault, open the folder `.obsidian/plugins/`.
2. Create a folder named `cursor-timestamp`.
3. Copy `main.js`, `manifest.json`, and `styles.css` into it.
4. In Obsidian, open **Settings → Community plugins**, then enable **Cursor Timestamp**.

### BRAT (recommended for automatic updates)

1. Install the community plugin **BRAT** (Beta Reviewer's Auto-update Tool).
2. Run the command **BRAT: Add a beta plugin for testing**.
3. Paste the GitHub repository address for this plugin.
4. BRAT installs it and keeps it updated whenever you publish a new release.

## Usage

Place the cursor, then either click the clock ribbon icon or run **Insert timestamp at cursor** from the command palette (or your assigned hotkey). The text is inserted at the cursor; if you have a selection, it is replaced.

## Settings

| Setting | What it does |
| --- | --- |
| Time zone | `System default`, or a fixed IANA zone shared by the team. |
| Date format | Token string, default `YYYY-MM-DD`. |
| Time format | Token string, default `HH:mm:ss`. |
| Between date and time | Text between the two, default ` @`. |
| Show time zone | Adds a `CET` / `GMT+2` label. |
| Label style / position / separator | How and where the label is shown. |
| Prefix | Text before the stamp, e.g. `Comment by Nathan `. |
| Suffix | Text after the stamp, e.g. `:` or ` Nathan wrote:`. |
| Bold / Italic / Coloured text / Colour | Styling of the inserted text. |

### Format tokens

Date: `YYYY` `YY` `MM` `M` `DD` `D` `MMMM` `MMM` `dddd` `ddd`
Time: `HH` `H` `hh` `h` `mm` `m` `ss` `s` `A` `a`

Letters that should stay literal can be wrapped in square brackets, e.g. `[week] w`.

## Build from source

Requires Node.js 18 or newer.

```bash
npm install
npm run build      # type-checks, then writes main.js
```

Use `npm run dev` while developing to rebuild on save.

## Release a new version

```bash
npm version patch   # bumps manifest.json + versions.json
git push --follow-tags
```

The included GitHub Actions workflow builds the plugin and attaches `main.js`, `manifest.json`, and `styles.css` to a draft release. Publish the draft, and BRAT users update automatically.

## License

MIT © Ørjan Hesjedal
