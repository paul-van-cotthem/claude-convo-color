# Build your own colour mod with Claude

Use this when you want Claude to build the colour mod for you from scratch, instead of installing the finished one. It makes a mod that colours the area behind the conversation and the strip behind the prompt box, keeps the sidebar in the app's own look, and works for any colour in the app's light, dark or system mode.

Written 14/11/2026, from what was measured on Claude desktop app 5.11492.5 with Claude Code 2.1.325. The 280 pixel sidebar width is the width on that app and may differ on yours.

## Before you start

1. Open a local session in the desktop app's Code tab. Over SSH, in WSL or in the cloud, the backdrop is not drawn.
2. If you have another theme add-on, such as the theme-examples plugin, turn its theme off first. A session holds one theme, and a later one replaces an earlier one.
3. Fill in your colour in the prompt below, then send it.
4. When the app asks "Turn on the mods Claude writes in this session?", choose "Turn them on".

## The prompt

```
Use the plugin-authoring skill to make me a small mod, named convo-color, that sets the colour behind the conversation in the Claude desktop app.

The colour I want to start with: <write a six-digit hex such as #f5eedc, or describe it in words>.

How it must look:
- The colour fills the area behind the conversation and the strip behind the prompt box.
- The sidebar on the left keeps the app's own look, with the colour starting at its right edge. The app's sidebar is #fcfcfb in its light mode and #151515 in its dark mode.
- Any colour is allowed, in the app's light, dark or system mode. The text must stay readable.

How to build it, because a plain colour backdrop cannot do this:
1. Use a scene backdrop. Name the scene after the colour, for example convo-f5eedc, and draw it with a ui.render hook on Backdrop that returns an Svg.
2. Draw the SVG with no viewBox, so one unit is one pixel: a rectangle in my colour that fills the whole area, then a rectangle 280 pixels wide and full height at the left, under the sidebar, in the sidebar's own colour for the window mode. Ask me to check that 280 matches my sidebar and change it if not.
3. The mod cannot read the app's light or dark setting, and the app's own dark layer hides most of a colour in dark mode. So the mod sets the colour scheme override itself, to light or dark, whichever gives the app's main text (#0b0b0b in light, #f0efec in dark) the higher contrast on my colour. That switches the whole window, sidebar included. This is the rule: a colour with a relative luminance above 0.17, a plain grey of #737373, gets a light window, and a deeper colour gets a dark window.
4. Set the backdrop glass to blur 8 and opacity 0.12, with a white tint for a light window and a black tint for a dark one. That veil is thin enough that the strip behind the prompt box takes my colour.
5. Send the theme in one theme call, with everything in it. Do not clear any theme unless I ask.
6. At session start the desktop app may not be attached yet, and then the theme call says it is not drawn. Try again when the app attaches (the session.attach event) and at every prompt, until it is drawn.

Checks it must make:
- Accept every colour. Measure the contrast of the chosen text colour on my colour and, below 4.5 to 1, apply the colour and warn me.
- Measure the faint text (#898781) on my colour. Below 3 to 1, apply the colour and warn me.
- If the theme call says it is not drawn, show me the reason it gives.

Also add a slash command, /convo-color, that takes a six-digit hex or a CSS colour name and applies it. With no argument it shows a row of buttons above the prompt box, a block of each colour beside its name, sorted into the colours that give a light window and those that give a dark window, plus Off and Close buttons. Each session keeps its own colour. Keep the colour chosen most recently, in any session, in the mod's own store, and let a new session start with it. /convo-color off clears the colour in that session only.

Validate and type-check the mod as the skill says before you tell me it is ready. Then tell me in plain words where its files are, how to remove it, and which colour a new session starts with. Do not change my settings files.
```

## After it is built

- Send any short message first. The command exists in a session only after its first message.
- Look at the result in light and dark mode, and send Claude a screenshot if something is off. Screenshot colours are shifted slightly from the real ones, so judge the colour by eye, not by the pixels.
- The finished version of this mod, ready to install, is at https://github.com/paul-van-cotthem/claude-convo-color.
