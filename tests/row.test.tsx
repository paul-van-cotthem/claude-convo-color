import { expect, test } from 'claude-code/testing'

// The model row above the prompt box: one pale colour per family, following a model change, and turned on and off.
const SWITCH = {
  from_model: 'claude-opus-5-5',
  requested_model: null,
  source: 'sdk',
  context_tokens: 0,
  prompt_cache_warm: false,
  cache_ttl: '5m',
  estimated_cache_write_usd: 0,
  pricing: 'catalog',
} as const

function luminance(hex: string): number {
  const channel = (start: number): number => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255

    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
}

// The colour and the words of the row above the prompt box, with no picker open. The first coloured box is the row.
async function rowShown($: any): Promise<{ tint: string | undefined; text: string }> {
  const band = await $.ui.mount({ plugin: 'convo-color', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 5, bodyColumns: 80 } } as any)
  const boxes = JSON.stringify(await band.find({ type: 'Box' }))
  const texts = JSON.stringify(await band.find({ type: 'Text' }))
  await band.unmount()

  return { tint: /"backgroundColor":"(#[0-9a-f]{6})"/.exec(boxes)?.[1], text: texts }
}

async function setUp(on: any, $: any, model: { value: string }, stored: Record<string, unknown> = {}) {
  const themeCalls: unknown[] = []
  const storeSets: unknown[] = []
  const toasts: string[] = []
  const registered: string[] = []

  on('command.register', (_: unknown, e: { description?: string }) => {
    registered.push(String(e.description))

    return { value: undefined }
  })
  on('session.start', () => ({ cwd: '/tmp' }))
  on('session.model', () => ({ value: model.value }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: stored[e.key] }))
  on('store.set', (_, e) => {
    storeSets.push(e)

    return { value: undefined }
  })
  on('theme.set', (_, e) => {
    themeCalls.push(e)

    return { value: { isDrawn: true, requestId: 'r' } }
  })
  on('theme.clear', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', (_: unknown, e: unknown) => {
    toasts.push(JSON.stringify(e))

    return { value: undefined }
  })
  on('classic.PostModelSwitch', () => ({}))

  await $.session.start({ cwd: '/tmp', surface: 'desktop', isInteractive: true })

  return { themeCalls, storeSets, toasts, registered }
}

const PICKER = { plugin: 'convo-color', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 8, bodyColumns: 100 } } as any
// A padded label ends in half-wide spaces. The words are what is compared.
const words = (label: unknown): string => String(label).replace(/\s+$/, '')

// The picker, mounted, on the window.
async function openPicker($: any) {
  await $.command.run({ command: 'convo-color', args: '' } as any)

  return $.ui.mount(PICKER)
}

// The picker, mounted, with the model row as its colouring target.
async function pickerOnRow($: any) {
  const ui = await openPicker($)

  await ui.press({ key: 'target-row' })

  return ui
}

// The keys of the swatches drawn now, in order: a colour's name in lower case with a hyphen, such as red-300.
async function swatchHexes(ui: any): Promise<string[]> {
  return (await ui.findAll({ type: 'Box' })).map((box: { key?: unknown }) => String(box.key)).filter((key: string) => key.startsWith('swatch-')).map((key: string) => key.slice(7))
}

// Closes the picker so the row stands alone again.
async function closePicker(ui: any) {
  await ui.press({ key: 'close' })
  await ui.unmount()
}

test('the row above the prompt box shows each family in its colour and follows a model change', async ($, on) => {
  const model = { value: 'claude-opus-5-5' }

  await setUp(on, $, model)
  expect(await rowShown($)).toEqual({ tint: '#eb9e71', text: expect.stringContaining('Opus') })

  await $.classic.PostModelSwitch({ ...SWITCH, to_model: 'claude-haiku-5-5' })
  expect((await rowShown($)).tint).toBe('#5be8a1')

  await $.classic.PostModelSwitch({ ...SWITCH, from_model: 'claude-haiku-5-5', to_model: 'claude-sonnet-5-5' })
  expect((await rowShown($)).tint).toBe('#86b2ee')

  await $.classic.PostModelSwitch({ ...SWITCH, from_model: 'claude-sonnet-5-5', to_model: 'claude-fable-5-2' })
  expect((await rowShown($)).tint).toBe('#c2a1f2')

  await $.classic.PostModelSwitch({ ...SWITCH, from_model: 'claude-fable-5-2', to_model: 'some-other-model-9' })
  const other = await rowShown($)

  expect(other.tint).toBe('#b8b8b8')
  expect(other.text).toContain('Other model')
})

