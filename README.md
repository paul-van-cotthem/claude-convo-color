# Convo Color: plug-in for the Claude desktop app (Code tab) to set the background color per local conversation session or per folder. Also, a colored indicator bar above the prompt box shows which LLM-model is in use.

A small add-on (a mod) for Claude, the AI assistant from Anthropic. It works in the Claude desktop app, in its Code tab. It sets the colour behind your conversation, and it can show which model you are using in a coloured row above the prompt box. It works in the app's light mode, dark mode or system mode. It does nothing in a terminal window or in a web browser. Installing it takes about two minutes. It was built and tried on a Mac.

convo-color is an independent project. It is not made, endorsed or supported by Anthropic.

![The colour picker in a light window: the buttons Light mode and Dark mode, the lines Session color and LLM bar color each with Show and Reset, a field marked Hex code or name with Set, the buttons Apply to session and Apply to folder, six lines of light colour swatches with the line This session follows the folder colour under them, then the version, the link Help and the button Close, and under the picker a violet row that says Fable](docs/picker-light.png)

*The picker that `/convo-color` opens above the prompt box, here in a light window. The row under it is the model row, here for Fable.*

**Install in short.** First check the requirements in the box further down: if one point is not true, the install or the add-on fails. Then paste these three lines into a terminal, one after the other, and follow [Fast track instructions](#fast-track-instructions) for the steps in the app. On Windows, read [On Windows](#on-windows) first.

```
claude update
claude plugin install convo-color --marketplace paul-van-cotthem/claude-convo-color
claude plugin list
```

## What it can do

- **Want your own conversation background colour?** Pick a colour from a light set or a dark set of colours, or type a hex code or a web colour name.
- **Want to see at a glance which project you are in?** Give each folder its own colour with **Apply to folder**. Every session in that folder then shows it. A session can still have a colour of its own, with **Apply to session**. See *Apply to session and Apply to folder*, further down.
- **Want to see at a glance which model you are using?** A row above the prompt box names the model family, Fable, Opus, Sonnet or Haiku, in a colour of its own. You can turn it off and give each family a colour of your own. See *The model row*, further down.

convo-color sets two things. The first is the colour of the conversation background: the area behind the conversation and the strip behind the prompt box. The second is the model row, a thin row above the prompt box with the name of the model family on a colour of its own. The model row has its own colours and its own on and off. It never changes the conversation background.

Two other things change with the conversation colour:

- The sidebar on the left does not take your colour. The add-on gives it a fixed colour: near white (`#fcfcfb`) in a light window and near black (`#151515`) in a dark one. In a light window that is whiter than the sidebar is without the add-on.
- To keep the text readable, the whole window turns light for a bright colour and dark for a deep one. See *When the whole window switches between light and dark*, further down.

**Windows users:** the instructions for Windows are at the bottom of this page, in [On Windows](#on-windows). The add-on is reported to work on Windows.

![The same colour picker in a dark window, on its Dark mode set of five lines of deep colour swatches, with Session color chosen, a line under the swatches that says Preview: Slate 700 (#314158). Not applied yet, and under the picker a violet row that says Fable](docs/picker-dark.png)

*The same picker in a dark window, on the Dark mode set, with a colour previewed and not applied yet. The row under it is the model row for Fable.*

> [!IMPORTANT]
> **Requirements: check all of this before you paste the install line.** If one point is not true, the install or the add-on fails.
>
> 1. You use the Claude desktop app, in its Code tab. It does nothing in the Terminal app or in a web browser. The Claude Code inside the app is version 2.1.323 or later: in a Local session in the Code tab, type `/status` and read the row **Claude Code**. If it shows an older version, update the desktop app. It was tried on desktop app 5.11492.5 on a Mac.
> 2. The Claude Code in your Terminal is version 2.1.292 or later. It is a second copy, separate from the one inside the app. Type `claude --version` to check and `claude update` to update it. If Terminal says `command not found`, Claude Code is not set up on your computer.
> 3. You will use it in a Local session. Under the prompt box, click the first button on the left and choose an entry under the heading Local. A Cloud or SSH session runs on another machine and does not load it.
> 4. Right after the install, `/convo-color` does not work yet. Open the Claude desktop app and go to its Code tab, not a normal Claude chat. Start a new session there and make it a Local session, not a Cloud one, as in point 3. Type any short message such as `hi`, send it and wait until Claude starts to answer. From then on `/convo-color` works in that session. Every new session needs this one message first, not only the first session after the install.

## Tips

For people who will not read the whole page:

- **A press on a colour only previews it.** It shows on this session's window and nothing is saved. Press **Apply to session** or **Apply to folder** to keep it, or **Close** to go back. If you have used version 0.6.1: there a press applied the colour at once. See *Apply to session and Apply to folder*.
- **Colour a whole project:** press a colour, then **Apply to folder**. Every session in that folder shows it. See *Each folder and each session has its own colour*.
- **Give one session a colour of its own:** press a colour, then **Apply to session**. It keeps it when the folder colour changes. **Reset** next to **Session color** brings it back to the folder colour. See *One session with a colour of its own in a folder that has a colour*.
- **Sessions that follow the folder** take up a change of the folder colour at their next message, so an idle session catches up when you write in it.
- **`/convo-color off` and the Show boxes** act on this session only where the folder has a colour. Where it has none, new sessions start with the same choice. See *Each folder and each session has its own colour*.
- **To leave a folder without a colour,** untick **Show** next to **Session color**, then press **Apply to folder**. No button removes a folder colour.
- **The model row colours are the same everywhere,** in every session and every folder, and are never set per folder. See *The model row*.
- **Send one message before `/convo-color`.** A brand-new session does not know the command yet. See *Warning: send one message first*.
- **After Update now,** the new version is on disk. A session that is already open keeps running the old one until you type `/reload-plugins` in it, and a session you start afterwards uses the new one by itself. That is how it behaves in use, not something tested in this build. See *Updates*.

## Fast track instructions

**Windows users:** the instructions for Windows are at the bottom of this page, in [On Windows](#on-windows). The add-on is reported to work on Windows.

For people who know their way around a terminal. The rest of this page is the step-by-step version.

You need the Claude desktop app. Paste these three lines into a terminal, one after the other. They update Claude Code (the install needs version 2.1.292 or later), install the add-on and list your add-ons. The list must show `convo-color@convo-color` with `Status: enabled`.

```
claude update
claude plugin install convo-color --marketplace paul-van-cotthem/claude-convo-color
claude plugin list
```

Then, in the desktop app:

1. Open the Claude desktop app and click the **Code** tab.
2. Click **+ New** in the sidebar to start a new session. On a Mac, Command and N does the same.
3. Under the prompt box, click the first button on the left, the one with a small computer icon and a name. A menu opens. Under the heading **Local**, choose **This computer** or any folder name. Do not choose anything under Cloud or Remote Control. If a folder button appears next to it, click it, choose **Open folder…** and pick any folder. Do this before you send your first message.
4. Send any short message, such as `hi`, and let the answer start. The command exists only after the first message.
5. Type `/convo-color` for a picker, or `/convo-color f5eedc`, `/convo-color light pink` or `/convo-color off`. Type `/convo-color row off` to turn the model row off.

What to expect:

- Any colour is accepted. A folder can have a colour that all its sessions follow, and a session can have a colour of its own. Where a folder has no colour, a new session starts with the settings you set most recently in such a folder. See *Each folder and each session has its own colour*, further down.
- A thin row above the prompt box names the model family in use, such as Opus, on a colour of its own. It follows the model when you change it. It is on from the start. See *The model row*, further down.
- To keep the text readable, the whole app window is drawn light for a colour brighter than the grey `#737373` (relative luminance 0.17) and dark for a deeper one, whatever the app's own setting is.
- It works only in the desktop app's Code tab, not in a terminal or a browser.
- When a session starts, it looks on GitHub for a newer version. If there is one, a row above the prompt box offers to update. See *Updates*, further down.
- If the install line says `error: unknown option '--marketplace'`, `claude update` did not reach your Claude Code. See *Install it*, further down.

## Use it

Type one of these at the prompt box:

| You type | What happens |
| :-- | :-- |
| `/convo-color` | A picker appears above the prompt box. Its colours are the Tailwind CSS palette, in two sets. **Light mode** and **Dark mode** choose the set. The light set has five lines of 17 colours, from pale to medium, and a line of 17 beiges. The dark set has four lines of 17 deep colours and a line of 17 greys. Click a colour to preview it in this session: nothing is saved and a line names it and says it is not applied yet. The picker stays open, so you can try several. Two buttons choose what the colours set: **Session color**, the conversation background, or **LLM bar color**, the colour of the model row. Each has a **Show** tick box and its own **Reset**. With **Session color** chosen, **Apply to session** keeps the previewed colour in this session only, and **Apply to folder** keeps it for every session in this folder. With **LLM bar color** chosen there is one button, **Apply**. **Close** leaves the picker, and without applying it puts back the colour the session had. For any other colour, type a hex code or a web colour name in the field marked **Hex code or name** and press **Set**. A typed colour applies at once, to this session. Under the colours stand the installed version and **Help**, a link that opens this project's page on GitHub in your web browser. When the conversation is wide enough, the colours stand beside the controls and **Close** stands at the right end of that line. Otherwise the colours stand under the controls and **Close** stands next to the Apply buttons. The next sections say what each button does. |
| `/convo-color f5eedc` | Sets that colour. Six hex digits, with or without a `#`. |
| `/convo-color light pink` | Sets a standard web colour name. Capitals, spaces and hyphens do not matter. Only hex codes and standard web colour names can be typed. The names the picker showed before version 0.6.1, such as sage, deep teal or palest blue, no longer work when typed. A colour you saved as a hex code keeps working. |
| `/convo-color off` | Turns the background colour off in this session and gives you the app's own look back. It is the same as unticking **Show** next to **Session color**. There is no **Off** button in the picker: **Show** does that job. The colour is remembered, so ticking **Show** again brings it back. It leaves the model row as it is. It never changes a folder colour. In a folder with no folder colour, new sessions then start without the colour too: see *Each folder and each session has its own colour*. |
| `/convo-color row off` | Turns the model row off. It is the same as unticking **Show** next to **LLM bar color**. |
| `/convo-color row on` | Turns the model row on again. |
| `/convo-color update` | Looks on GitHub now for a newer version and says what it found. If there is one, a row above the prompt box offers to update. |

Every colour is accepted. A colour that leaves the text hard to read, or the faint grey text hard to read, is applied with a warning.

About the picker:

- A swatch looks a little greyer than the colour it sets, because the app draws its own button over it. The colour you get after a click is the true one. For the same reason the outlines of the buttons and of the field are fainter than they should be. The app draws them and the add-on cannot change them.
- Every colour in the light set gives a light window and every colour in the dark set gives a dark window, so the text always reads well on a preview.
- The line under the field, or under the colours in a wide conversation, gives the previewed colour's hex code and its grid name, such as `#ff6467 (Red 400)`. The grid names are labels only. Typing one does nothing: a typed name is always a web colour name. When nothing is previewed, the same line says whether this session has a colour of its own, follows its folder, or has no folder colour yet.
- **Light mode** and **Dark mode** choose which set of colours you see. They do not change the look of the app. The set that opens is the set of the colour you are editing. Nothing about it is remembered.
- **Session color** and **LLM bar color** choose what the colours and the field set. Both use the same two sets. **LLM bar color** sets the colour of the model row of the model you use now. See *The model row*.
- **Reset** next to **Session color** drops a preview and makes this session follow its folder again, so it loses a colour of its own: the folder colour if the folder has one, otherwise the colour new sessions start with. **Reset** next to **LLM bar color** gives the row of the model in use its own colour again. See *What the two Resets do*. The **LLM bar color** line appears once the app has told the add-on which model is in use.
- Applying a colour, or typing one, turns the background on again if it was off. A press on a colour only previews it.
- The **Show** tick boxes act at once and are this session's own choice. They never change a folder colour.

## Step by step

**Windows users:** the instructions for Windows are at the bottom of this page, in [On Windows](#on-windows). The add-on is reported to work on Windows.

### What it does

- It colours the area behind the conversation and the strip behind the prompt box.
- The sidebar on the left does not take your colour. The add-on gives it a fixed colour: near white (`#fcfcfb`) in a light window and near black (`#151515`) in a dark one. In a light window that is whiter than the sidebar is without the add-on.
- The text turns dark or pale to stay readable. To do that, the whole app window switches between light and dark: see the section below.
- A folder can have a colour that all its sessions follow, and a session can have a colour of its own. Where a folder has no colour, a new session starts with the settings you set most recently in such a folder. See the next sections.
- A thin row above the prompt box names the model family in use, on a colour of its own. See *The model row*, after the next section.

### Each folder and each session has its own colour

A session takes the first of these that exists:

1. **Its own colour,** if it has one.
2. **The colour of its folder,** if the folder has one.
3. **The settings you set most recently in a folder that has no folder colour,** as they are when the session starts.
4. **The light cream `f5eedc`,** until you have chosen anything.

A folder is a git repository with all its worktrees, or, outside git, the exact folder. The add-on asks the app which repository a session belongs to. A session in a subfolder of a repository was not tried in the app, so do not rely on it counting as that repository. The folder colours are saved on your computer, so they survive closing the app. What a session you open again later shows was not tried. Whether a colour of its own is still there then was not tried either.

- **A session that follows its folder** (it has no colour of its own) takes up a change of the folder colour at its next message. A new session in a folder that has a colour starts with it.
- **A session's own colour** stays whatever the folder colour becomes. The next section says how to give a session one.
- **A folder colour is a background colour only.** The colours of the model rows are the same in every session and every folder. See *The model row*.
- **There is no button or command that removes a folder colour.** To change one, press a colour and **Apply to folder** again. To make a folder show no colour, untick **Show** next to **Session color** and press **Apply to folder**. The folder then keeps a colour that is switched off, and sessions without a colour of their own show the app's own look.
- **In a folder with no folder colour,** nothing changes from before: a colour you choose is the colour new sessions start with, and **Show** and `/convo-color off` apply to new sessions too.

What **Show**, a typed colour and `off` do:

- **A typed colour, Set, and `/convo-color f5eedc`** apply at once, to this session, as its own colour, and turn the background on if it was off. In a folder with no folder colour the colour is also the one new sessions start with.
- **Unticking Show next to Session color, and `/convo-color off`,** do the same thing: the background goes off at once and the session keeps that as its own choice. In a folder that has a folder colour, that is this session only. In a folder without one, new sessions start with the background off too, until a colour is chosen.
- **Ticking Show again** draws the colour this session showed last, or the folder colour, or the latest colour, and makes it this session's own colour. Press **Reset** next to **Session color** to follow the folder again.
- **Show next to LLM bar color** and `/convo-color row off` or `row on` act at once. In a folder that has a folder colour they change this session only. In a folder without one, new sessions start with the choice. **Apply to folder** saves both **Show** boxes for the folder as they are in the session you press it in.

### Apply to session and Apply to folder

Type `/convo-color` and a picker opens above the prompt box. It holds a grid of colour swatches, and under it the buttons described here. **Session color** must be the chosen button of the two, **Session color** and **LLM bar color**. It is chosen unless you pressed **LLM bar color**.

Pressing a swatch only **previews** the colour. The window of this session shows it at once, and a line under the field says `Preview: ... Not applied yet.` Nothing is saved. You press a swatch as often as you like. Then you decide what the colour is for:

- **Apply to session** makes the previewed colour this session's own colour. No other session changes, and the folder colour does not change. If you have pressed no swatch, nothing happens and a message asks you to press one first. In a folder that has no folder colour, the colour is also the one new sessions start with.
- **Apply to folder** makes the colour the folder's colour, for every session in that folder. It also saves the two **Show** boxes as they are in this session. A swatch is not required: with no preview, it takes the colour the window shows now. A message names the folder.
  - If this session has no colour of its own, it shows the folder colour now and follows the folder from then on.
  - If this session has its own colour, it keeps it, and the message says so.
  - Other open sessions in the folder that have no colour of their own change at their next message. A new session in the folder starts with the folder colour.
- **Close** leaves the picker. If a swatch was pressed and not applied, the window goes back to the colour it had.
- **Set** next to the field marked **Hex code or name** applies a typed colour at once, to this session, as **Apply to session** does, with no preview step. Typing `/convo-color f5eedc` does the same.

**To give a whole folder a colour:**

1. Open a session in that folder. It must be a Local session, and you must have sent one message: see *Warning: send one message first*.
2. Type `/convo-color`.
3. Check that **Session color** is the chosen button, and choose **Light mode** or **Dark mode** to pick a set of swatches.
4. Press a swatch to preview it. Try several if you like.
5. Press **Apply to folder**. Every session in that folder shows the colour from now on, apart from sessions that have a colour of their own.
6. Press **Close**.

**To give only one session a colour:** follow the same steps, but press **Apply to session** in step 5.

### One session with a colour of its own in a folder that has a colour

1. In that session, type `/convo-color`.
2. Press a swatch, or type a hex code or a web colour name in the field and press **Set**.
3. If you pressed a swatch, press **Apply to session**. A typed colour is already applied.

What to expect from then on:

- The session keeps its colour when the folder colour changes later. Pressing **Apply to folder** in another session does not touch it.
- The caption under the field says `This session has its own colour` and the hex code. Without a colour of its own it says `This session follows the folder colour`.
- To bring the session back to the folder colour, press **Reset** next to **Session color**. See the next section.
- If you untick **Show** next to **Session color**, the background goes off in this session only. The folder keeps its colour. Ticking **Show** again brings back the colour this session had drawn last, or the folder colour if it had drawn none, and makes it this session's own colour. To follow the folder again, press **Reset**.
- A folder can have a colour for most sessions and still leave one session without any: untick **Show** in that session.

### What the two Resets do

The picker has two **Reset** buttons, one on the line of **Session color** and one on the line of **LLM bar color**. The second line, and its **Reset**, appear only once the app has told the add-on which model the session uses.

**Reset next to Session color** puts this session back on the usual order of colours:

- It drops a colour that was pressed and not applied.
- It removes this session's own colour, including a background that was switched off in this session, and its own choice for the model row's **Show** box.
- It then draws what the session would show if it had just started. In a folder that has a folder colour, that is the folder colour, with the folder's **Show** boxes. In a folder with no folder colour, it is the colour and the settings you set most recently, and the light cream if you never chose one.
- A message says which of the two happened.
- It never changes the folder colour, a saved colour for a model row, or any other session.

**Reset next to LLM bar color** gives the row of the model in use its own colour again:

- It drops a colour that was pressed for the row and not applied.
- It removes the colour you chose for that model family, so the row goes back to the colour in the table in *The model row*. That holds in every session and every folder, because the colours of the model rows are the same everywhere.
- It changes the row of the family in use only, and it leaves the **Show** box of the row and the colour of the window as they are.

### The model row

The model row is a thin row above the prompt box. It names the model family you are using, such as Opus, on a colour of its own, so you see at a glance which model answers. It shows the family only, not the version number.

- It follows the model. When you change the model in the app, the row changes with it.
- It does not touch the conversation background. The window keeps the colour you chose, or the app's own look if you turned the colour off.
- It is on from the start.
- The text on it is dark or white, whichever reads better on its colour.

| Model family | Colour of the row |
| :-- | :-- |
| Fable | violet |
| Opus | orange |
| Sonnet | sky blue |
| Haiku | sea green |

A Claude family that is not in this table shows its own name, in one of four spare colours: yellow, lime, teal or pink. The same name always gets the same colour. A model whose name holds no Claude family shows `Other model` on grey.

**To turn the row off or on:** type `/convo-color row off` or `/convo-color row on`, or tick or untick **Show** next to **LLM bar color** in the picker. In a folder that has a folder colour, the switch is this session's own choice and the folder keeps its setting. **Reset** next to **Session color** gives the folder's setting back. Elsewhere the choice is kept and new sessions start with it. `/convo-color off` does not turn the row off, because it turns off only the background colour.

**To change the colour of a family's row:**

1. Switch to a model of that family, so the row shows its name. The picker changes the row of the model in use only.
2. Type `/convo-color` to open the picker. The row stands under it, so you see each change on it.
3. Press **LLM bar color**. The colours and the field now set the colour of that row, such as the Opus row.
4. Press **Light mode** or **Dark mode** to choose a set. Press a colour to preview it on the row, then press **Apply**. Or type a hex code or a web colour name in the field and press **Set**. A message names the colour. If the row is off, **Apply** turns it on. **Close** without **Apply** drops the preview.
5. Press **Reset**, on the line of **LLM bar color**, to give the row its own colour again.
6. Press **Session color** to set the window colour again.

- A colour you choose for a family holds for that family in every session, and it is saved on your computer, so it survives closing the app.
- Any colour is accepted for a row. The text on it is dark or white, whichever reads better. If even that reaches less than 4.5 to 1, the message after the press says the text is hard to read and the colour is applied all the same.
- While an update waits, the update row stands where the model row stands, and the model row is hidden until you deal with it.
- Typing `/convo-color f5eedc` or any other colour after the command sets the background colour only, never a row.

### When the whole window switches between light and dark

The add-on can only make the text readable by drawing the app in its light look or its dark look, and the app applies that to the whole window, sidebar included. So the add-on picks the look that suits the colour you chose. The app's own light, dark or system setting does not decide it.

- A colour that looks brighter than a mid grey gets a light window, with dark text.
- A deeper colour gets a dark window, with pale text.
- The switching point is a relative luminance of 0.17, the standard measure of how bright a colour looks. For a plain grey that is `#737373`: lighter greys give a light window and darker greys give a dark window.
- It follows brightness, not how dark the colour's name sounds. Bright greens, yellows, cyans, oranges and most reds count as light.

| Colour | Window you get |
| :-- | :-- |
| Yellow `ffff00`, green `00ff00`, cyan `00ffff`, orange `ffa500` | light, dark text |
| Red `ff0000`, tomato `ff6347`, steel blue `4682b4`, sea green `2e8b57` | light, dark text |
| Grey `808080`, pink `ffb6c1`, beige `f5eedc` | light, dark text |
| Dark green `008000`, purple `800080`, blue `0000ff`, navy `000080` | dark, pale text |

Right at the switching point neither text colour is easy to read: the contrast is 4.1 to 1, below the 4.5 to 1 that counts as readable. For greys between `#6d6d6d` and `#797979` the add-on applies the colour and warns you. Any other colour reads well.

### Before you start

- Use the Claude desktop app and open the Code tab.
- Start a Local session. Under the prompt box, click the first button on the left, the one with a small computer icon and a name. In the menu that opens, choose This computer or any folder name under the heading Local. Do this before you send your first message. A Cloud or SSH session runs on another machine, so it does not load an add-on installed on your computer.
- Update the app first. The colour needs the Claude Code inside the app to be version 2.1.323 or later. To check, type `/status` in a Local session in the Code tab and read the row **Claude Code**. The add-on was built and tried on desktop app 5.11492.5 with Claude Code 2.1.325, on a Mac. An older version may not support add-ons.
- Update the Claude Code in your Terminal as well. It is a second copy, separate from the one inside the app. The install line needs Claude Code 2.1.292 or later. Type `claude --version` to check and `claude update` to update it.
- It sets the session's one colour theme, so it replaces the look of any other theme add-on you have.
- If your app is set to dark and you pick a pale colour, the window switches to light. That is on purpose: see the section above.

### Install it

The desktop app has no menu for adding an add-on from a GitHub page, so you install it once from the Terminal app. The desktop app reads the same settings, so the add-on then works in its Code tab.

1. Open the Terminal app. Press Command and Space, type Terminal and press Enter.
2. Paste the line below and press Enter.

```
claude plugin install convo-color --marketplace paul-van-cotthem/claude-convo-color
```

It should end with `Successfully installed plugin: convo-color@convo-color (scope: user)`. If Terminal says `command not found`, the Claude Code command is not set up on your computer.

If Terminal says `error: unknown option '--marketplace'`, the Claude Code in your Terminal is too old. Update it, then paste the install line again:

```
claude update
```

Check with `claude --version` that it now shows 2.1.292 or later. If it still shows the old version, your Claude Code was installed another way and `claude update` cannot reach it. Install the current one by following Anthropic's own setup page, https://code.claude.com/docs/en/setup, open a new Terminal window and paste the install line again.

Claude Code normally updates itself in the background, but a setting called `DISABLE_AUTOUPDATER` turns that off, and it can be set in your environment. It does not stop `claude update`. To see whether it is on, type `claude doctor` and look for the line `Auto-updates`.

Then open a new Local session in the desktop app's Code tab, send any short message such as `hi`, and then type `/convo-color`.

### Warning: send one message first

> [!WARNING]
> The command is not available in a brand-new session. Send any short message first, for example `hi`, and let the answer start. Only then does `/convo-color` work, and only then do the colour from last time and the model row appear.

The reason is that the app starts the engine behind a session only when you send the first message, and the add-on loads with that engine. Before that the add-on has not run, so the app does not know the command yet.

If you type `/convo-color` as your very first message, Claude may answer that the command "isn't installed in this session". Send any other message first, wait for the answer, and try again. If it still says so, type `claude plugin list` in Terminal: the list must show `convo-color@convo-color` with `Status: enabled`. If it is missing, run the install line again, then open a new session. Also check that the session is a Local one, see Before you start.

What you can type is listed in *Use it*, further up.

### Updates

- When the app attaches to a session, and again each time you send a prompt, the add-on reads one public file on GitHub, the version number of the newest release. It stops after the first answer, or after three tries if none comes. Each try can hold things up for at most 4 seconds, and a slower answer still counts when it arrives.
- The request sends nothing about you or your work. Like any web request, it shows your internet address to GitHub. There is no setting to turn the check off.
- If a newer version exists, a row above the prompt box says so, with the buttons **Update now** and **Not now**. Nothing is installed until you press **Update now**.
- **Update now** runs the two update commands for you. When they finish, type `/reload-plugins` to use the new version at once, or start a new session.
- If you open the colour picker while an update is waiting, the update row shows first, alone. Press **Not now** to get the picker, or **Update now**, and the picker comes back when the update has finished. The model row also gives way to the update row while the update waits.
- If your computer or network blocks the check, nothing shows and the add-on works as before. If the update cannot run from there, the row shows the two commands to paste into a terminal yourself.
- Copies older than version 0.4.0 have no check. Update them once by hand, in the Terminal app, with these two lines. After that the check works.

```
claude plugin marketplace update convo-color
claude plugin update convo-color@convo-color
```

### What it reads, sends and runs

- It draws a colour and a row above the prompt box, and adds the command `/convo-color`. It sets the session's theme, so it replaces the look of any other theme add-on.
- It reads which model the session uses, as the model's name, such as `claude-opus-5-5`, when the session starts and again each time you change the model, to draw the model row. It keeps the name only for the row and sends it nowhere.
- It does not read, keep or send what you type or what Claude answers. It hooks the moment you send a prompt only to draw the colour its folder or session should show, and to try the update check again, and ignores the text.
- It answers only its own command, `/convo-color`. It reads the words you type after the command, as a hex code, a web colour name, `off`, `update`, `row on` or `row off`, and sees no other command.
- It keeps five things on your computer: the background colour you chose most recently, whether the background colour is on or off, whether the model row is on or off, the colours you chose for the model rows, by family name, and, for each folder that has a folder colour, the path of the folder with its colour and its two **Show** settings. A new session starts with them. It reads the path of the session's folder, and of its git repository, to find that entry. None of this leaves your computer.
- The **Help** link in the picker opens this project's page on GitHub, `https://github.com/paul-van-cotthem/claude-convo-color`, in your web browser. It does so only when you click it.
- The only thing it sends over the internet is one request to `https://raw.githubusercontent.com/paul-van-cotthem/claude-convo-color/main/.claude-plugin/plugin.json`, once per try, at most three tries per session, to read the newest version number. Typing `/convo-color update` sends one more such request each time. GitHub sees your internet address and nothing else.
- It starts a program only when you press **Update now**. It then runs one shell, `/bin/sh`, with these fixed commands: `claude plugin marketplace update convo-color` and `claude plugin update convo-color@convo-color`. The shell is there only to add the usual folders where Claude Code lives (`~/.local/bin`, `/opt/homebrew/bin`, `/usr/local/bin`) to its search path, because the desktop app's own path may lack them.
- The code is in `hooks/register.tsx` and the tests are in the `tests` folder, in five files: `folder.test.tsx`, `names.test.tsx`, `row.test.tsx`, `settings.test.tsx` and `update.test.tsx`.

### Good to know

- The add-on has been tried on other computers than the one it was built on, but not on every setup. If a step does not match what you see, please report it: see the next point.
- To report a problem or ask a question, open an issue on the project's page on GitHub: `https://github.com/paul-van-cotthem/claude-convo-color/issues`. You need a free GitHub account for that.
- To remove the add-on, type `claude plugin uninstall convo-color@convo-color` in a terminal, then open a new session. Claude Code still remembers where the add-on came from. To remove that too, type `claude plugin marketplace remove convo-color`.

### Installing from inside a session

If you are already inside a Claude Code terminal session, you can type this at its prompt instead of using the Terminal app:

```
/plugin install convo-color --marketplace paul-van-cotthem/claude-convo-color
```

## On Windows

> [!NOTE]
> On Windows the add-on is reported to work. One person, on Windows 11, reports that it only works when Transparency effects is turned on in Windows: see the first point below. The other points follow Anthropic's documentation, not a test. If a step does not match what you see, open an issue on the project's page on GitHub: `https://github.com/paul-van-cotthem/claude-convo-color/issues`.

The steps on this page are written for a Mac. On Windows, follow the same steps with these differences:

- Turn on Transparency effects in Windows. Without it the add-on does not work, according to one person who tried it on Windows 11. Open Settings, choose Personalization, then Colors, and switch on Transparency effects.
- Wherever this page says terminal, Terminal or the Terminal app, use PowerShell. To open it, press the Windows key, type PowerShell and press Enter.
- Where this page says Command and N for a new session, press Ctrl and N.
- Claude Code must be installed on Windows itself, not only inside WSL, the Linux environment in Windows. The desktop app does not load add-ons in a WSL session, so in the menu under the prompt box do not choose an entry under the heading WSL. Anthropic's setup page has the install line for PowerShell: https://code.claude.com/docs/en/setup
- If typing `claude --version` in PowerShell opens the Claude desktop app window instead of printing a version number, an older desktop app has taken over the name `claude`. The Claude Code you type in PowerShell is a separate program from the Code tab inside the desktop app. Update the desktop app and try again.
- Where a Mac says `command not found`, PowerShell says that `claude` `is not recognized`. It means the same: Claude Code is not set up on Windows. If it is installed all the same, its folder is not on your search path. Anthropic's page https://code.claude.com/docs/en/troubleshoot-install shows how to add it. Then open a new PowerShell window.
- The model row has not been tried on Windows.
- The button **Update now** is not expected to work on Windows in this version, because it starts a program that Windows does not have. The row then shows the two update commands to paste into PowerShell.

## Licence

convo-color is shared under the MIT licence: see [LICENSE](LICENSE). Its icon is drawn from the palette icon of Lucide, which is under the ISC licence, and the colours of the picker are the default colours of Tailwind CSS, which is under the MIT licence: see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
