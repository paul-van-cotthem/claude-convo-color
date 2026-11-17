// The model row above the prompt box: the family it belongs to, a colour and the words on it.
export type ModelRow = { family: string; tint: `#${string}`; ink: `#${string}`; label: string }

declare module 'claude-code' {
  interface PluginState {
    'convo-color': {
      picking: boolean
      update: { latest: string; installed: string; step: 'offer' | 'running' | 'done' | 'failed' } | null
      'model-row': ModelRow | null
      'row-on': boolean
      // The colours the person chose for a family's row, by family name, six hex digits each.
      'row-colours': Record<string, string>
      // What the picker's swatches and text field colour: the window, or the row of the model in use.
      target: 'window' | 'row'
      // Which set of colours the grid shows: the person's choice, or null for the set of the colour being edited. Never stored.
      set: 'light' | 'dark' | null
      // Whether the background colour is shown.
      'background-on': boolean
      // This session's own colour: six hex digits, or 'off', or null while the session has none and follows its folder. It outlives a reload of the add-on.
      own: string | null
      // Whether the session chose its Show model row switch itself (true is on, false is off), or null while it follows its folder.
      'own-row': boolean | null
      // The folder colour entry this session last drew from, as "colour|background|row", or null. A different entry in the store means the folder changed.
      'drawn-from': string | null
      // A colour pressed in the picker and not applied yet: six hex digits and the name the grid shows for it.
      preview: { hex: string; name: string } | null
    }
  }
}