test('a model change leaves the window colour alone: only the row follows the model', async ($, on) => {
  const { themeCalls } = await setUp(on, $, { value: 'claude-opus-5-5' })
  const before = themeCalls.length

  await $.classic.PostModelSwitch({ ...SWITCH, to_model: 'claude-haiku-5-5' })

  expect(themeCalls.length).toBe(before)
})

test('/convo-color row off hides the row, row on shows it again', async ($, on) => {
  const model = { value: 'claude-opus-5-5' }

  await setUp(on, $, model)
  await $.command.run({ command: 'convo-color', args: 'row off' } as any)
  expect((await rowShown($)).tint).toBeUndefined()

  await $.command.run({ command: 'convo-color', args: 'row on' } as any)
  expect((await rowShown($)).tint).toBe('#eb9e71')
})

test('the command description and the replies name the model row, and its colours are called medium, not pale', async ($, on) => {
  const { registered } = await setUp(on, $, { value: 'claude-opus-5-5' })

  expect(registered.join(' ')).toMatch(/model row/)
  const bare = (await $.command.run({ command: 'convo-color', args: '' } as any)) as { text: string }

  expect(bare.text).toMatch(/model row/)
  const rowOn = (await $.command.run({ command: 'convo-color', args: 'row on' } as any)) as { text: string }

  expect(rowOn.text).toMatch(/medium/)
  expect(rowOn.text).not.toMatch(/pale/)
})

test('the real row stands under the open panel, not a preview inside it', async ($, on) => {
  await setUp(on, $, { value: 'claude-opus-5-5' })
  const ui = await openPicker($)

  expect((await ui.find({ type: 'Box', key: 'model-row-view' }))?.props.backgroundColor).toBe('#eb9e71')
  expect(JSON.stringify(await ui.findAll({ type: 'Text' }))).toContain('Opus')

  // A press on a colour shows on that row at once.
  await ui.press({ key: 'target-row' })
  await ui.press({ key: 'orange-200' })
  expect((await ui.find({ type: 'Box', key: 'model-row-view' }))?.props.backgroundColor).toBe('#ffd6a7')

  // With Show off for the row, no row is drawn.
  await ui.press({ key: 'show-row' })
  expect(await ui.find({ type: 'Box', key: 'model-row-view' })).toBeUndefined()
  await ui.unmount()
})

test('the text colour of a row follows its colour: the better of dark and white', async ($, on) => {
  await setUp(on, $, { value: 'claude-opus-5-5' }, { 'row-colours': { opus: '9f0712' } })
  const band = await $.ui.mount({ plugin: 'convo-color', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 5, bodyColumns: 80 } } as any)

  expect(JSON.stringify(await band.find({ type: 'Text' }))).toContain('#ffffff')
  await band.unmount()
  expect(JSON.stringify(await (async () => {
    const ui = await openPicker($)
    const found = await ui.find({ type: 'Box', key: 'model-row-view' })

    await ui.unmount()

    return found
  })())).toContain('#9f0712')
})

