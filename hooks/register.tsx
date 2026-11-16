import { atom, read, update } from 'claude-code'
import type { Register, StateDollar, ThemeResult, ThemeSetArgs } from 'claude-code'

import type { ModelRow } from '../types'

// The colour used until /convo-color is run: a light beige.
const DEFAULT_HEX = 'f5eedc'
// The app's own light colour for the sidebar, kept as it is.
const SIDEBAR_COLOUR = '#fcfcfb'
// The sidebar's width in pixels. The white column drawn under it has this width.
const SIDEBAR_WIDTH = 280
// The app's own text colours: the main text in its light mode and in its dark mode, and the faint grey text, the same in both.
const LIGHT_MAIN_TEXT = '#0b0b0b'
const DARK_MAIN_TEXT = '#f0efec'
const FAINT_TEXT = '#898781'
// The app's own dark colour for the sidebar, kept as it is when the window is drawn dark.
const DARK_SIDEBAR_COLOUR = '#151515'
const MAIN_TEXT_MIN = 4.5
const FAINT_TEXT_MIN = 3

// Whether the picker row above the prompt box is showing.
const picking = atom({ plugin: 'convo-color', key: 'picking' } as const, false)

// The update offer above the prompt box: null until a newer version is found on GitHub.
const offer = atom({ plugin: 'convo-color', key: 'update' } as const, null)

// The model row for the model in use: null until the session's model is known.
const MODEL_ROW = atom({ plugin: 'convo-color', key: 'model-row' } as const, null as ModelRow | null)
// Whether the model row is on. On by default; /convo-color row off turns it off, and the choice is kept between sessions.
const ROW_ON = atom({ plugin: 'convo-color', key: 'row-on' } as const, true)
// The colours the person chose for a family's row, by family name. A family not in it keeps its own colour.
const ROW_COLOURS = atom({ plugin: 'convo-color', key: 'row-colours' } as const, {} as Record<string, string>)
// What the picker colours: the window, or the row of the model in use. Closing the picker sets it back to the window.
const TARGET = atom({ plugin: 'convo-color', key: 'target' } as const, 'window' as 'window' | 'row')
// Which set the grid shows: the person's choice, or null for the set of the colour being edited, worked out each time and never stored.
const SET_CHOICE = atom({ plugin: 'convo-color', key: 'set' } as const, null as 'light' | 'dark' | null)
// Whether the background colour is shown. It follows the typed /convo-color off, the picker's Show button and any colour chosen.
const BACKGROUND_ON = atom({ plugin: 'convo-color', key: 'background-on' } as const, true)

