import { expect, test } from 'claude-code/testing'

// The folder colour. A folder is a git repository with all its worktrees, and outside git the exact folder.
// A fake store stands for the one all sessions share, and a swap of what it holds stands for another session writing.
const PICKER = { plugin: 'convo-color', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 8, bodyColumns: 100 } } as any

type Where = { root: string; repo: string | null }
const PLAIN: Where = { root: '/work/projects/atlas', repo: null }
const ENTRY = { colour: '#ece9e2', background: 'on', row: 'on' }
const FOLDER = '/work/projects/atlas'
const GLOBAL_KEYS = ['colour', 'background', 'model-row', 'row-colours']

// where null leaves the engine's session.root and session.repo unanswered, as when the engine cannot say where the session is.
async function setUp(on: any, $: any, store: Map<string, unknown>, where: Where | null = PLAIN, model = 'claude-opus-5-5') {
  const scenes: string[] = []
  const cleared: number[] = []
  const toasts: string[] = []
  const writes: string[] = []

  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: where?.root ?? '/' }))
  on('session.attach', () => ({ clientId: 'c1' }))
  on('session.model', () => ({ value: model }))
  if (where !== null) {
    on('session.root', () => ({ value: where.root }))
    on('session.repo', () => ({ value: where.repo === null ? null : { root: where.repo, remote: null, internal: false, name: 'atlas' } }))
  }
  on('store.get', (_: unknown, e: { key: string }) => ({ value: store.get(e.key) }))
  on('store.set', (_: unknown, e: { key: string; value: unknown }) => {
    store.set(e.key, e.value)
    writes.push(e.key)

    return { value: undefined }
  })
  on('theme.set', (_: unknown, e: { backdrop?: { scene?: string } }) => {
    scenes.push(e.backdrop?.scene ?? '')

    return { value: { isDrawn: true, requestId: 'r' } }
  })
  on('theme.clear', () => {
    cleared.push(1)

    return { value: undefined }
  })
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', (_: unknown, e: unknown) => {
    toasts.push(JSON.stringify(e))

    return { value: undefined }
  })
  on('clock.after', () => ({ value: undefined }))
  on('prompt.submit', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('classic.PostModelSwitch', () => ({}))

  const start = () => $.session.start({ cwd: where?.root ?? '/', surface: 'desktop', isInteractive: true })

  await start()
  await $.session.attach({ surface: 'desktop', clientId: 'c1' })

  return { scenes, cleared, toasts, writes, start }
}

async function openPicker($: any) {
  await $.command.run({ command: 'convo-color', args: '' } as any)

  return $.ui.mount(PICKER)
}

const text = async (ui: any): Promise<string> => JSON.stringify(await ui.findAll({ type: 'Text' }))
const submit = ($: any) => $.prompt.submit({ text: 'hello' } as any)
const folderEntry = (store: Map<string, unknown>, key = FOLDER) => (store.get('folders') as Record<string, unknown> | undefined)?.[key]

test('a press on a colour only previews it: the window shows it, nothing is stored and the line under the field says so', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc']])
  const { scenes, writes } = await setUp(on, $, store)
  const before = writes.length
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  expect(scenes.at(-1)).toBe('convo-46ecd5')
  expect(writes.length).toBe(before)
  expect(await text(ui)).toMatch(/Preview: Teal 300 \(#46ecd5\)\. Not applied yet\./)
  await ui.unmount()
})

test('Apply to session makes the preview the session\'s own colour and leaves the folder alone', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc']])
  const { toasts, writes } = await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'apply-session' })
  expect(toasts.at(-1)).toMatch(/Applied to this session only\./)
  expect(writes).not.toContain('folders')
  // In a folder with no folder colour it is the latest colour, as in 0.6.1.
  expect(store.get('colour')).toBe('#46ecd5')
  expect(await text(ui)).toMatch(/This session has its own colour #46ecd5\./)
  await ui.unmount()
})