test('the grid is the Tailwind palette in two blocks of whole lines, split where the app itself switches between light and dark mode', async ($, on) => {
  await setUp(on, $, { value: 'claude-opus-5-5' })
  const ui = await openPicker($)
  const boxes = async () => (await ui.findAll({ type: 'Box' })) as Array<{ key?: unknown; props: { backgroundColor?: string; borderStyle?: string } }>
  const patches = async () => (await boxes())
    .filter(box => String(box.key).startsWith('swatch-'))
    .map(box => ({ key: String(box.key).slice(7), hex: String(box.props.backgroundColor).slice(1) }))
  const lineCount = async () => (await boxes()).filter(box => /^line-\d+$/.test(String(box.key))).length
  const light = await patches()
  const lightLines = await lineCount()
  const blanks = (await boxes()).filter(box => String(box.key).startsWith('blank-')).length

  await ui.press({ key: 'set-dark' })
  const dark = await patches()
  const darkLines = await lineCount()
  const outline = (await boxes()).find(box => String(box.key) === 'swatch-sky-950')?.props

  await ui.unmount()

  const ratio = (one: string, other: string): number => (Math.max(luminance(one), luminance(other)) + 0.05) / (Math.min(luminance(one), luminance(other)) + 0.05)
  // The app's own test, the one the window uses: its light mode when its main text in that mode reads at least as well as in dark mode.
  const lightMode = (hex: string): boolean => ratio(hex, '0b0b0b') >= ratio(hex, 'f0efec')

  // Every colour of the light set turns the app light and every colour of the dark set turns it dark, so no colour is in the wrong set.
  expect(light.filter(patch => !lightMode(patch.hex))).toEqual([])
  expect(dark.filter(patch => lightMode(patch.hex))).toEqual([])
  // Whole lines of 17, so each set is a clean rectangle ending on Rose: five lines of shades 50 to 400 and four of 700 to 950, then one line of 17 under each: beige patches under the light set and kept neutrals under the dark set, with no blank room.
  expect([light.length, dark.length]).toEqual([6 * 17, 5 * 17])
  expect([lightLines, darkLines, blanks]).toEqual([6, 5, 0])
  expect(new Set([...light, ...dark].map(patch => patch.key)).size).toBe(187)
  // The chromatic families side by side in Tailwind's order, Red to Rose, and the first and last colour of each part of each set.
  expect([light[0].key, light[16].key, light[17].key, light[84].key, light[85].key, light[101].key]).toEqual(['red-50', 'rose-50', 'red-100', 'rose-400', 'beige-1', 'beige-17'])
  expect([dark[0].key, dark[16].key, dark[17].key, dark[67].key, dark[68].key, dark[84].key]).toEqual(['red-700', 'rose-700', 'red-800', 'rose-950', 'mist-700', 'neutral-900'])
  // Only the neutral families stand in the line under the shades (the light set's has beige instead), and none stands among the shades.
  const neutral = /^(slate|gray|zinc|neutral|stone|taupe|mauve|olive|mist)-/

  expect([light.slice(0, 85), dark.slice(0, 68)].flat().filter(patch => neutral.test(patch.key))).toEqual([])
  expect(dark.slice(68).filter(patch => !neutral.test(patch.key))).toEqual([])
  // The light set's last line is 17 beige patches from the palest to the darkest, each darker than the one before and each still in the app's light mode (checked above).
  const beige = light.slice(85)

  expect(beige.map(patch => patch.key)).toEqual(Array.from({ length: 17 }, (_, number) => `beige-${number + 1}`))
  expect(beige.map(patch => luminance(patch.hex))).toEqual([...beige.map(patch => luminance(patch.hex))].sort((one, other) => other - one))
  // Spot values from Tailwind's own page, as converted to hex.
  expect(light.find(patch => patch.key === 'red-400')?.hex).toBe('ff6467')
  expect(dark.find(patch => patch.key === 'sky-950')?.hex).toBe('052f4a')
  // No border: the app draws a Box's border a whole character cell thick, which swallowed the patches.
  expect(outline?.borderStyle).toBeUndefined()

  const best = (hex: string): number => Math.max(ratio(hex, '1f1f1f'), ratio(hex, 'ffffff'))

  // Either dark or white text reads on every colour at 4 to 1 or better.
  expect([...light, ...dark].filter(patch => best(patch.hex) < 4)).toEqual([])
})

test('dark text reads on every default row colour at 7 to 1 or better', async () => {
  const ink = luminance('1f1f1f')

  for (const hex of ['c2a1f2', 'eb9e71', '86b2ee', '5be8a1', 'b8b8b8', 'e6cf5a', 'b5dd6a', '7fd6cc', 'f09cc0']) {
    const ratio = (Math.max(luminance(hex), ink) + 0.05) / (Math.min(luminance(hex), ink) + 0.05)

    expect(ratio).toBeGreaterThanOrEqual(7)
  }
})