// The colour palette: the default colours of Tailwind CSS (version 4.3, https://tailwindcss.com/docs/colors), 26 families in 11 shades each, one
// line to a shade (50 to 950), the families side by side in Tailwind's own order. Tailwind gives the colours in OKLCH, so the hex digits here are
// converted from them. The full palette is used, with no contrast rule. The names are labels only, shown in the message after a press:
// they cannot be typed. The row's text is whichever of dark and white reads better.
// The picker shows the palette in two sets of whole lines, so each set is a clean block: the light set is the shades 50 to 400 and the dark set the
// shades 700 to 950. A set is 17 patches wide, the chromatic families from Red to Rose, one line to a shade. The nine neutral families (Slate to Mist)
// would make it 26 wide, so they stand under the shades instead, as many as fit whole lines of 17, so each set ends on Rose,
// the neutrals stand under it as a neat rectangle and the ones that differ most are kept, which came to one line. In Tailwind every colour of those lines is one the app shows in its light mode (shades up to 400) or in its dark mode (shades from
// 700), so a colour of the light set never turns the app dark and one of the dark set never turns it light; a test checks it with the same test the window
// uses (schemeFor). The shades 500 and 600 are in neither set, because for some families they fall on one side of that cut and for others on the other,
// which left the sets ragged. They can still be typed as hex digits.
type Patch = readonly [hex: string, name: string]
const PALETTE: ReadonlyArray<Patch> = [
  ['fef2f2', 'Red 50'], ['fff7ed', 'Orange 50'], ['fffbeb', 'Amber 50'], ['fefce8', 'Yellow 50'], ['f7fee7', 'Lime 50'], ['f0fdf4', 'Green 50'], ['ecfdf5', 'Emerald 50'], ['f0fdfa', 'Teal 50'], ['ecfeff', 'Cyan 50'], ['f0f9ff', 'Sky 50'], ['eff6ff', 'Blue 50'], ['eef2ff', 'Indigo 50'], ['f5f3ff', 'Violet 50'], ['faf5ff', 'Purple 50'], ['fdf4ff', 'Fuchsia 50'], ['fdf2f8', 'Pink 50'], ['fff1f2', 'Rose 50'], ['f8fafc', 'Slate 50'], ['f9fafb', 'Gray 50'], ['fafafa', 'Zinc 50'], ['fafafa', 'Neutral 50'], ['fafaf9', 'Stone 50'], ['fbfaf9', 'Taupe 50'], ['fafafa', 'Mauve 50'], ['fbfbf9', 'Olive 50'], ['f9fbfb', 'Mist 50'],
  ['ffe2e2', 'Red 100'], ['ffedd4', 'Orange 100'], ['fef3c6', 'Amber 100'], ['fef9c2', 'Yellow 100'], ['ecfcca', 'Lime 100'], ['dcfce7', 'Green 100'], ['d0fae5', 'Emerald 100'], ['cbfbf1', 'Teal 100'], ['cefafe', 'Cyan 100'], ['dff2fe', 'Sky 100'], ['dbeafe', 'Blue 100'], ['e0e7ff', 'Indigo 100'], ['ede9fe', 'Violet 100'], ['f3e8ff', 'Purple 100'], ['fae8ff', 'Fuchsia 100'], ['fce7f3', 'Pink 100'], ['ffe4e6', 'Rose 100'], ['f1f5f9', 'Slate 100'], ['f3f4f6', 'Gray 100'], ['f4f4f5', 'Zinc 100'], ['f5f5f5', 'Neutral 100'], ['f5f5f4', 'Stone 100'], ['f3f1f1', 'Taupe 100'], ['f3f1f3', 'Mauve 100'], ['f4f4f0', 'Olive 100'], ['f1f3f3', 'Mist 100'],
  ['ffc9c9', 'Red 200'], ['ffd6a7', 'Orange 200'], ['fee685', 'Amber 200'], ['fff085', 'Yellow 200'], ['d8f999', 'Lime 200'], ['b9f8cf', 'Green 200'], ['a4f4cf', 'Emerald 200'], ['96f7e4', 'Teal 200'], ['a2f4fd', 'Cyan 200'], ['b8e6fe', 'Sky 200'], ['bedbff', 'Blue 200'], ['c6d2ff', 'Indigo 200'], ['ddd6ff', 'Violet 200'], ['e9d4ff', 'Purple 200'], ['f6cfff', 'Fuchsia 200'], ['fccee8', 'Pink 200'], ['ffccd3', 'Rose 200'], ['e2e8f0', 'Slate 200'], ['e5e7eb', 'Gray 200'], ['e4e4e7', 'Zinc 200'], ['e5e5e5', 'Neutral 200'], ['e7e5e4', 'Stone 200'], ['e8e4e3', 'Taupe 200'], ['e7e4e7', 'Mauve 200'], ['e8e8e3', 'Olive 200'], ['e3e7e8', 'Mist 200'],
  ['ffa2a2', 'Red 300'], ['ffb86a', 'Orange 300'], ['ffd230', 'Amber 300'], ['ffdf20', 'Yellow 300'], ['bbf451', 'Lime 300'], ['7bf1a8', 'Green 300'], ['5ee9b5', 'Emerald 300'], ['46ecd5', 'Teal 300'], ['53eafd', 'Cyan 300'], ['74d4ff', 'Sky 300'], ['8ec5ff', 'Blue 300'], ['a3b3ff', 'Indigo 300'], ['c4b4ff', 'Violet 300'], ['dab2ff', 'Purple 300'], ['f4a8ff', 'Fuchsia 300'], ['fda5d5', 'Pink 300'], ['ffa1ad', 'Rose 300'], ['cad5e2', 'Slate 300'], ['d1d5dc', 'Gray 300'], ['d4d4d8', 'Zinc 300'], ['d4d4d4', 'Neutral 300'], ['d6d3d1', 'Stone 300'], ['d8d2d0', 'Taupe 300'], ['d7d0d7', 'Mauve 300'], ['d8d8d0', 'Olive 300'], ['d0d6d8', 'Mist 300'],
  ['ff6467', 'Red 400'], ['ff8904', 'Orange 400'], ['ffb900', 'Amber 400'], ['fdc700', 'Yellow 400'], ['9ae600', 'Lime 400'], ['05df72', 'Green 400'], ['00d492', 'Emerald 400'], ['00d5be', 'Teal 400'], ['00d3f2', 'Cyan 400'], ['00bcff', 'Sky 400'], ['51a2ff', 'Blue 400'], ['7c86ff', 'Indigo 400'], ['a684ff', 'Violet 400'], ['c27aff', 'Purple 400'], ['ed6aff', 'Fuchsia 400'], ['fb64b6', 'Pink 400'], ['ff637e', 'Rose 400'], ['90a1b9', 'Slate 400'], ['99a1af', 'Gray 400'], ['9f9fa9', 'Zinc 400'], ['a1a1a1', 'Neutral 400'], ['a6a09b', 'Stone 400'], ['aba09c', 'Taupe 400'], ['a89ea9', 'Mauve 400'], ['abab9c', 'Olive 400'], ['9ca8ab', 'Mist 400'],
  ['fb2c36', 'Red 500'], ['ff6900', 'Orange 500'], ['fe9a00', 'Amber 500'], ['f0b100', 'Yellow 500'], ['7ccf00', 'Lime 500'], ['00c950', 'Green 500'], ['00bc7d', 'Emerald 500'], ['00bba7', 'Teal 500'], ['00b8db', 'Cyan 500'], ['00a6f4', 'Sky 500'], ['2b7fff', 'Blue 500'], ['615fff', 'Indigo 500'], ['8e51ff', 'Violet 500'], ['ad46ff', 'Purple 500'], ['e12afb', 'Fuchsia 500'], ['f6339a', 'Pink 500'], ['ff2056', 'Rose 500'], ['62748e', 'Slate 500'], ['6a7282', 'Gray 500'], ['71717b', 'Zinc 500'], ['737373', 'Neutral 500'], ['79716b', 'Stone 500'], ['7c6d67', 'Taupe 500'], ['79697b', 'Mauve 500'], ['7c7c67', 'Olive 500'], ['67787c', 'Mist 500'],
  ['e7000b', 'Red 600'], ['f54900', 'Orange 600'], ['e17100', 'Amber 600'], ['d08700', 'Yellow 600'], ['5ea500', 'Lime 600'], ['00a63e', 'Green 600'], ['009966', 'Emerald 600'], ['009689', 'Teal 600'], ['0092b8', 'Cyan 600'], ['0084d1', 'Sky 600'], ['155dfc', 'Blue 600'], ['4f39f6', 'Indigo 600'], ['7f22fe', 'Violet 600'], ['9810fa', 'Purple 600'], ['c800de', 'Fuchsia 600'], ['e60076', 'Pink 600'], ['ec003f', 'Rose 600'], ['45556c', 'Slate 600'], ['4a5565', 'Gray 600'], ['52525c', 'Zinc 600'], ['525252', 'Neutral 600'], ['57534d', 'Stone 600'], ['5b4f4b', 'Taupe 600'], ['594c5b', 'Mauve 600'], ['5b5b4b', 'Olive 600'], ['4b585b', 'Mist 600'],
  ['c10007', 'Red 700'], ['ca3500', 'Orange 700'], ['bb4d00', 'Amber 700'], ['a65f00', 'Yellow 700'], ['497d00', 'Lime 700'], ['008236', 'Green 700'], ['007a55', 'Emerald 700'], ['00786f', 'Teal 700'], ['007595', 'Cyan 700'], ['0069a8', 'Sky 700'], ['1447e6', 'Blue 700'], ['432dd7', 'Indigo 700'], ['7008e7', 'Violet 700'], ['8200db', 'Purple 700'], ['a800b7', 'Fuchsia 700'], ['c6005c', 'Pink 700'], ['c70036', 'Rose 700'], ['314158', 'Slate 700'], ['364153', 'Gray 700'], ['3f3f46', 'Zinc 700'], ['404040', 'Neutral 700'], ['44403b', 'Stone 700'], ['473c39', 'Taupe 700'], ['463947', 'Mauve 700'], ['474739', 'Olive 700'], ['394447', 'Mist 700'],
  ['9f0712', 'Red 800'], ['9f2d00', 'Orange 800'], ['973c00', 'Amber 800'], ['894b00', 'Yellow 800'], ['3c6300', 'Lime 800'], ['016630', 'Green 800'], ['006045', 'Emerald 800'], ['005f5a', 'Teal 800'], ['005f78', 'Cyan 800'], ['00598a', 'Sky 800'], ['193cb8', 'Blue 800'], ['372aac', 'Indigo 800'], ['5d0ec0', 'Violet 800'], ['6e11b0', 'Purple 800'], ['8a0194', 'Fuchsia 800'], ['a3004c', 'Pink 800'], ['a50036', 'Rose 800'], ['1d293d', 'Slate 800'], ['1e2939', 'Gray 800'], ['27272a', 'Zinc 800'], ['262626', 'Neutral 800'], ['292524', 'Stone 800'], ['2b2422', 'Taupe 800'], ['2a212c', 'Mauve 800'], ['2b2b22', 'Olive 800'], ['22292b', 'Mist 800'],
  ['82181a', 'Red 900'], ['7e2a0c', 'Orange 900'], ['7b3306', 'Amber 900'], ['733e0a', 'Yellow 900'], ['35530e', 'Lime 900'], ['0d542b', 'Green 900'], ['004f3b', 'Emerald 900'], ['0b4f4a', 'Teal 900'], ['104e64', 'Cyan 900'], ['024a70', 'Sky 900'], ['1c398e', 'Blue 900'], ['312c85', 'Indigo 900'], ['4d179a', 'Violet 900'], ['59168b', 'Purple 900'], ['721378', 'Fuchsia 900'], ['861043', 'Pink 900'], ['8b0836', 'Rose 900'], ['0f172b', 'Slate 900'], ['101828', 'Gray 900'], ['18181b', 'Zinc 900'], ['171717', 'Neutral 900'], ['1c1917', 'Stone 900'], ['1d1816', 'Taupe 900'], ['1d161e', 'Mauve 900'], ['1d1d16', 'Olive 900'], ['161b1d', 'Mist 900'],
  ['460809', 'Red 950'], ['441306', 'Orange 950'], ['461901', 'Amber 950'], ['432004', 'Yellow 950'], ['192e03', 'Lime 950'], ['032e15', 'Green 950'], ['002c22', 'Emerald 950'], ['022f2e', 'Teal 950'], ['053345', 'Cyan 950'], ['052f4a', 'Sky 950'], ['162456', 'Blue 950'], ['1e1a4d', 'Indigo 950'], ['2f0d68', 'Violet 950'], ['3c0366', 'Purple 950'], ['4b004f', 'Fuchsia 950'], ['510424', 'Pink 950'], ['4d0218', 'Rose 950'], ['020618', 'Slate 950'], ['030712', 'Gray 950'], ['09090b', 'Zinc 950'], ['0a0a0a', 'Neutral 950'], ['0c0a09', 'Stone 950'], ['0c0a09', 'Taupe 950'], ['0c090c', 'Mauve 950'], ['0c0c09', 'Olive 950'], ['090b0c', 'Mist 950'],
]

