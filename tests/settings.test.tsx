import { expect, test } from 'claude-code/testing'

// The settings are kept between sessions: a new session starts from the latest time each was set, in any session.
// Typed colours are hex codes and web colour names only. A fake store stands for the one all sessions share.
async function setUp(on: any, $: any, store: Map<string, unknown>) {
  const scenes: string[] = []
  const cleared: number[] = []
  const toasts: string[] = []

  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/tmp' }))
  on('session.attach', () => ({ clientId: 'c1' }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: store.get(e.key) }))
  on('store.set', (_: unknown, e: { key: string; value: unknown }) => {
    store.set(e.key, e.value)

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
  on('classic.PostModelSwitch', () => ({}))

  await $.session.start({ cwd: '/tmp', surface: 'desktop', isInteractive: true })
  await $.session.attach({ surface: 'desktop' })

  return { scenes, cleared, toasts }
}

test('a picker name such as sage is no longer a typed colour, and a web colour name still is', async ($, on) => {
  const store = new Map<string, unknown>()
  const { scenes } = await setUp(on, $, store)
  const before = scenes.length

  const refused = await $.command.run({ command: 'convo-color', args: 'sage' } as any)

  // The refusal names the word that failed.
  expect(JSON.stringify(refused)).toContain('\\"sage\\" is not a hex code or a web colour name')
  await $.command.run({ command: 'convo-color', args: 'deep teal' } as any)
  expect(scenes.length).toBe(before)

  await $.command.run({ command: 'convo-color', args: 'light pink' } as any)
  expect(scenes.at(-1)).toBe('convo-ffb6c1')
})

test('a hex code saved earlier is still the starting colour of a new session, and the default is f5eedc', async ($, on) => {
  const withSaved = await setUp(on, $, new Map([['colour', '#a3c4dc']]))

  expect(withSaved.scenes.at(-1)).toBe('convo-a3c4dc')
})

test('with nothing saved, the first colour is the default f5eedc', async ($, on) => {
  const { scenes } = await setUp(on, $, new Map())

  expect(scenes.at(-1)).toBe('convo-f5eedc')
})

test('typed off is saved for new sessions and keeps the chosen colour', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc']])
  const { cleared } = await setUp(on, $, store)

  await $.command.run({ command: 'convo-color', args: 'off' } as any)
  expect(cleared.length).toBe(1)
  expect(store.get('background')).toBe('off')
  expect(store.get('colour')).toBe('#a3c4dc')
})

test('a new session after an off anywhere starts without the colour, and choosing a colour brings it and the saved choice back', async ($, on) => {
  const store = new Map<string, unknown>([['colour', '#a3c4dc'], ['background', 'off']])
  const { scenes } = await setUp(on, $, store)

  expect(scenes.length).toBe(0)
  await $.command.run({ command: 'convo-color', args: 'a3c4dc' } as any)
  expect(scenes.at(-1)).toBe('convo-a3c4dc')
  expect(store.get('background')).toBe('on')
})

test('a colour saved for one family does not undo what another session saved for another', async ($, on) => {
  const store = new Map<string, unknown>([['row-colours', { opus: 'aaaaaa' }]])

  await setUp(on, $, store)
  // Another session saves a colour for haiku after this one started.
  store.set('row-colours', { opus: 'aaaaaa', haiku: 'bbbbbb' })
  await $.command.run({ command: 'convo-color', args: '' } as any)
  const ui = await $.ui.mount({ plugin: 'convo-color', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 8, bodyColumns: 100 } } as any)

  await ui.press({ key: 'target-row' })
  await ui.input({ key: 'typed', text: 'c2a1f2' })
  await ui.unmount()
  expect(store.get('row-colours')).toEqual({ opus: 'c2a1f2', haiku: 'bbbbbb' })
})