test('the picker has a Show button for the row that turns it off and on and keeps the choice', async ($, on) => {
  const { storeSets } = await setUp(on, $, { value: 'claude-opus-5-5' })
  const ui = await openPicker($)

  expect((await ui.find({ type: 'Button', key: 'show-row' }))?.props.label).toBe('☑ Show')
  await ui.press({ key: 'show-row' })
  expect((await ui.find({ type: 'Button', key: 'show-row' }))?.props.label).toBe('☐ Show')
  expect(JSON.stringify(storeSets.at(-1))).toMatch(/"off"/)

  await ui.press({ key: 'show-row' })
  expect((await ui.find({ type: 'Button', key: 'show-row' }))?.props.label).toBe('☑ Show')
  expect(JSON.stringify(storeSets.at(-1))).toMatch(/"on"/)
  await ui.unmount()
})

test('a new Claude family shows its own name in a spare colour, the same every time', async ($, on) => {
  await setUp(on, $, { value: 'claude-krokus-1-0' })
  expect(await rowShown($)).toEqual({ tint: '#7fd6cc', text: expect.stringContaining('Krokus') })

  // A provider prefix in front of the id changes nothing: the family name is still found.
  await $.classic.PostModelSwitch({ ...SWITCH, to_model: 'us.anthropic.claude-aria-1-0' })
  expect(await rowShown($)).toEqual({ tint: '#e6cf5a', text: expect.stringContaining('Aria') })

  // An older id with the version first keeps its family.
  await $.classic.PostModelSwitch({ ...SWITCH, to_model: 'claude-3-5-sonnet-20241022' })
  expect((await rowShown($)).tint).toBe('#86b2ee')

  // An id with no Claude family in it gets the grey row.
  await $.classic.PostModelSwitch({ ...SWITCH, to_model: 'gpt-5' })
  expect((await rowShown($)).text).toContain('Other model')
})

test('the radio-style buttons switch between colouring the window and colouring the row of the model in use', async ($, on) => {
  const { themeCalls, storeSets } = await setUp(on, $, { value: 'claude-opus-5-5' })
  const ui = await openPicker($)
  const keys = (await ui.findAll({ type: 'Button' })).map((button: { key?: unknown }) => button.key)

  // The light and dark buttons come first, then the Background line, the LLM model line, and Close. The field's own Set button is not one of the buttons here.
  expect(keys.indexOf('set-light')).toBeLessThan(keys.indexOf('target-window'))
  expect(keys.indexOf('target-window')).toBeLessThan(keys.indexOf('show-window'))
  expect(keys.indexOf('show-window')).toBeLessThan(keys.indexOf('reset-window'))
  expect(keys.indexOf('reset-window')).toBeLessThan(keys.indexOf('target-row'))
  expect(keys.indexOf('reset-row')).toBeLessThan(keys.indexOf('close'))
  expect(words((await ui.find({ type: 'Button', key: 'target-window' }))?.props.label)).toBe('◉ Session color')
  // LLM bar color is the longest radio label and has no padding, so the radio buttons come out as wide as each other.
  expect(String((await ui.find({ type: 'Button', key: 'target-row' }))?.props.label).length).toBe(15)
  expect(words((await ui.find({ type: 'Button', key: 'target-row' }))?.props.label)).toBe('○ LLM bar color')

  await ui.press({ key: 'target-row' })
  expect(words((await ui.find({ type: 'Button', key: 'target-window' }))?.props.label)).toBe('○ Session color')
  expect(words((await ui.find({ type: 'Button', key: 'target-row' }))?.props.label)).toBe('◉ LLM bar color')

  // A press on a colour now previews it on the row, not on the window, and keeps nothing until Apply.
  const before = themeCalls.length

  await ui.press({ key: 'red-300' })
  expect(themeCalls.length).toBe(before)
  expect(JSON.stringify(storeSets)).not.toContain('ffa2a2')
  expect((await ui.find({ type: 'Box', key: 'model-row-view' }))?.props.backgroundColor).toBe('#ffa2a2')
  await ui.press({ key: 'apply' })
  expect(JSON.stringify(storeSets.at(-1))).toContain('ffa2a2')

  await closePicker(ui)
  expect((await rowShown($)).tint).toBe('#ffa2a2')

  // Another family keeps its own colour.
  await $.classic.PostModelSwitch({ ...SWITCH, to_model: 'claude-haiku-5-5' })
  expect((await rowShown($)).tint).toBe('#5be8a1')
})