// The number of colours in a line of the grid: the 17 chromatic families of Tailwind, Red to Rose.
const LINE_LENGTH = 17
// The number of families in a line of PALETTE: the 17 chromatic ones and the 9 neutral ones (Slate to Mist).
const FAMILIES = 26
// The width of one line of patches, in character cells. A cell is about 9 pixels wide in the desktop app (measured there). The 17
// patches of a line share this width equally with no gap between them, so each is about 18 pixels and the line is about 312 pixels. It was 51 cells
// (patches of 27 pixels). It is narrower so that the picker still fits when the conversation is narrowed.
const LINE_WIDTH = 34
// The width a patch starts from, in character cells, before it grows to its share of the line.
const SWATCH_WIDTH = 2
// The key of a patch, from its name: "Red 500" becomes "red-500".
function slug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}
// The line under the light set: 17 beige patches from the palest to the darkest that still keeps the app in its light mode, in place of
// the neutral greys, which were too alike to tell apart. They are not Tailwind colours. They step evenly in OKLab lightness from 0.975 to 0.60, about 0.02
// apart where the greys were 0.011. The hue is a warm beige, 72 degrees at the pale end and 68 at the dark end, with little colour in it (0.012 growing to
// 0.038), a greyish beige. A first ramp at about 89 degrees looked greenish, a second at 75 to 62 degrees with more colour looked too brown and a third at 82 to 77
// still had a little too much green. The darkest is still light for the app's own test (schemeFor): dark text on it reads 4.9 to 1 against 3.5 to 1 for light text. A test holds
// every patch to that test.
const BEIGE: ReadonlyArray<Patch> = [
  ['fcf6ee', 'Beige 1'], ['f5eee5', 'Beige 2'], ['eee6dd', 'Beige 3'], ['e7ded4', 'Beige 4'], ['e0d6cb', 'Beige 5'], ['d9cec2', 'Beige 6'], ['d2c7ba', 'Beige 7'], ['cbbfb1', 'Beige 8'], ['c4b7a9', 'Beige 9'],
  ['beb0a1', 'Beige 10'], ['b7a898', 'Beige 11'], ['b0a190', 'Beige 12'], ['aa9988', 'Beige 13'], ['a39280', 'Beige 14'], ['9d8b78', 'Beige 15'], ['968470', 'Beige 16'], ['907c68', 'Beige 17'],
]
// The neutral patches that stand in one line under the dark set, from lightest to darkest. There are 36 neutral patches in the dark set. The ones taken
// away are Olive 950 to Gray 950, Taupe 800, Gray 700, Taupe 700, Neutral 700, Slate 900, Olive 700 and Stone 700, which left 19, and the two of
// those that were closest to another (Slate 800 and Neutral 800) went too. The two nearest that stay are 0.0082 apart in OKLab. A test checks the list against the palette.
const DARK_NEUTRALS: ReadonlyArray<string> = [
  'Mist 700', 'Slate 700', 'Zinc 700', 'Mauve 700', 'Olive 800', 'Gray 800', 'Mist 800', 'Zinc 800', 'Stone 800', 'Mauve 800', 'Olive 900', 'Mist 900', 'Taupe 900', 'Mauve 900', 'Zinc 900', 'Gray 900', 'Neutral 900',
]
// The lines of a set: one line to a shade for the chromatic families (the light set is the first five lines of PALETTE, shades 50 to 400, and the dark set
// the last four, 700 to 950), then one line of 17: the beige ramp under the light set and the kept neutrals under the dark set.
const LIGHT_LINES = 5
const DARK_FIRST_LINE = 7
function setLines(set: Scheme): ReadonlyArray<ReadonlyArray<Patch>> {
  const shades = Array.from({ length: PALETTE.length / FAMILIES }, (_, line) => PALETTE.slice(line * FAMILIES, line * FAMILIES + LINE_LENGTH))
  const byName = new Map(PALETTE.map(patch => [patch[1], patch] as const))
  const neutrals = set === 'light' ? BEIGE : DARK_NEUTRALS.map(name => byName.get(name) as Patch)
  const underneath = Array.from({ length: neutrals.length / LINE_LENGTH }, (_, line) => neutrals.slice(line * LINE_LENGTH, (line + 1) * LINE_LENGTH))

  return [...(set === 'light' ? shades.slice(0, LIGHT_LINES) : shades.slice(DARK_FIRST_LINE)), ...underneath]
}

// The label of a colour's button: blank room, one half-wide space (U+2002), so the button shows its colour and no words
// and 26 of them fit in one line. An ordinary space would be dropped by the desktop app.
const SWATCH_ROOM = '\u2002'
// The labels of the radio-style buttons and of Show, Reset and Set are padded with half-wide spaces to the same length, since a button
// takes the width of its text. The longest radio label is "◉ Light mode", and Show is "☑ Show".
const RADIO_LENGTH = 13
// Light mode and Dark mode are padded further, to the pixel widths measured in a screenshot (one half-wide space about 7.5 pixels):
// Light mode to the width of Background, and Dark mode to the right edge of Reset, which it stands over together with Show.
const LIGHT_LENGTH = 14
const DARK_LENGTH = 17
const SHOW_LENGTH = 6
// Reset and Set are one half-wide space longer, so the three buttons of a column come out about 79 pixels wide, as Show does
// (measured in a screenshot: Show 79, Reset 71 or 72, Set 69 at the old length).
const RESET_LENGTH = 7
// Set is the field's own button: 8 half-wide spaces long makes it 79 pixels wide, as wide as Reset (72 at length 7, measured in the desktop app).
const SET_LENGTH = 8
// A hair space (U+200A) is finer than a half-wide space, about 1.4 pixels against 7.2 by my estimate from the same screenshot. A few of them close the
// last pixels between buttons (measured in an enlarged screenshot, 4.68 times life size): Background came out 1 pixel and
// LLM model 2 pixels narrower than Light mode.
const FINE_ROOM = '\u200a'
const BACKGROUND_FINE = 1
const MODEL_FINE = 2
function padLabel(text: string, length: number, fine = 0): string {
  return text + SWATCH_ROOM.repeat(Math.max(0, length - text.length)) + FINE_ROOM.repeat(fine)
}
// The picker's controls stand in three columns of fixed width, in character cells (a cell is about 9 pixels in the desktop app, measured in
// a screenshot), so that a button's own width cannot push the next one out of line: the radio buttons stand in the first
// column (about 123 pixels wide, 136 here), Show and Dark mode in the second (79 and 173 wide, 91 here), Reset and Set in the third (79 wide, 82 here).
// The first column is 16.25 cells (149 pixels), so the gap after the radio buttons is the same 12 pixels as the gap after Show (measured in the desktop app: the radio
// buttons are 137 pixels wide and Show 79 in a column of 91). It was 15 cells, which left 2 pixels and set Light mode against Dark mode.
// The gaps and padding are as small as they can be, so that the picker fits when the conversation is narrowed, and the buttons
// cannot be narrower than their words. The gaps are now about 6 pixels instead of 12 or 13: column one is 15.6 cells (143 pixels for buttons of 137) and
// column two 9.25 cells (85 pixels for Show of 79). Dark mode is one half-wide space shorter, since it spans Show, the gap and Reset (79 + 6 + 79 = 164 pixels).
const COLUMN_ONE = 15.6
const COLUMN_TWO = 9.25
const COLUMN_THREE = 9
// The page the picker's Help link opens: the project's page on GitHub, which shows the README, the add-on's one page
// of instructions. The address has no #readme at its end.
const HELP_URL = 'https://github.com/paul-van-cotthem/claude-convo-color'

