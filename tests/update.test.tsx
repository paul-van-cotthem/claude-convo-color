import { expect, test } from 'claude-code/testing'

const ABOVE_PROMPT = { plugin: 'convo-color', component: 'AbovePrompt', props: { hasSurvey: false } } as const

// The mocked clock fires at once, so the session does not wait for the check here. The row is looked for for a moment instead.
async function waitFor<T>(look: () => Promise<T | undefined>): Promise<T | undefined> {
  for (let tries = 0; tries < 30; tries += 1) {
    const found = await look()

    if (found !== undefined) {
      return found
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  return undefined
}

const NEWER = { status: 200, ok: true, headers: {}, text: '{"name":"convo-color","version":"9.9.9"}' }

test('a newer version on GitHub puts the update row above the prompt box, and Update now runs the two commands', async ($, on) => {
  const ran: string[] = []

  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/tmp' }))
  on('session.attach', () => ({ clientId: 'c1' }))
  on('ui.status', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('theme.set', () => ({ value: { isDrawn: true } }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('http.fetch', () => ({ value: NEWER }))
  on('process.run', (_, e) => {
    ran.push(e.argv.join(' '))

    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })

  await $.session.attach({ surface: 'desktop' })

  const ui = await $.ui.mount({ ...ABOVE_PROMPT, surface: 'desktop' })

  expect((await waitFor(() => ui.find({ type: 'Text', text: /9\.9\.9 is available/ })))?.text).toMatch(/9\.9\.9 is available/)
  await ui.press({ key: 'go' })
  expect(ran.join('\n')).toMatch(/claude plugin marketplace update convo-color && .*claude plugin update convo-color@convo-color/)
  expect((await waitFor(() => ui.find({ type: 'Text', text: /is updated/ })))?.text).toMatch(/reload-plugins/)

  // A reload runs session.start again. The finished row then says what is no longer true, so it must go.
  await $.session.start({ cwd: '/tmp', surface: 'desktop', isInteractive: true })
  expect(await waitFor(async () => ((await ui.find({ type: 'Text', text: /is updated/ })) === undefined ? true : undefined))).toBe(true)
  await ui.unmount()
})

test('an update that cannot run shows the two commands, for a terminal and for PowerShell on Windows', async ($, on) => {
  on('command.register', () => ({ value: undefined }))
  on('session.attach', () => ({ clientId: 'c1' }))
  on('ui.status', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('theme.set', () => ({ value: { isDrawn: true } }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('http.fetch', () => ({ value: NEWER }))
  on('process.run', () => ({ value: { exitCode: 1, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))

  await $.session.attach({ surface: 'desktop' })

  const ui = await $.ui.mount({ ...ABOVE_PROMPT, surface: 'desktop' })

  expect((await waitFor(() => ui.find({ type: 'Text', text: /9\.9\.9 is available/ })))?.text).toMatch(/9\.9\.9 is available/)
  await ui.press({ key: 'go' })

  const failed = (await waitFor(() => ui.find({ type: 'Text', text: /could not run from here/ })))?.text

  expect(failed).toMatch(/In a terminal \(on Windows: PowerShell\), run these two commands/)
  expect(failed).toMatch(/claude plugin marketplace update convo-color, then claude plugin update convo-color@convo-color/)
  // "the Terminal app" is a Mac program. The sentence is also read on Windows.
  expect(failed).not.toMatch(/Terminal app/)
  await ui.unmount()
})

test('the same version on GitHub shows no row', async ($, on) => {
  on('session.attach', () => ({ clientId: 'c1' }))
  on('ui.status', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('theme.set', () => ({ value: { isDrawn: true } }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('http.fetch', () => ({ value: { ...NEWER, text: '{"name":"convo-color","version":"0.0.1"}' } }))

  await $.session.attach({ surface: 'desktop' })

  const ui = await $.ui.mount({ ...ABOVE_PROMPT, surface: 'desktop' })

  await new Promise(resolve => setTimeout(resolve, 100))
  expect(await ui.find({ type: 'Text', text: /is available/ })).toBeUndefined()
  await ui.unmount()
})

test('with an offer waiting, the picker opens only after Not now', async ($, on) => {
  on('session.attach', () => ({ clientId: 'c1' }))
  on('ui.status', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('theme.set', () => ({ value: { isDrawn: true } }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('http.fetch', () => ({ value: NEWER }))

  await $.session.attach({ surface: 'desktop' })
  await $.command.run({ command: 'convo-color', args: '' })

  const ui = await $.ui.mount({ ...ABOVE_PROMPT, surface: 'desktop' })

  expect((await waitFor(() => ui.find({ type: 'Text', text: /9\.9\.9 is available/ })))?.text).toMatch(/9\.9\.9 is available/)
  expect(await ui.find({ type: 'Button', key: 'close' })).toBeUndefined()
  await ui.press({ key: 'later' })
  expect((await waitFor(() => ui.find({ type: 'Button', key: 'close' })))?.props.label).toBe('Close')
  expect(await ui.find({ type: 'Text', text: /is available/ })).toBeUndefined()
  await ui.unmount()
})

test('a press on a swatch only previews that colour and leaves the picker open, and only Close closes it', async ($, on) => {
  const scenes: string[] = []

  on('session.attach', () => ({ clientId: 'c1' }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('theme.set', (_, e) => {
    scenes.push(String(e.backdrop?.scene))

    return { value: { isDrawn: true } }
  })
  on('theme.clear', () => ({ value: undefined }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('http.fetch', () => ({ value: { status: 200, ok: true, headers: {}, text: '{"name":"convo-color","version":"0.0.1"}' } }))

  await $.session.attach({ surface: 'desktop' })
  await $.command.run({ command: 'convo-color', args: '' })

  const ui = await $.ui.mount({ ...ABOVE_PROMPT, surface: 'desktop' })

  expect((await waitFor(() => ui.find({ type: 'Button', key: 'close' })))?.props.label).toBe('Close')
  // The key of a swatch's button is the colour's name in lower case with a hyphen: Red 300 here, then Orange 300. A press only previews the colour.
  await ui.press({ key: 'red-300' })
  expect(scenes.at(-1)).toBe('convo-ffa2a2')
  // The picker stays open, so a second colour can be tried at once.
  expect(await ui.find({ type: 'Button', key: 'close' })).toBeDefined()
  await ui.press({ key: 'orange-300' })
  expect(scenes.at(-1)).toBe('convo-ffb86a')
  // The text field takes a web colour name, or hex digits with or without a #, applies it at once and leaves the picker open.
  await ui.input({ key: 'typed', text: 'light pink' })
  expect(scenes.at(-1)).toBe('convo-ffb6c1')
  await ui.input({ key: 'typed', text: '#2B2B2B' })
  expect(scenes.at(-1)).toBe('convo-2b2b2b')
  // Text that is no colour changes nothing, and neither does a name the grid shows for a colour: those are labels only.
  await ui.input({ key: 'typed', text: 'Zzqx control' })
  expect(scenes.at(-1)).toBe('convo-2b2b2b')
  await ui.input({ key: 'typed', text: 'Orange 300' })
  expect(scenes.at(-1)).toBe('convo-2b2b2b')
  expect(await ui.find({ type: 'Button', key: 'close' })).toBeDefined()
  // The grid is Tailwind's palette: 17 families in a line (Red to Rose), five lines in the light set (shades 50 to 400) and four in the dark set (700 to 950),
  // with the kept neutrals in one more line under each set.
  const keys = (await ui.findAll({ type: 'Box' })).map(box => String(box.key))
  const swatches = keys.filter(key => key.startsWith('swatch-'))

  // The window is now a dark colour, so the dark set is the one shown: Red 700 first, Orange 700 next, and Red 800 starts the second line.
  expect(swatches).toHaveLength(85)
  expect(swatches[0]).toBe('swatch-red-700')
  expect(swatches[1]).toBe('swatch-orange-700')
  expect(swatches[17]).toBe('swatch-red-800')
  // A swatch cuts off the part of the app's button that would stick out of the colour.
  expect((await ui.find({ type: 'Box', key: 'swatch-red-700' }))?.props.overflow).toBe('hidden')
  // No border on a patch: the app draws it a whole character cell thick.
  expect((await ui.find({ type: 'Box', key: 'swatch-red-700' }))?.props.borderStyle).toBeUndefined()
  // There is no header and no Off button any more: Show is the switch.
  expect(await ui.find({ type: 'Text', text: /Claude Convo Color/ })).toBeUndefined()
  expect(await ui.find({ type: 'Button', key: 'off' })).toBeUndefined()
  // Help and the version stand in one line under the grid, in that order. The buttons that apply the colour and Close stand in one line under the controls.
  expect((await ui.find({ type: 'Box', key: 'foot' }))?.props.alignItems).toBe('center')
  expect((await ui.find({ type: 'Box', key: 'foot' }))?.props.columnGap).toBe(1)
  // The controls stand in three columns of fixed width (16, 9.25 and 9 cells), so the buttons line up whatever their own widths: the radio
  // buttons in the first, Show in the second, Reset and Set in the third, and Dark mode over the second and third together. The field has no box
  // of its own now (it stands flush left under the buttons), and a line of the grid is 34 cells, five lines in the dark set.
  const widths = (await ui.findAll({ type: 'Box' })).map(box => box.props.width)
  const count = (width: number) => widths.filter(value => value === width).length

  expect([count(16), count(9.25), count(9), count(18.25), count(35), count(34)]).toEqual([2, 1, 1, 1, 0, 5])
  // The padded labels are what line the buttons up (a button takes the width of its text): Light mode 14 and one hair space, Dark mode 18, Session color 15 and one hair space,
  // (LLM bar color 15, with no padding, checked in the row tests; the hair spaces measured from a screenshot of the desktop app), Show 6, Reset 7 and the field's Set 8, so that the three radio buttons are as wide as each other and Dark mode and Set
  // end where Reset ends.
  const lengths = async (key: string) => String((await ui.find({ type: 'Button', key }))?.props.label).length

  expect([await lengths('set-light'), await lengths('set-dark'), await lengths('target-window'), await lengths('show-window'), await lengths('reset-window')]).toEqual([15, 17, 16, 6, 7])
  // The Set label stands in the middle of its button: as much room on each side, to within one hair space, and as much room in all as the 8 half-wide spaces that make it as wide as Reset.
  const set = String((await ui.find({ type: 'Input', key: 'typed' }))?.props.submitLabel)
  const room = (text: string) => [...text].reduce((sum, ch) => sum + (ch === '\u2002' ? 12 : 1), 0)
  const [before, after] = set.split('Set')

  expect(Math.abs(room(before) - room(after))).toBeLessThanOrEqual(1)
  expect(room(before) + room(after)).toBe(59)
  const version = await ui.find({ type: 'Text', text: /^v\d+\.\d+\.\d+$/ })

  expect(version?.props.size).toBe('caption')
  // The field hints at what it takes. Its own button is the Set button, so there is no second one.
  // The field is left-aligned with the buttons above it and its Set button follows it, so it has no label in front of it and no box
  // of its own. The hint stays inside the field.
  expect((await ui.find({ type: 'Input', key: 'typed' }))?.props.label).toBeUndefined()
  expect((await ui.find({ type: 'Input', key: 'typed' }))?.props.placeholder).toBe('Hex code or name')
  expect(String((await ui.find({ type: 'Input', key: 'typed' }))?.props.submitLabel).trim()).toBe('Set')
  expect(await ui.find({ type: 'Button', key: 'set' })).toBeUndefined()
  // Help is a plain link, labelled only "Help": the app draws it and opens the project's page on GitHub, which shows the README. It is not a button.
  expect((await ui.find({ type: 'Link' }))?.props.label).toBe('Help')
  expect((await ui.find({ type: 'Link' }))?.props.href).toBe('https://github.com/paul-van-cotthem/claude-convo-color')
  expect((await ui.findAll({ type: 'Button' })).map(button => String(button.props.label))).not.toContain('Help')
  // Close is the app's main button.
  expect((await ui.find({ type: 'Button', key: 'close' }))?.props.variant).toBe('primary')
  // Only Close closes it.
  await ui.press({ key: 'close' })
  expect(await ui.find({ type: 'Button', key: 'close' })).toBeUndefined()
  await ui.unmount()
})

test('Help is a link, and no press in the picker starts a program', async ($, on) => {
  const ran: string[] = []

  on('session.attach', () => ({ clientId: 'c1' }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('theme.set', () => ({ value: { isDrawn: true } }))
  on('theme.clear', () => ({ value: undefined }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('http.fetch', () => ({ value: { ...NEWER, text: '{"name":"convo-color","version":"0.0.1"}' } }))
  on('process.run', (_, e) => {
    ran.push(e.argv.join(' '))

    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })

  await $.session.attach({ surface: 'desktop' })
  await $.command.run({ command: 'convo-color', args: '' })

  const ui = await $.ui.mount({ ...ABOVE_PROMPT, surface: 'desktop', props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 8, bodyColumns: 100 } } as any)

  expect((await waitFor(() => ui.find({ type: 'Link' })))?.props.label).toBe('Help')
  expect((await ui.find({ type: 'Link' }))?.props.href).toBe('https://github.com/paul-van-cotthem/claude-convo-color')
  expect(await ui.findAll({ type: 'Link' })).toHaveLength(1)
  // The line is the version, then Help, then Close.
  const foot = JSON.stringify(await ui.find({ type: 'Box', key: 'foot' }))

  expect(foot.indexOf('"v')).toBeLessThan(foot.indexOf('"Help"'))
  expect(foot.indexOf('"Help"')).toBeLessThan(foot.indexOf('"close"'))
  // Presses on the controls start no program.
  for (const key of ['red-300', 'set-dark', 'target-window', 'show-window', 'reset-window', 'apply-session', 'apply-folder']) {
    await ui.press({ key })
  }
  expect(ran).toEqual([])
  await ui.unmount()
})