test('Apply to folder writes the folder\'s entry with the Show switches, never the global keys, and names the folder', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc'], ['row-colours', { opus: 'aaaaaa' }]])
  const { scenes, toasts, writes } = await setUp(on, $, store)
  const before = writes.length
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'apply-folder' })
  expect(folderEntry(store)).toEqual({ colour: '#46ecd5', background: 'on', row: 'on' })
  expect(writes.slice(before)).toEqual(['folders'])
  expect(GLOBAL_KEYS.filter(key => writes.slice(before).includes(key))).toEqual([])
  expect(store.get('colour')).toBe('#a3c4dc')
  expect(toasts.at(-1)).toMatch(/Applied to the folder atlas\./)
  expect(toasts.at(-1)).toMatch(/follow at their next message/)
  // A session with no colour of its own draws the folder colour and follows it from now on.
  expect(scenes.at(-1)).toBe('convo-46ecd5')
  expect(await text(ui)).toMatch(/This session follows the folder colour\./)
  await ui.unmount()
})

test('Apply to folder carries Show background and Show model row as they are in this session', async ($, on) => {
  const store = new Map<string, unknown>()
  await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'show-row' })
  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'apply-folder' })
  expect(folderEntry(store)).toEqual({ colour: '#46ecd5', background: 'on', row: 'off' })
  await ui.unmount()
})

test('a session with its own colour keeps it when the folder is applied, and says so', async ($, on) => {
  const store = new Map<string, unknown>()
  const { scenes, toasts } = await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'red-300' })
  await ui.press({ key: 'apply-session' })
  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'apply-folder' })
  expect(folderEntry(store)).toEqual({ colour: '#46ecd5', background: 'on', row: 'on' })
  expect(toasts.at(-1)).toMatch(/This session has its own colour, so it keeps it\./)
  // The preview goes back to the session's own colour.
  expect(scenes.at(-1)).toBe('convo-ffa2a2')
  await ui.unmount()
})

test('a worktree shares its repository\'s entry, and outside git the exact folder is the key', async ($, on) => {
  const worktree = new Map<string, unknown>()
  const first = await setUp(on, $, worktree, { root: '/work/projects/atlas/.claude/worktrees/bold-fox', repo: '/work/projects/atlas' })
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'apply-folder' })
  expect(Object.keys(worktree.get('folders') as object)).toEqual(['/work/projects/atlas'])
  expect(first.toasts.at(-1)).toMatch(/Applied to the folder atlas\./)
  await ui.unmount()
})

test('outside git the folder is the exact folder the session is in', async ($, on) => {
  const store = new Map<string, unknown>()
  await setUp(on, $, store, { root: '/work/notes/travel', repo: null })
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'apply-folder' })
  expect(Object.keys(store.get('folders') as object)).toEqual(['/work/notes/travel'])
  await ui.unmount()
})

test('a new session in a folder with an entry starts with it, not with the latest colour anyone set', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc'], ['folders', { [FOLDER]: ENTRY }]])
  const { scenes } = await setUp(on, $, store)

  expect(scenes.at(-1)).toBe('convo-ece9e2')
  expect(scenes).not.toContain('convo-a3c4dc')
})

test('a new session in a folder with an entry starts with the entry\'s Show switches', async ($, on) => {
  const off = new Map<string, unknown>([['colour', '#a3c4dc'], ['folders', { [FOLDER]: { colour: '#ece9e2', background: 'off', row: 'off' } }]])
  const { scenes } = await setUp(on, $, off)

  expect(scenes.length).toBe(0)
  const band = await $.ui.mount({ ...PICKER, props: { ...PICKER.props, maxRows: 5 } })

  expect(await band.find({ type: 'Box', key: 'model-row-view' })).toBeUndefined()
  await band.unmount()
})

test('a new session in a folder with no entry starts as in 0.6.1, from the latest colour, even when other folders have entries', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc'], ['folders', { '/work/projects/other': ENTRY }]])
  const { scenes } = await setUp(on, $, store)

  expect(scenes.at(-1)).toBe('convo-a3c4dc')
})

test('values stored by 0.6.1, with no folders key, load unchanged', async ($, on) => {
  const old = new Map<string, unknown>([['colour', '#a3c4dc'], ['background', 'on'], ['model-row', 'off'], ['row-colours', { opus: '9f0712' }]])
  const { scenes } = await setUp(on, $, old)

  expect(scenes.at(-1)).toBe('convo-a3c4dc')
  const band = await $.ui.mount({ ...PICKER, props: { ...PICKER.props, maxRows: 5 } })

  // The model row was switched off by 0.6.1, and it stays off.
  expect(await band.find({ type: 'Box', key: 'model-row-view' })).toBeUndefined()
  await band.unmount()
})