// The public file on GitHub that names the newest released version. Reading it sends no personal data, only the request itself.
const MANIFEST_URL = 'https://raw.githubusercontent.com/paul-van-cotthem/claude-convo-color/main/.claude-plugin/plugin.json'
// The two commands that update the add-on, run in one shell. The desktop app's own search path may lack the folder where Claude Code lives, so the usual folders are added.
const UPDATE_SCRIPT =
  'PATH="$PATH:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin"; claude plugin marketplace update convo-color && claude plugin update convo-color@convo-color'
// The same two commands, as the person can paste them into a terminal if the update could not run from here.
const UPDATE_BY_HAND = 'claude plugin marketplace update convo-color, then claude plugin update convo-color@convo-color'
const VERSION = /^\d+\.\d+\.\d+$/
// The version of this copy. It is written here, not read from a file, and must match the version in .claude-plugin/plugin.json. No test checks this, so change both together.
const INSTALLED_VERSION = '0.6.1'

// What the update check needs from the engine.
type UpdateTools = {
  http: { fetch: (url: string) => Promise<{ ok: boolean; text: string }> }
  process: { run: (argv: readonly string[], init?: { timeoutMs?: number }) => Promise<{ exitCode: number }> }
}

// True when version a is newer than version b. Both are three whole numbers separated by dots.
function isNewer(a: string, b: string): boolean {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)

  for (let index = 0; index < 3; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)

    if (difference !== 0) {
      return difference > 0
    }
  }

  return false
}

// The newest version on GitHub. Any failure gives undefined and shows the person nothing.
async function latestVersion($: UpdateTools): Promise<string | undefined> {
  try {
    const response = await $.http.fetch(MANIFEST_URL)

    if (!response.ok) {
      return undefined
    }
    const manifest = JSON.parse(response.text) as { version?: unknown }

    return typeof manifest.version === 'string' && VERSION.test(manifest.version) ? manifest.version : undefined
  } catch {
    return undefined
  }
}

// What the check found, in a sentence, and whether it reached GitHub at all.
type CheckResult = { text: string; reached: boolean }

// Looks on GitHub and, when a newer version exists, puts the offer above the prompt box.
async function checkForUpdate($: UpdateTools & StateDollar): Promise<CheckResult> {
  const installed = INSTALLED_VERSION
  const latest = await latestVersion($)

  if (latest === undefined) {
    return { text: 'The update check could not reach GitHub. Nothing was changed.', reached: false }
  }
  if (!isNewer(latest, installed)) {
    return { text: `You have the newest version, ${installed}.`, reached: true }
  }
  await update($, offer, () => ({ latest, installed, step: 'offer' as const }))

  return { text: `Version ${latest} is available. You have ${installed}. The row above the prompt box offers to update.`, reached: true }
}

// The automatic check. It is tried when the app attaches and at each prompt until it has reached GitHub once, and at most this many times,
// so a computer that is offline is not asked again and again.
const MAX_ATTEMPTS = 3
// How long the session waits for one try, in milliseconds. A slow answer still counts when it arrives, but nobody waits for it.
const ATTEMPT_WAIT_MS = 4000

type Clock = { clock: { after: (ms: number, fn: () => void) => { cancel: () => void } } }

let attempts = 0
let hasReached = false
let isChecking = false

async function ensureUpdateCheck($: UpdateTools & StateDollar & Clock): Promise<void> {
  if (hasReached || isChecking || attempts >= MAX_ATTEMPTS) {
    return
  }
  attempts += 1
  isChecking = true
  const work = checkForUpdate($)
    .then(result => {
      hasReached = result.reached
    })
    .catch(() => undefined)
    .finally(() => {
      isChecking = false
    })

  // The wait is a convenience. If the clock is refused, the session simply does not wait for the check at all.
  await new Promise<void>(resolve => {
    try {
      const timer = $.clock.after(ATTEMPT_WAIT_MS, resolve)

      void work.then(() => {
        timer.cancel()
        resolve()
      })
    } catch {
      resolve()
    }
  })
}

// Runs the two update commands. The result is on screen as the row's next step: done, or failed with the commands to paste by hand.
async function runUpdate($: UpdateTools & StateDollar, latest: string, installed: string): Promise<void> {
  await update($, offer, () => ({ latest, installed, step: 'running' as const }))
  let step: 'done' | 'failed' = 'failed'

  try {
    const result = await $.process.run(['/bin/sh', '-c', UPDATE_SCRIPT], { timeoutMs: 120_000 })

    step = result.exitCode === 0 ? 'done' : 'failed'
  } catch {
    step = 'failed'
  }
  await update($, offer, () => ({ latest, installed, step }))
}

// The sentence beside the update buttons.
function offerText(state: { latest: string; installed: string; step: 'offer' | 'running' | 'done' | 'failed' }): string {
  switch (state.step) {
    case 'offer':
      return `convo-color ${state.latest} is available. You have ${state.installed}.`
    case 'running':
      return `Updating convo-color to ${state.latest}…`
    case 'done':
      return 'convo-color is updated. Type /reload-plugins to use the new version now, or start a new session.'
    default:
      return `The update could not run from here. In a terminal (on Windows: PowerShell), run these two commands one after the other: ${UPDATE_BY_HAND}.`
  }
}

const STORE_KEY = 'colour'
// The store key of the background's on or off choice, kept between sessions. Nothing stored means on. Off keeps the colour above.
const BACKGROUND_STORE_KEY = 'background'
const SCENE_PREFIX = 'convo-'
const HEX = /^#?([0-9a-f]{6})$/i
const SCENE_ID = /^convo-([0-9a-f]{6})$/