test('a new family can take the colour of an older one with one press', async ($, on) => {
  await setUp(on, $, { value: 'claude-krokus-1-0' })
  const ui = await pickerOnRow($)

  // Orange 300 is in the light set, and the new family takes it once it is applied.
  await ui.press({ key: 'orange-300' })
  await ui.press({ key: 'apply' })
  await closePicker(ui)

  expect(await rowShown($)).toEqual({ tint: '#ffb86a', text: expect.stringContaining('Krokus') })
})

test('the text field gives a row colour the better of dark and white text, and warns below 4.5 to 1 but never refuses', async ($, on) => {
  const { toasts } = await setUp(on, $, { value: 'claude-opus-5-5' })
  const ui = await pickerOnRow($)

  // Mid grey reads at about 4 to 1 with either text: accepted, with a warning that says so.
  await ui.input({ key: 'typed', text: '808080' })
  expect(toasts.at(-1)).toMatch(/is now #808080/)
  expect(toasts.at(-1)).toMatch(/only 4\.2 to 1/)
  expect((await ui.find({ type: 'Box', key: 'model-row-view' }))?.props.backgroundColor).toBe('#808080')
  expect(JSON.stringify(await ui.findAll({ type: 'Text' }))).toContain('#1f1f1f')

  // Navy reads well with white text: accepted with no warning, and the row text turns white.
  await ui.input({ key: 'typed', text: '1f3a5f' })
  expect(toasts.at(-1)).not.toMatch(/to 1/)
  expect((await ui.find({ type: 'Box', key: 'model-row-view' }))?.props.backgroundColor).toBe('#1f3a5f')
  expect(JSON.stringify(await ui.findAll({ type: 'Text' }))).toContain('#ffffff')

  // A pale pink reads with dark text.
  await ui.input({ key: 'typed', text: 'f09cc0' })
  expect(toasts.at(-1)).not.toMatch(/to 1/)
  await closePicker(ui)
  expect((await rowShown($)).tint).toBe('#f09cc0')
})

test('typing alone changes nothing, and the field\'s own Set button applies what is typed', async ($, on) => {
  const { themeCalls } = await setUp(on, $, { value: 'claude-opus-5-5' })
  const ui = await openPicker($)
  const before = themeCalls.length

  // Typing alone changes nothing. The field's own button is the app's submit button, which raises the same event as Enter.
  await ui.input({ key: 'typed', text: '#2b2b2b', kind: 'change' } as any)
  expect(themeCalls.length).toBe(before)
  await ui.input({ key: 'typed', text: '#2b2b2b' })
  expect(String((themeCalls.at(-1) as { backdrop?: { scene?: string } }).backdrop?.scene)).toBe('convo-2b2b2b')
  // There is no second Set button of my own, and the field's button is labelled Set.
  expect(await ui.find({ type: 'Button', key: 'set' })).toBeUndefined()
  expect(String((await ui.find({ type: 'Input', key: 'typed' }))?.props.submitLabel).trim()).toBe('Set')
  await ui.unmount()
})

test('Reset brings the row back to its own colour', async ($, on) => {
  await setUp(on, $, { value: 'claude-opus-5-5' }, { 'row-colours': { opus: '7fd6cc' } })
  expect((await rowShown($)).tint).toBe('#7fd6cc')

  const ui = await pickerOnRow($)

  await ui.press({ key: 'reset-row' })
  await closePicker(ui)
  expect((await rowShown($)).tint).toBe('#eb9e71')
})

test('a colour chosen for a family is kept for the sessions that follow', async ($, on) => {
  await setUp(on, $, { value: 'claude-haiku-5-5' }, { 'row-colours': { haiku: 'f09cc0' } })

  expect((await rowShown($)).tint).toBe('#f09cc0')
})

test('closing the picker sets it back to colouring the window', async ($, on) => {
  await setUp(on, $, { value: 'claude-opus-5-5' })
  const ui = await pickerOnRow($)

  await closePicker(ui)
  const again = await openPicker($)

  expect(words((await again.find({ type: 'Button', key: 'target-window' }))?.props.label)).toBe('◉ Session color')
  await again.unmount()
})

test('the grid opens on the set of the colour being edited, and the Light and Dark buttons choose the other set', async ($, on) => {
  await setUp(on, $, { value: 'claude-opus-5-5' }, { 'row-colours': { opus: '9f0712' } })
  // The window is the default beige, so the light set opens for the background.
  const ui = await openPicker($)

  expect(await swatchHexes(ui)).toContain('red-300')
  expect(words((await ui.find({ type: 'Button', key: 'set-light' }))?.props.label)).toBe('◉ Light mode')

  // Opus has a dark red row, so the dark set opens for the row. Switching back to the background shows the light set again.
  await ui.press({ key: 'target-row' })
  expect(await swatchHexes(ui)).toContain('red-800')
  expect(words((await ui.find({ type: 'Button', key: 'set-dark' }))?.props.label)).toBe('◉ Dark mode')
  await ui.press({ key: 'target-window' })
  expect(await swatchHexes(ui)).toContain('red-300')

  await ui.press({ key: 'set-dark' })
  expect(await swatchHexes(ui)).toContain('red-800')
  expect(await swatchHexes(ui)).not.toContain('red-300')
  await ui.unmount()
})

test('Show turns the background off and back on, and Reset drops a pressed colour and returns to the latest colour in a folder with no folder colour', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc']])
  const { themeCalls } = await setUp(on, $, { value: 'claude-opus-5-5' }, Object.fromEntries(store))
  const ui = await openPicker($)
  const sceneAt = (): string => String((themeCalls.at(-1) as { backdrop?: { scene?: string } }).backdrop?.scene)

  expect(sceneAt()).toBe('convo-a3c4dc')
  await ui.press({ key: 'red-300' })
  expect(sceneAt()).toBe('convo-ffa2a2')
  await ui.press({ key: 'reset-window' })
  expect(sceneAt()).toBe('convo-a3c4dc')

  expect((await ui.find({ type: 'Button', key: 'show-window' }))?.props.label).toBe('☑ Show')
  await ui.press({ key: 'show-window' })
  expect((await ui.find({ type: 'Button', key: 'show-window' }))?.props.label).toBe('☐ Show')
  await ui.press({ key: 'show-window' })
  expect((await ui.find({ type: 'Button', key: 'show-window' }))?.props.label).toBe('☑ Show')
  await ui.unmount()
})

test('applying a colour of the row switches the row on again if it was off', async ($, on) => {
  await setUp(on, $, { value: 'claude-opus-5-5' })
  const ui = await openPicker($)

  await ui.press({ key: 'show-row' })
  expect((await ui.find({ type: 'Button', key: 'show-row' }))?.props.label).toBe('☐ Show')
  await ui.press({ key: 'target-row' })
  // A pressed colour is shown on the row even while the row is off, so there is something to look at. It is not kept yet.
  await ui.press({ key: 'red-300' })
  expect((await ui.find({ type: 'Button', key: 'show-row' }))?.props.label).toBe('☐ Show')
  expect((await ui.find({ type: 'Box', key: 'model-row-view' }))?.props.backgroundColor).toBe('#ffa2a2')
  await ui.press({ key: 'apply' })
  expect((await ui.find({ type: 'Button', key: 'show-row' }))?.props.label).toBe('☑ Show')
  expect((await ui.find({ type: 'Box', key: 'model-row-view' }))?.props.backgroundColor).toBe('#ffa2a2')
  await ui.unmount()
})