test('a folder entry that is damaged is ignored, and so is a folders value that is not a list of entries', async ($, on) => {
  const damaged = new Map<string, unknown>([['colour', '#a3c4dc'], ['folders', { [FOLDER]: { colour: 'not a colour', background: 'on', row: 'on' } }]])

  expect((await setUp(on, $, damaged)).scenes.at(-1)).toBe('convo-a3c4dc')
})

test('a folders value that is not an object is ignored', async ($, on) => {
  const junk = new Map<string, unknown>([['colour', '#a3c4dc'], ['folders', 'junk']])

  expect((await setUp(on, $, junk)).scenes.at(-1)).toBe('convo-a3c4dc')
})

test('an open session with no colour of its own follows the folder at its next message and when the app attaches', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { scenes } = await setUp(on, $, store)

  expect(scenes.at(-1)).toBe('convo-ece9e2')
  // Nothing changed, so a message redraws nothing.
  const quiet = scenes.length

  await submit($)
  expect(scenes.length).toBe(quiet)
  // Another session applies to the folder. This one learns of it at its next message.
  store.set('folders', { [FOLDER]: { colour: '#d0f0bc', background: 'on', row: 'on' } })
  expect(scenes.at(-1)).toBe('convo-ece9e2')
  await submit($)
  expect(scenes.at(-1)).toBe('convo-d0f0bc')
  // And the next change is found when the app attaches.
  store.set('folders', { [FOLDER]: { colour: '#bfdbfe', background: 'on', row: 'on' } })
  await $.session.attach({ surface: 'desktop', clientId: 'c1' })
  expect(scenes.at(-1)).toBe('convo-bfdbfe')
})

test('a session that began from the latest colour takes the folder colour when one appears', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc']])
  const { scenes } = await setUp(on, $, store)

  expect(scenes.at(-1)).toBe('convo-a3c4dc')
  store.set('folders', { [FOLDER]: ENTRY })
  await submit($)
  expect(scenes.at(-1)).toBe('convo-ece9e2')
})

test('an open session follows a folder entry that switches the background off, and back on', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { scenes, cleared } = await setUp(on, $, store)

  store.set('folders', { [FOLDER]: { ...ENTRY, background: 'off' } })
  await submit($)
  expect(cleared.length).toBe(1)
  store.set('folders', { [FOLDER]: { colour: '#d0f0bc', background: 'on', row: 'on' } })
  await submit($)
  expect(scenes.at(-1)).toBe('convo-d0f0bc')
})

test('an open session with its own colour keeps it, until it applies another in that session', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { scenes } = await setUp(on, $, store)

  await $.command.run({ command: 'convo-color', args: 'ffa2a2' } as any)
  expect(scenes.at(-1)).toBe('convo-ffa2a2')
  store.set('folders', { [FOLDER]: { colour: '#d0f0bc', background: 'on', row: 'on' } })
  await submit($)
  await $.session.attach({ surface: 'desktop', clientId: 'c1' })
  expect(scenes.at(-1)).toBe('convo-ffa2a2')
  expect(scenes).not.toContain('convo-d0f0bc')
})

test('a session\'s own colour survives a reload of the add-on, and a latest colour set meanwhile does not replace it', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc']])
  const { scenes, start } = await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'apply-session' })
  await ui.unmount()
  store.set('colour', '#000000')
  await start()
  expect(scenes.at(-1)).toBe('convo-46ecd5')
})

test('a reload keeps a following session on the folder colour', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { scenes, start } = await setUp(on, $, store)

  store.set('folders', { [FOLDER]: { colour: '#d0f0bc', background: 'on', row: 'on' } })
  await start()
  expect(scenes.at(-1)).toBe('convo-d0f0bc')
})