// The 148 colour names of CSS, written as six hex digits. Spaces, hyphens and capitals in what you type are ignored.
const NAMES: Record<string, string> = {
  aliceblue: "f0f8ff",
  antiquewhite: "faebd7",
  aqua: "00ffff",
  aquamarine: "7fffd4",
  azure: "f0ffff",
  beige: "f5f5dc",
  bisque: "ffe4c4",
  black: "000000",
  blanchedalmond: "ffebcd",
  blue: "0000ff",
  blueviolet: "8a2be2",
  brown: "a52a2a",
  burlywood: "deb887",
  cadetblue: "5f9ea0",
  chartreuse: "7fff00",
  chocolate: "d2691e",
  coral: "ff7f50",
  cornflowerblue: "6495ed",
  cornsilk: "fff8dc",
  crimson: "dc143c",
  cyan: "00ffff",
  darkblue: "00008b",
  darkcyan: "008b8b",
  darkgoldenrod: "b8860b",
  darkgray: "a9a9a9",
  darkgreen: "006400",
  darkgrey: "a9a9a9",
  darkkhaki: "bdb76b",
  darkmagenta: "8b008b",
  darkolivegreen: "556b2f",
  darkorange: "ff8c00",
  darkorchid: "9932cc",
  darkred: "8b0000",
  darksalmon: "e9967a",
  darkseagreen: "8fbc8f",
  darkslateblue: "483d8b",
  darkslategray: "2f4f4f",
  darkslategrey: "2f4f4f",
  darkturquoise: "00ced1",
  darkviolet: "9400d3",
  deeppink: "ff1493",
  deepskyblue: "00bfff",
  dimgray: "696969",
  dimgrey: "696969",
  dodgerblue: "1e90ff",
  firebrick: "b22222",
  floralwhite: "fffaf0",
  forestgreen: "228b22",
  fuchsia: "ff00ff",
  gainsboro: "dcdcdc",
  ghostwhite: "f8f8ff",
  gold: "ffd700",
  goldenrod: "daa520",
  gray: "808080",
  green: "008000",
  greenyellow: "adff2f",
  grey: "808080",
  honeydew: "f0fff0",
  hotpink: "ff69b4",
  indianred: "cd5c5c",
  indigo: "4b0082",
  ivory: "fffff0",
  khaki: "f0e68c",
  lavender: "e6e6fa",
  lavenderblush: "fff0f5",
  lawngreen: "7cfc00",
  lemonchiffon: "fffacd",
  lightblue: "add8e6",
  lightcoral: "f08080",
  lightcyan: "e0ffff",
  lightgoldenrodyellow: "fafad2",
  lightgray: "d3d3d3",
  lightgreen: "90ee90",
  lightgrey: "d3d3d3",
  lightpink: "ffb6c1",
  lightsalmon: "ffa07a",
  lightseagreen: "20b2aa",
  lightskyblue: "87cefa",
  lightslategray: "778899",
  lightslategrey: "778899",
  lightsteelblue: "b0c4de",
  lightyellow: "ffffe0",
  lime: "00ff00",
  limegreen: "32cd32",
  linen: "faf0e6",
  magenta: "ff00ff",
  maroon: "800000",
  mediumaquamarine: "66cdaa",
  mediumblue: "0000cd",
  mediumorchid: "ba55d3",
  mediumpurple: "9370db",
  mediumseagreen: "3cb371",
  mediumslateblue: "7b68ee",
  mediumspringgreen: "00fa9a",
  mediumturquoise: "48d1cc",
  mediumvioletred: "c71585",
  midnightblue: "191970",
  mintcream: "f5fffa",
  mistyrose: "ffe4e1",
  moccasin: "ffe4b5",
  navajowhite: "ffdead",
  navy: "000080",
  oldlace: "fdf5e6",
  olive: "808000",
  olivedrab: "6b8e23",
  orange: "ffa500",
  orangered: "ff4500",
  orchid: "da70d6",
  palegoldenrod: "eee8aa",
  palegreen: "98fb98",
  paleturquoise: "afeeee",
  palevioletred: "db7093",
  papayawhip: "ffefd5",
  peachpuff: "ffdab9",
  peru: "cd853f",
  pink: "ffc0cb",
  plum: "dda0dd",
  powderblue: "b0e0e6",
  purple: "800080",
  rebeccapurple: "663399",
  red: "ff0000",
  rosybrown: "bc8f8f",
  royalblue: "4169e1",
  saddlebrown: "8b4513",
  salmon: "fa8072",
  sandybrown: "f4a460",
  seagreen: "2e8b57",
  seashell: "fff5ee",
  sienna: "a0522d",
  silver: "c0c0c0",
  skyblue: "87ceeb",
  slateblue: "6a5acd",
  slategray: "708090",
  slategrey: "708090",
  snow: "fffafa",
  springgreen: "00ff7f",
  steelblue: "4682b4",
  tan: "d2b48c",
  teal: "008080",
  thistle: "d8bfd8",
  tomato: "ff6347",
  turquoise: "40e0d0",
  violet: "ee82ee",
  wheat: "f5deb3",
  white: "ffffff",
  whitesmoke: "f5f5f5",
  yellow: "ffff00",
  yellowgreen: "9acd32",
}

// Six hex digits, with or without #, or a CSS colour name. Anything else gives undefined.
function parseColour(typed: string): string | undefined {
  const hex = HEX.exec(typed)

  if (hex !== null) {
    return (hex[1] ?? '').toLowerCase()
  }
  const name = typed.toLowerCase().replace(/[\s_-]+/g, '')

  if (Object.hasOwn(NAMES, name)) {
    return NAMES[name]
  }
  // The picker's own names, such as sage, are labels only and cannot be typed.

  return undefined
}

function luminance(hex: string): number {
  const channel = (start: number): number => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255

    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
}

function contrast(textHex: string, backgroundHex: string): number {
  const a = luminance(textHex.replace('#', ''))
  const b = luminance(backgroundHex)

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

type Scheme = 'light' | 'dark'

// The app's mode in which its own main text is more readable on this colour. The window is drawn in that mode,
// whatever the app's setting is, so a pale colour gets dark text and a deep colour gets pale text.
function schemeFor(hex: string): Scheme {
  return contrast(LIGHT_MAIN_TEXT, hex) >= contrast(DARK_MAIN_TEXT, hex) ? 'light' : 'dark'
}

// No viewBox, so one unit is one pixel and the sidebar's column keeps its width whatever the window's size.
function scene(hex: string, scheme: Scheme): string {
  const column = scheme === 'light' ? SIDEBAR_COLOUR : DARK_SIDEBAR_COLOUR

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="#${hex}"/><rect width="${SIDEBAR_WIDTH}" height="100%" fill="${column}"/></svg>`
}

// The scene's name carries the colour, so a new colour is a new scene and the app draws it again.
// The glass barely tints, so the strip behind the prompt box takes the colour and the sidebar keeps its own look.
// The veil is white over a pale colour and black over a deep one, so it never pulls the colour toward the wrong end.
// The theme is written out at each call of $.theme.set below, in applyColour and in ensureLook.

// The two things a colour change needs from the engine, so the command and the picker row share one path.
type Tools = {
  theme: { set: (attributes: ThemeSetArgs) => Promise<ThemeResult>; clear: () => Promise<unknown> }
  store: { set: (key: string, value: unknown) => Promise<void> }
}

// Sets the colour, remembers it, and says in one sentence what happened. Any colour is accepted.
async function applyColour($: Tools & StateDollar, hex: string, named: string): Promise<string> {
  const scheme = schemeFor(hex)
  const main = contrast(scheme === 'light' ? LIGHT_MAIN_TEXT : DARK_MAIN_TEXT, hex)
  const set = await $.theme.set({
    backdrop: { scene: `${SCENE_PREFIX}${hex}`, glass: { blur: 8, tint: scheme === 'light' ? '#ffffff' : '#000000', opacity: 0.12 } },
    overrideColorScheme: scheme,
  })

  if (!set.isDrawn) {
    return `Not drawn: ${set.reason}`
  }
  isDrawn = true
  mine = hex
  await $.store.set(STORE_KEY, `#${hex}`)
  // Choosing a colour shows the background again, for the sessions that follow too.
  await $.store.set(BACKGROUND_STORE_KEY, 'on')
  await update($, BACKGROUND_ON, () => true)
  const faint = contrast(FAINT_TEXT, hex)
  const mainWarning = main < MAIN_TEXT_MIN ? ` The main text is only ${main.toFixed(1)} to 1 on it, which is hard to read. A paler or a deeper colour reads better.` : ''
  const faintWarning = faint < FAINT_TEXT_MIN ? ` The faint grey text is only ${faint.toFixed(1)} to 1 on it, so it may be hard to read.` : ''

  return `Conversation colour set to #${hex}${named}. The window is drawn in ${scheme} mode so the text stays readable.${mainWarning}${faintWarning}`
}

// Whether the colour is drawn in this session yet. At session start the desktop app is often not attached, so the first try can fail.
let isDrawn = false
// This session's own colour: six hex digits, or 'off', or undefined while the session has not drawn one yet.
// A session keeps its own colour. The saved colour in the store, the last one chosen in any session, is only the starting point for a new session.
let mine: string | undefined
// The window colour when the picker opened: six hex digits, 'off', or undefined. The background's Reset brings it back.
let openedWith: string | undefined
// What is typed in the picker's field, so the Set button can use it.
let typedText = ''

// The colour the window comes back with when Show is ticked again: the one chosen last, kept between sessions, or the default.
async function rememberedHex($: { store: { get: (key: string) => Promise<unknown> } }): Promise<string> {
  const saved = await $.store.get(STORE_KEY)

  return typeof saved === 'string' && HEX.test(saved) ? saved.replace('#', '').toLowerCase() : DEFAULT_HEX
}

type Engine = Tools & StateDollar & {
  store: Tools['store'] & { get: (key: string) => Promise<unknown> }
  ui: { status: (text: string | undefined) => void }
}

// Turns the background off in this session and for the sessions that follow. The colour chosen last is kept for when it is shown again.
// The typed /convo-color off and the picker's Off button share it. It clears the session's theme, whichever mod set it, because the person asked.
async function turnBackgroundOff($: Tools & StateDollar): Promise<void> {
  await $.theme.clear()
  isDrawn = false
  mine = 'off'
  await $.store.set(BACKGROUND_STORE_KEY, 'off')
  await update($, BACKGROUND_ON, () => false)
}

// Draws the saved colour, or the default one, unless the person turned the colour off. Safe to call again: it does nothing once drawn.
// It reports back whether the colour is drawn, so a caller can say why not.
async function ensureLook($: Engine): Promise<ThemeResult | undefined> {
  if (isDrawn || mine === 'off') {
    return undefined
  }
  // A new session starts as the sessions before it left the background: off, if it was last turned off anywhere. A session keeps its own choice after that.
  if (mine === undefined && (await $.store.get(BACKGROUND_STORE_KEY)) === 'off') {
    mine = 'off'
    await update($, BACKGROUND_ON, () => false)

    return undefined
  }
  // The last colour chosen, kept between sessions. Anything that is not six hex digits is ignored.
  const saved = await $.store.get(STORE_KEY)
  const hex = mine ?? (typeof saved === 'string' && HEX.test(saved) ? saved.replace('#', '').toLowerCase() : DEFAULT_HEX)
  const scheme = schemeFor(hex)
  const set = await $.theme.set({
    backdrop: { scene: `${SCENE_PREFIX}${hex}`, glass: { blur: 8, tint: scheme === 'light' ? '#ffffff' : '#000000', opacity: 0.12 } },
    overrideColorScheme: scheme,
  })

  if (set.isDrawn) {
    isDrawn = true
    mine = hex
    $.ui.status(undefined)
  } else {
    // The reason the app gives for not drawing the theme, in the status line. The next try clears it.
    $.ui.status(set.reason)
  }

  return set
}

// The model row: one colour per model family, drawn above the prompt box while the window keeps the person's own colour.
// Another Claude family gets a spare colour, and an id with no Claude family the grey row. Every colour here is medium, so the
// dark text reads on each at 7 to 1 or better; a test checks it.
const MODEL_ROWS: ReadonlyArray<readonly [family: string, hex: string, label: string]> = [
  ['fable', 'c2a1f2', 'Fable'],
  ['opus', 'eb9e71', 'Opus'],
  ['sonnet', '86b2ee', 'Sonnet'],
  ['haiku', '5be8a1', 'Haiku'],
]
// The spare colours for a Claude family that is not one of the four.
// Each is medium, so the dark text reads at 7 to 1 or better. Yellow sits 25 degrees in hue from Opus, not the 28 the earlier pale
// set kept.
const SPARE_ROW_COLOURS: ReadonlyArray<readonly [hex: string, name: string]> = [
  ['e6cf5a', 'Pale yellow'],
  ['b5dd6a', 'Pale lime'],
  ['7fd6cc', 'Pale teal'],
  ['f09cc0', 'Pale pink'],
]
// The text colour of a row is whichever of dark and white reads better on its colour. No colour is refused. Where even that is under 4.5 to 1,
// the message after a press says so. There is no contrast rule: the person decides.
const ROW_TEXT_WARN = 4.5
const ROW_WHITE = '#ffffff'
const OTHER_MODEL_ROW = { family: 'other', hex: 'b8b8b8', label: 'Other model' }
const ROW_INK = '#1f1f1f'

// The text colour for a row colour: the better of dark and white.
function rowInk(hex: string): `#${string}` {
  return contrast(ROW_INK, hex) >= contrast(ROW_WHITE, hex) ? ROW_INK : ROW_WHITE
}
// The store key of the on/off choice for the row, kept between sessions. Nothing stored means on.
const ROW_STORE_KEY = 'model-row'
// The store key of the colours chosen for the rows, kept between sessions.
const ROW_COLOURS_STORE_KEY = 'row-colours'
// The family name in a Claude model id: the word after "claude-", after a version such as 3-5 where the id puts it first.
// A provider's prefix in front, such as us.anthropic., changes nothing.
const FAMILY_IN_ID = /claude-(?:\d+(?:[-.]\d+)*-)?([a-z]+)/

// A number made from a name, the same for the same name on every computer (the FNV-1a checksum).
function nameNumber(name: string): number {
  let value = 0x811c9dc5

  for (const character of name) {
    value ^= character.charCodeAt(0)
    value = Math.imul(value, 16777619) >>> 0
  }

  return value
}

// The row for a model id, such as claude-opus-5-5. One of the four families is matched on the name it contains. Another
// Claude family shows its own name in the spare colour its name picks. An id with no Claude family in it gets the grey row.
function modelRowFor(model: string | undefined): ModelRow {
  const lower = (model ?? '').toLowerCase()
  const known = MODEL_ROWS.find(([family]) => lower.includes(family))

  if (known !== undefined) {
    return { family: known[0], tint: `#${known[1]}`, ink: ROW_INK, label: known[2] }
  }
  const family = FAMILY_IN_ID.exec(lower)?.[1]

  if (family === undefined) {
    return { family: OTHER_MODEL_ROW.family, tint: `#${OTHER_MODEL_ROW.hex}`, ink: ROW_INK, label: OTHER_MODEL_ROW.label }
  }
  const [hex] = SPARE_ROW_COLOURS[nameNumber(family) % SPARE_ROW_COLOURS.length] ?? SPARE_ROW_COLOURS[0] ?? ['b8b8b8']

  return { family, tint: `#${hex}`, ink: ROW_INK, label: `${family.charAt(0).toUpperCase()}${family.slice(1)}` }
}

// The row as it is drawn: in the colour the person chose for its family, if any.
function shownRow(row: ModelRow, colours: Record<string, string>): ModelRow {
  const chosen = colours[row.family]

  return chosen === undefined ? row : { ...row, tint: `#${chosen}`, ink: rowInk(chosen) }
}

// Only well-formed entries of what was stored: a family name and six hex digits.
function cleanColours(stored: unknown): Record<string, string> {
  if (typeof stored !== 'object' || stored === null) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(stored).filter(
      (entry): entry is [string, string] => /^[a-z]+$/.test(entry[0]) && typeof entry[1] === 'string' && /^[0-9a-f]{6}$/.test(entry[1]),
    ),
  )
}

// Sets or clears the colour of a family's row, in this session and for the sessions that follow. null brings back its own colour.
// The session keeps its own colours. What is saved is the latest save of any session with this one family changed, so a colour another session
// saved for another family is not undone.
async function setRowColour($: StateDollar & { store: Tools['store'] & { get: (key: string) => Promise<unknown> } }, family: string, hex: string | null): Promise<void> {
  const change = (colours: Record<string, string>): Record<string, string> => {
    const next = { ...colours }

    if (hex === null) {
      delete next[family]
    } else {
      next[family] = hex
    }

    return next
  }

  await update($, ROW_COLOURS, change)
  await $.store.set(ROW_COLOURS_STORE_KEY, change(cleanColours(await $.store.get(ROW_COLOURS_STORE_KEY))))
}