test('Close without Apply puts the session back to the look it had when the picker opened', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc']])
  const { scenes, toasts, writes } = await setUp(on, $, store)
  const before = writes.length
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'orange-300' })
  expect(scenes.at(-1)).toBe('convo-ffb86a')
  await ui.press({ key: 'close' })
  expect(scenes.at(-1)).toBe('convo-a3c4dc')
  expect(toasts.at(-1)).toMatch(/Back to the colour this session had\./)
  expect(writes.length).toBe(before)
  await ui.unmount()
})

test('Close puts back a session that had its background off, and Close with no preview says nothing', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc'], ['background', 'off']])
  const { cleared, toasts } = await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  const before = cleared.length

  await ui.press({ key: 'close' })
  expect(cleared.length).toBe(before + 1)
  await ui.unmount()
  const again = await openPicker($)
  const count = toasts.length

  await again.press({ key: 'close' })
  expect(toasts.length).toBe(count)
  await again.unmount()
})

test('Reset drops the preview and makes the session follow the folder again, so it loses its own colour', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { scenes } = await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'red-300' })
  await ui.press({ key: 'apply-session' })
  expect(scenes.at(-1)).toBe('convo-ffa2a2')
  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'reset-window' })
  expect(scenes.at(-1)).toBe('convo-ece9e2')
  expect(await text(ui)).toMatch(/This session follows the folder colour\./)
  // No colour of its own now, so a change of the folder reaches it at the next message.
  store.set('folders', { [FOLDER]: { colour: '#d0f0bc', background: 'on', row: 'on' } })
  await submit($)
  expect(scenes.at(-1)).toBe('convo-d0f0bc')
  await ui.unmount()
})

test('Show applies at once, is the session\'s own choice, and survives a later Apply to folder', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { scenes, cleared, writes } = await setUp(on, $, store)
  const before = writes.length
  const ui = await openPicker($)

  await ui.press({ key: 'show-window' })
  expect(cleared.length).toBe(1)
  // In a folder with a folder colour the session's choice does not become the latest anywhere.
  expect(writes.slice(before)).toEqual([])
  store.set('folders', { [FOLDER]: { colour: '#d0f0bc', background: 'on', row: 'on' } })
  await submit($)
  expect(scenes).not.toContain('convo-d0f0bc')
  // Apply to folder leaves the session off: the Show switch was its own choice.
  await ui.press({ key: 'teal-300' })
  const clearedBefore = cleared.length

  await ui.press({ key: 'apply-folder' })
  expect(folderEntry(store)).toEqual({ colour: '#46ecd5', background: 'on', row: 'on' })
  // The preview was drawn on the session, and the session goes back to having no colour.
  expect(cleared.length).toBe(clearedBefore + 1)
  expect(await text(ui)).toMatch(/This session has its background off\./)
  await ui.unmount()
})

test('Show model row applies at once, in a folder with an entry it changes this session only, and Apply to folder does not overwrite it', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { writes } = await setUp(on, $, store)
  const before = writes.length
  const ui = await openPicker($)

  await ui.press({ key: 'show-row' })
  expect((await ui.find({ type: 'Button', key: 'show-row' }))?.props.label).toBe('☐ Show')
  expect(writes.slice(before)).toEqual([])
  store.set('folders', { [FOLDER]: { ...ENTRY, colour: '#d0f0bc' } })
  await submit($)
  expect((await ui.find({ type: 'Button', key: 'show-row' }))?.props.label).toBe('☐ Show')
  await ui.unmount()
})

test('a typed colour applies at once to this session as its own colour, with no preview', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { scenes, writes } = await setUp(on, $, store)
  const before = writes.length

  await $.command.run({ command: 'convo-color', args: 'light pink' } as any)
  expect(scenes.at(-1)).toBe('convo-ffb6c1')
  // The folder has a folder colour, so the latest colour is not changed and the folder is not touched.
  expect(writes.slice(before)).toEqual([])
  expect(folderEntry(store)).toEqual(ENTRY)
})

test('typed off acts on this session only: the folder keeps its colour, and in a folder with an entry the global keys stay as they were', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc'], ['folders', { [FOLDER]: ENTRY }]])
  const { cleared, scenes, writes } = await setUp(on, $, store)
  const before = writes.length
  const reply = (await $.command.run({ command: 'convo-color', args: 'off' } as any)) as { text: string }

  expect(cleared.length).toBe(1)
  expect(writes.slice(before)).toEqual([])
  expect(store.get('background')).toBeUndefined()
  expect(folderEntry(store)).toEqual(ENTRY)
  expect(reply.text).toMatch(/this session only/)
  expect(reply.text).toMatch(/folder keeps its colour/)
  // It keeps that: a change of the folder does not bring the colour back at the next message.
  store.set('folders', { [FOLDER]: { ...ENTRY, colour: '#d0f0bc' } })
  await submit($)
  expect(scenes).not.toContain('convo-d0f0bc')
})

test('typed row on and off, in a folder with an entry, change this session only', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { writes } = await setUp(on, $, store)
  const before = writes.length
  const reply = (await $.command.run({ command: 'convo-color', args: 'row off' } as any)) as { text: string }

  expect(writes.slice(before)).toEqual([])
  expect(reply.text).toMatch(/this session only/)
})

test('typed row on and off, in a folder with no entry, are kept for new sessions as before', async ($, on) => {
  const store = new Map<string, unknown>()
  const { writes } = await setUp(on, $, store)

  await $.command.run({ command: 'convo-color', args: 'row off' } as any)
  expect(store.get('model-row')).toBe('off')
  expect(writes).toContain('model-row')
})

test('there is no Remove button and no remove command', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { scenes } = await setUp(on, $, store)
  const ui = await openPicker($)
  const keys = (await ui.findAll({ type: 'Button' })).map((button: { key?: unknown }) => String(button.key))

  expect(keys.filter((key: string) => /remove|delete|clear|unset/i.test(key))).toEqual([])
  await ui.unmount()
  const before = scenes.length
  const reply = await $.command.run({ command: 'convo-color', args: 'folder off' } as any)

  expect(JSON.stringify(reply)).toMatch(/is not a hex code or a web colour name/)
  expect(scenes.length).toBe(before)
  expect(folderEntry(store)).toEqual(ENTRY)
})

test('in the LLM model mode there is one Apply button, a press previews the row, and only Apply keeps it for every session and folder', async ($, on) => {
  const store = new Map<string, unknown>()
  const { writes } = await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'target-row' })
  const keys = (await ui.findAll({ type: 'Button' })).map((button: { key?: unknown }) => String(button.key))

  expect(keys).toContain('apply')
  expect(keys).not.toContain('apply-session')
  expect(keys).not.toContain('apply-folder')
  const before = writes.length

  await ui.press({ key: 'orange-300' })
  expect((await ui.find({ type: 'Box', key: 'model-row-view' }))?.props.backgroundColor).toBe('#ffb86a')
  expect(writes.length).toBe(before)
  expect(await text(ui)).toMatch(/Preview: Orange 300 \(#ffb86a\)\. Not applied yet\./)
  await ui.press({ key: 'apply' })
  expect(store.get('row-colours')).toEqual({ opus: 'ffb86a' })
  expect(writes).not.toContain('folders')
  await ui.unmount()
})

test('closing the picker in the LLM model mode drops a row preview', async ($, on) => {
  const store = new Map<string, unknown>()
  await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'target-row' })
  await ui.press({ key: 'orange-300' })
  await ui.press({ key: 'close' })
  const band = await $.ui.mount({ ...PICKER, props: { ...PICKER.props, maxRows: 5 } })

  expect((await band.find({ type: 'Box', key: 'model-row-view' }))?.props.backgroundColor).toBe('#eb9e71')
  expect(store.get('row-colours')).toBeUndefined()
  await band.unmount()
  await ui.unmount()
})

test('the compact layout: Apply to session, Apply to folder and Close stand in one line, and Help and the version stand under the grid', async ($, on) => {
  const store = new Map<string, unknown>()
  await setUp(on, $, store)
  const ui = await openPicker($)
  const keys = (await ui.findAll({ type: 'Button' })).map((button: { key?: unknown }) => String(button.key))

  expect(keys.indexOf('apply-session')).toBeLessThan(keys.indexOf('apply-folder'))
  expect(keys.indexOf('apply-folder')).toBeLessThan(keys.indexOf('close'))
  expect((await ui.find({ type: 'Button', key: 'apply-session' }))?.props.variant).toBe('primary')
  expect((await ui.find({ type: 'Button', key: 'apply-folder' }))?.props.variant).toBe('primary')
  expect((await ui.find({ type: 'Button', key: 'close' }))?.props.variant).toBe('primary')
  const boxes = (await ui.findAll({ type: 'Box' })) as Array<{ key?: unknown }>
  const keyed = boxes.map(box => String(box.key))

  expect(keyed).toContain('actions')
  expect(keyed.indexOf('actions')).toBeLessThan(keyed.indexOf('foot'))
  await ui.unmount()
})