// Sets the row for the model the session now uses.
async function setModelRow($: StateDollar, model: string | undefined): Promise<void> {
  const row = modelRowFor(model)

  await update($, MODEL_ROW, () => row)
}

// Turns the model row on or off, in this session and for the sessions that follow. The command and the picker's button share it.
async function setRowOn($: StateDollar & { store: Tools['store'] }, isOn: boolean): Promise<void> {
  await update($, ROW_ON, () => isOn)
  await $.store.set(ROW_STORE_KEY, isOn ? 'on' : 'off')
}

export const register: Register = on => {
  // The engine raises this when the person changes the model (the picker, /model) and after the switch is done. Only the row
  // above the prompt box follows the model; the window keeps the colour the person chose.
  on('classic.PostModelSwitch', async ($, e, next) => {
    await setModelRow($, e.to_model)

    return next(e)
  })

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'convo-color',
      description: 'Set the colour behind the conversation: /convo-color f5eedc or /convo-color light pink, or off. row on or row off shows or hides the model row',
    })

    // A reload runs this again with the session's values kept. A finished or half-finished update row would then say what is no longer true, so it goes.
    await update($, offer, () => null)

    // A first try can fail because no client is attached yet, so it is tried again later. A session turned off stays off.
    await ensureLook($)

    // The model row is on unless the person turned it off, and it starts on the model the session uses.
    const rowSetting = await $.store.get(ROW_STORE_KEY)

    await update($, ROW_ON, () => rowSetting !== 'off')
    const storedColours = await $.store.get(ROW_COLOURS_STORE_KEY)

    await update($, ROW_COLOURS, () => cleanColours(storedColours))
    await setModelRow($, await $.session.model())

    return next(e)
  })

  // The desktop app joins after the session starts, so the saved colour is tried again when it attaches and at every prompt.
  on('session.attach', async ($, e, next) => {
    const result = await next(e)

    await ensureLook($)
    await ensureUpdateCheck($)

    return result
  })

  on('prompt.submit', async ($, e, next) => {
    await ensureLook($)
    await ensureUpdateCheck($)

    return next(e)
  })

  on('command.run', { command: 'convo-color' }, async ($, e) => {
    const typed = e.args.trim()

    if (typed.toLowerCase() === 'off') {
      await turnBackgroundOff($)

      return { text: 'Conversation colour is off, here and for new sessions. The colour you chose is kept. Type /convo-color followed by a colour to bring it back.' }
    }
    if (typed.toLowerCase() === 'update') {
      return { text: (await checkForUpdate($)).text }
    }
    if (typed.toLowerCase() === 'row on' || typed.toLowerCase() === 'row off') {
      const isOn = typed.toLowerCase() === 'row on'

      await setRowOn($, isOn)

      return { text: isOn ? 'The model row is on. It shows the model family above the prompt box, in its own medium colour.' : 'The model row is off. Type /convo-color row on to show it again.' }
    }
    if (typed === '') {
      openedWith = mine
      typedText = ''
      await update($, SET_CHOICE, () => null)
      await update($, picking, () => true)

      return { text: 'Pick a colour in the panel above the prompt box. Choose Background to colour the conversation, or LLM model to colour the model row. The panel stays open so you can try several, until you press Close. You can also type six hex digits or a colour name.' }
    }
    const hex = parseColour(typed)

    if (hex === undefined) {
      const saved = await $.store.get(STORE_KEY)
      // Only a colour that was really chosen is named. Before the first choice the default is in use, and the text says so.
      const last = typeof saved === 'string' && HEX.test(saved) ? `The last colour you chose was ${saved}.` : `You have not chosen a colour yet, so the default #${DEFAULT_HEX} is in use.`

      return { text: `"${typed}" is not a hex code or a web colour name. Type /convo-color alone for a picker, or add six hex digits or a web colour name, for example /convo-color f5eedc or /convo-color light pink. /convo-color off turns it off. /convo-color update looks for a newer version. ${last}` }
    }
    await update($, picking, () => false)
    await update($, TARGET, () => 'window' as const)
    await update($, SET_CHOICE, () => null)

    return { text: await applyColour($, hex, HEX.test(typed) ? '' : ` (${typed})`) }
  })

  // The picker above the prompt box, in a wide layout. On the left stand the controls: a Light mode and a
  // Dark mode button choosing the set of colours, then two lines each with a radio-style button (Background, LLM model), its Show
  // button and its Reset, then the text field with Set. In the middle stands the grid of the chosen set, in lines of 26. On the right stand
  // Close, Help and the version. The real model row stands under the panel, so a press shows on it at once.
  // A press on a colour leaves the picker open, so the person can try several. Only Close closes it.
  // The text field takes six hex digits, with or without a #, or a web colour name.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const isPicking = await read($, picking)
    const found = await read($, offer)

    if (e.props.hasSurvey) {
      return next(e)
    }
    // With no picker and no update offer, the model row stands above the prompt box, when it is on and the model is known.
    // An open picker or an update offer takes its place.
    const modelRow = await read($, MODEL_ROW)
    const colours = await read($, ROW_COLOURS)
    const rowView = (row: ModelRow) => {
      const { Box, Text } = $.ui.resolve(e)

      return (
        <Box key="model-row-view" backgroundColor={row.tint} paddingX={1} width="100%">
          <Text color={row.ink}>{row.label}</Text>
        </Box>
      )
    }

    if (!isPicking && found === null) {
      const row = (await read($, ROW_ON)) ? modelRow : null

      if (row === null) {
        return next(e)
      }

      return rowView(shownRow(row, colours))
    }
    const { Box, Button, Input, Link, Text } = $.ui.resolve(e)
    const rowOn = await read($, ROW_ON)
    const backgroundOn = await read($, BACKGROUND_ON)
    // The picker colours the row only while the model is known. Otherwise it colours the window.
    const rowTarget = (await read($, TARGET)) === 'row' ? modelRow : null
    const onRow = rowTarget !== null
    const close = async () => {
      await update($, picking, () => false)
      await update($, TARGET, () => 'window' as const)
      await update($, SET_CHOICE, () => null)
    }
    const dismiss = () => update($, offer, () => null)

    // The update row: what was found, with the buttons that fit the step. Nothing is run until the person presses Update now.
    const updateRow =
      found === null ? null : (
        <Box key="update" columnGap={2} flexWrap="wrap">
          <Text weight="semibold">{offerText(found)}</Text>
          {found.step === 'offer' ? (
            <Button key="go" label="Update now" onPress={() => runUpdate($, found.latest, found.installed)} />
          ) : null}
          {found.step === 'running' ? null : (
            <Button key="later" label={found.step === 'offer' ? 'Not now' : 'Close'} role="dismiss" onPress={dismiss} />
          )}
        </Box>
      )

    // While an update is on offer or running, the row stands alone: the picker comes back when the person presses Not now,
    // or when the update has finished or failed.
    if (!isPicking || found?.step === 'offer' || found?.step === 'running') {
      return <Box flexDirection="column">{updateRow}</Box>
    }

    // A colour for the row of the model in use. The row is switched on if it was off, so the press has something to show.
    const colourRow = async (hex: string, name: string) => {
      if (modelRow === null) {
        return
      }
      const best = Math.max(contrast(ROW_INK, hex), contrast(ROW_WHITE, hex))
      const warning = best < ROW_TEXT_WARN ? ` The text on it is only ${best.toFixed(1)} to 1, which is hard to read.` : ''

      await setRowColour($, modelRow.family, hex)
      if (!rowOn) {
        await setRowOn($, true)
      }
      $.ui.toast(`The ${modelRow.label} row is now #${hex}${name}.${warning}`)
    }

    // Enter in the text field, and the Set button, set the colour that was typed and leave the picker open, as a press on a colour does.
    const enter = async (value: string) => {
      const typed = value.trim()

      if (typed === '') {
        return
      }
      const hex = parseColour(typed)

      if (hex === undefined) {
        $.ui.toast(`"${typed}" is not a hex code or a web colour name. Type six hex digits such as f5eedc or #f5eedc, or a web colour name such as light pink.`)

        return
      }
      if (rowTarget !== null) {
        await colourRow(hex, HEX.test(typed) ? '' : ` (${typed})`)

        return
      }
      $.ui.toast(await applyColour($, hex, HEX.test(typed) ? '' : ` (${typed})`))
    }

    // The set the grid shows: the person's choice, or the set of the colour being edited. The window colour is the one the window has,
    // or the one it would come back with when it is off. A row colour is in the set the app's own test puts it in.
    const windowHex = mine !== undefined && mine !== 'off' ? mine : await rememberedHex($)
    const editedLight = schemeFor(rowTarget === null ? windowHex : shownRow(rowTarget, colours).tint.slice(1)) === 'light'
    const setShown = (await read($, SET_CHOICE)) ?? (editedLight ? 'light' : 'dark')
    const lines = setLines(setShown)

    // One button per colour, with no name on it: a swatch. A button cannot take a colour itself and draws no colour put
    // inside it, but it lets what lies beneath it show through (seen in the desktop app). So the
    // button stands on a box of the colour, and its label is blank room. The colour's name is in the message a press shows.
    // The desktop app draws its button as a grey film of about 30 by 31 pixels, on a line that is 22 pixels tall
    // (measured in screenshots). So the colour box is a square of one line's height that cuts off whatever
    // sticks out of it, and the button stands in its middle. The film then covers the whole square evenly.
    // A press colours the row of the model in use while the picker edits the row, and the window otherwise.
    // The keys come from the names, since two of Tailwind's greys share a value (Zinc 50, Neutral 50 and Mauve 50, and Stone 950 and Taupe 950).
    const swatch = ([hex, name]: readonly [string, string]) => (
      <Box key={`swatch-${slug(name)}`} backgroundColor={`#${hex}`} width={SWATCH_WIDTH} flexGrow={1} overflow="hidden" justifyContent="center">
        <Button
          key={slug(name)}
          label={SWATCH_ROOM}
          onPress={async () => {
            if (onRow) {
              await colourRow(hex, ` (${name})`)
            } else {
              $.ui.toast(await applyColour($, hex, ` (${name})`))
            }
          }}
        />
      </Box>
    )

    // The radio-style pair and the Show and Reset buttons. A button has no width setting, so the labels are padded with half-wide
    // spaces to the same length, which makes the buttons about equally wide.
    // A button in a column of fixed width.
    const column = (width: number, child: unknown) => <Box width={width}>{child as never}</Box>
    const radio = (key: string, chosen: boolean, text: string, press: () => unknown, length = RADIO_LENGTH, fine = 0) => (
      <Button key={key} label={padLabel(`${chosen ? '◉' : '○'} ${text}`, length, fine)} onPress={press} />
    )
    const show = (key: string, isOn: boolean, press: () => unknown) => (
      <Button key={key} label={padLabel(`${isOn ? '☑' : '☐'} Show`, SHOW_LENGTH)} onPress={press} />
    )

    return (
      <Box flexDirection="column">
        {updateRow === null ? null : <Box marginBottom="sm">{updateRow}</Box>}
        <Box columnGap={0.5} rowGap="sm" alignItems="flex-start" flexWrap="wrap">
          <Box key="controls" flexDirection="column" rowGap="md">
            <Box key="sets">
              {column(COLUMN_ONE, radio('set-light', setShown === 'light', 'Light mode', () => update($, SET_CHOICE, () => 'light' as const), LIGHT_LENGTH))}
              {column(COLUMN_TWO + COLUMN_THREE, radio('set-dark', setShown === 'dark', 'Dark mode', () => update($, SET_CHOICE, () => 'dark' as const), DARK_LENGTH))}
            </Box>
            <Box key="line-background">
              {column(COLUMN_ONE, radio('target-window', !onRow, 'Background', async () => {
                await update($, TARGET, () => 'window' as const)
                await update($, SET_CHOICE, () => null)
              }, RADIO_LENGTH, BACKGROUND_FINE))}
              {column(COLUMN_TWO, show('show-window', backgroundOn, async () => {
                if (backgroundOn) {
                  await turnBackgroundOff($)
                  $.ui.toast('The background colour is off, here and for new sessions.')

                  return
                }
                $.ui.toast(await applyColour($, await rememberedHex($), ''))
              }))}
              {column(COLUMN_THREE, <Button
                key="reset-window"
                label={padLabel('Reset', RESET_LENGTH)}
                onPress={async () => {
                  // The colour the window had when the picker opened, or off if it was off then.
                  if (openedWith === 'off') {
                    await turnBackgroundOff($)
                    $.ui.toast('The background is off again, as it was when the picker opened.')

                    return
                  }
                  $.ui.toast(await applyColour($, openedWith ?? DEFAULT_HEX, ''))
                }}
              />)}
            </Box>
            {modelRow === null ? null : (
              <Box key="line-model">
                {column(COLUMN_ONE, radio('target-row', onRow, 'LLM model', async () => {
                  await update($, TARGET, () => 'row' as const)
                  await update($, SET_CHOICE, () => null)
                }, RADIO_LENGTH, MODEL_FINE))}
                {column(COLUMN_TWO, show('show-row', rowOn, async () => {
                  await setRowOn($, !rowOn)
                  $.ui.toast(rowOn ? 'The model row is off.' : 'The model row is on.')
                }))}
                {column(COLUMN_THREE, <Button
                  key="reset-row"
                  label={padLabel('Reset', RESET_LENGTH)}
                  onPress={async () => {
                    await setRowColour($, modelRow.family, null)
                    $.ui.toast(`The ${modelRow.label} row has its own colour again.`)
                  }}
                />)}
              </Box>
            )}
            {/* The field's own button is Set: it is the app's submit button, so a press on it does what Enter does.
                Its label is padded to the width of Reset. */}
            <Input
              key="typed"
              placeholder="Hex code or name"
              submitLabel={padLabel('Set', SET_LENGTH)}
              onInput={value => {
                typedText = value
              }}
              onSubmit={enter}
            />
            {/* Close as the app's main button, where the way out of a dialog is looked for, with Help and the version to its right,
                under the controls, where the grid leaves room. A button cannot open a web page, so Help is a link. */}
            <Box key="foot" columnGap={2} alignItems="center">
              <Button key="close" label="Close" variant="primary" role="dismiss" onPress={close} />
              <Link href={HELP_URL} label="Convo Color Help" />
              <Text size="caption">v{INSTALLED_VERSION}</Text>
            </Box>
          </Box>
          <Box key="grid" flexDirection="column">
            {lines.map((line, number) => (
              <Box key={`line-${number}`} width={LINE_WIDTH}>
                {line.map(swatch)}
              </Box>
            ))}
          </Box>
        </Box>
        {/* The real model row, under the panel, when it is on. A press on a colour of the row shows on it at once. */}
        {modelRow === null || !rowOn ? null : <Box marginTop="sm">{rowView(shownRow(modelRow, colours))}</Box>}
      </Box>
    )
  })

  // The scene's drawing: a flat colour with a white column under the sidebar.
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const match = SCENE_ID.exec(e.props.scene)

    if (match === null) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    const hex = match[1] ?? ''

    return <Svg source={scene(hex, schemeFor(hex))} alt="A flat colour with a column for the sidebar at the left" />
  })
}