test('the swatches are one line high, 22 pixels, and 2 cells wide, about 18 pixels, as in 0.6.1, and every control keeps its column width', async ($, on) => {
  await setUp(on, $, new Map())
  const ui = await openPicker($)
  const swatch = await ui.find({ type: 'Box', key: 'swatch-red-50' })
  const widths = (await ui.findAll({ type: 'Box' })).map((box: { props: { width?: number } }) => box.props.width)

  // A line is one text line high, 22 pixels, and a cell is about 9 pixels wide: a patch of 2 cells is about 18 pixels wide. No height or padding is set, so the patch is the line's height.
  expect(swatch?.props.width).toBe(2)
  expect(swatch?.props.height).toBeUndefined()
  expect(swatch?.props.paddingY).toBeUndefined()
  // A line of the grid is 17 of them with no gap, 34 cells, as in 0.6.1. Six lines, and the line under the field, which stands in the colours' column when the picker is wide.
  expect(widths.filter((width: number | undefined) => width === 34).length).toBe(7)
  expect(widths.filter((width: number | undefined) => width === 16).length).toBeGreaterThanOrEqual(2)
  expect(widths.filter((width: number | undefined) => width === 9.25).length).toBeGreaterThanOrEqual(1)
  expect(widths.filter((width: number | undefined) => width === 9).length).toBeGreaterThanOrEqual(1)
  await ui.unmount()
})

test('when the engine cannot say where the session is, it behaves as in 0.6.1 and Apply to folder says there is no folder', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc'], ['folders', { [FOLDER]: ENTRY }]])
  const { scenes, toasts, writes } = await setUp(on, $, store, null)

  expect(scenes.at(-1)).toBe('convo-a3c4dc')
  const before = writes.length
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'apply-folder' })
  expect(toasts.at(-1)).toMatch(/folder of this session is not known/)
  expect(writes.length).toBe(before)
  await ui.unmount()
})

test('Apply to folder keeps the entries of the other folders, and a colour is stored as # and six hex digits', async ($, on) => {
  const other = { colour: '#d0f0bc', background: 'off', row: 'off' }
  const store = new Map<string, unknown>([['folders', { '/work/projects/other': other }]])

  await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'apply-folder' })
  expect(store.get('folders')).toEqual({ '/work/projects/other': other, [FOLDER]: { colour: '#46ecd5', background: 'on', row: 'on' } })
  await ui.unmount()
})

test('with Show background ticked off and nothing pressed, Apply to folder stores the background as off for the folder', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc']])
  const { toasts } = await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'show-window' })
  await ui.press({ key: 'apply-folder' })
  expect(folderEntry(store)).toEqual({ colour: '#a3c4dc', background: 'off', row: 'on' })
  expect(toasts.at(-1)).toMatch(/Applied to the folder atlas\./)
  await ui.unmount()
})

test('Apply to session with nothing pressed says so and changes nothing', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc']])
  const { toasts, scenes, writes } = await setUp(on, $, store)
  const before = [scenes.length, writes.length]
  const ui = await openPicker($)

  await ui.press({ key: 'apply-session' })
  expect(toasts.at(-1)).toMatch(/Nothing to apply yet\. Press a colour first\./)
  expect([scenes.length, writes.length]).toEqual(before)
  await ui.unmount()
})

test('Reset in a folder with no folder colour goes back to the latest colour and to the saved Show model row', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc'], ['model-row', 'on']])
  const { scenes, toasts } = await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'reset-window' })
  expect(scenes.at(-1)).toBe('convo-a3c4dc')
  expect(toasts.at(-1)).toMatch(/This folder has no folder colour yet\./)
  await ui.unmount()
})

test('a message sent while a colour is pressed and not applied does not undo the preview', async ($, on) => {
  const store = new Map<string, unknown>([['folders', { [FOLDER]: ENTRY }]])
  const { scenes } = await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await submit($)
  await $.session.attach({ surface: 'desktop', clientId: 'c1' })
  expect(scenes.at(-1)).toBe('convo-46ecd5')
  await ui.press({ key: 'close' })
  expect(scenes.at(-1)).toBe('convo-ece9e2')
  await ui.unmount()
})

test('switching from Background to LLM model drops a pressed window colour and says so', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc']])
  const { scenes, toasts } = await setUp(on, $, store)
  const ui = await openPicker($)

  await ui.press({ key: 'teal-300' })
  await ui.press({ key: 'target-row' })
  expect(scenes.at(-1)).toBe('convo-a3c4dc')
  expect(toasts.at(-1)).toMatch(/Back to the colour this session had\./)
  expect(await text(ui)).toMatch(/Model row colours are global, not per folder\./)
  await ui.unmount()
})

// Side by side, the line under the field stands under the colours, above Help, in the column of the colours. Narrower, where the colours drop under the controls, it stays under the field.
async function pickerAt(columns: number, $: any) {
  await $.command.run({ command: 'convo-color', args: '' } as any)

  return $.ui.mount({ ...PICKER, props: { ...PICKER.props, bodyColumns: columns } })
}
const holds = async (ui: any, box: string) => JSON.stringify(await ui.find({ type: 'Box', key: box })).includes('caption-box')

test('wide, the line under the field stands in the column of the colours, above the Help link', async ($, on) => {
  await setUp(on, $, new Map())
  const ui = await pickerAt(100, $)

  expect(await holds(ui, 'grid')).toBe(true)
  expect(await holds(ui, 'controls')).toBe(false)
  const grid = JSON.stringify(await ui.find({ type: 'Box', key: 'grid' }))

  expect(grid.indexOf('caption-box')).toBeLessThan(grid.indexOf('"Help"'))
  expect(grid.indexOf('"Help"')).toBeLessThan(grid.indexOf('"close"'))
  // The bottom line holds the version, then Help, then Close, at the right edge.
  expect(grid.indexOf('"v')).toBeLessThan(grid.indexOf('"Help"'))
  expect((await ui.find({ type: 'Box', key: 'foot' }))?.props.justifyContent).toBe('flex-end')
  // A blank line, one text line high, stands between the colours and that line, above Close.
  expect((await ui.find({ type: 'Box', key: 'room' }))?.props.height).toBe(1)
  expect(grid.indexOf('caption-box')).toBeLessThan(grid.indexOf('"room"'))
  expect(grid.indexOf('"room"')).toBeLessThan(grid.indexOf('"foot"'))
  await ui.unmount()
})

test('narrow, the line under the field stays in the column of the controls', async ($, on) => {
  await setUp(on, $, new Map())
  const ui = await pickerAt(60, $)

  expect(await holds(ui, 'controls')).toBe(true)
  expect(await holds(ui, 'grid')).toBe(false)
  expect(await text(ui)).toMatch(/No folder colour here yet/)
  await ui.unmount()
})

// The Apply row is wider than the other control rows when Close stands in it, and that pushes the colours away. Side by side, Close stands at the right edge of the colours instead.
const holdsClose = async (ui: any, box: string) => JSON.stringify(await ui.find({ type: 'Box', key: box })).includes('"close"')

test('wide, Close stands in the column of the colours, and the Apply line holds only the Apply buttons', async ($, on) => {
  await setUp(on, $, new Map())
  const ui = await pickerAt(100, $)

  expect(await holdsClose(ui, 'actions')).toBe(false)
  expect(await holdsClose(ui, 'foot')).toBe(true)
  expect(await holdsClose(ui, 'grid')).toBe(true)
  expect(await holdsClose(ui, 'controls')).toBe(false)
  await ui.press({ key: 'close' })
  await ui.unmount()
})

test('narrow, Close stays in the Apply line', async ($, on) => {
  await setUp(on, $, new Map())
  const ui = await pickerAt(60, $)

  expect(await holdsClose(ui, 'actions')).toBe(true)
  expect(await holdsClose(ui, 'grid')).toBe(false)
  await ui.unmount()
})
