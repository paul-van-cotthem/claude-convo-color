# Changelog

What changed in each version of convo-color, newest first.

## [0.7.0] - 2026-11-17

If you have version 0.6.1, the buttons of the picker work differently after this update: a press on a colour now only previews it. This is listed under Changed.

### Added

- **A colour for each folder.** With **Session color** chosen in the picker, press a colour, then **Apply to folder**. Every session in that folder then shows it. A new session in the folder starts with it, and a session that follows the folder takes up a change at its next message. A folder is a git repository with all its worktrees, or, outside git, the exact folder. A message names the folder.
- **A colour for one session.** **Apply to session**, a colour typed in the field and `/convo-color f5eedc` give the session a colour of its own, which it keeps whatever the folder colour becomes. **Reset** next to **Session color** makes the session follow its folder again.
- A line under the field names the previewed colour, or says whether the session follows the folder, has its own colour or has its background off.
- The folder colours are saved on your computer. The README says so under what it reads, sends and runs.

### Changed

- **A press on a colour only previews it** in this session. **Apply to session** or **Apply to folder** keeps it. **Close** without applying puts back the colour the session had. With **LLM bar color** chosen there is one button, **Apply**.
- **The two buttons are renamed.** **Background** is now **Session color** and **LLM model** is now **LLM bar color**.
- The **Show** tick boxes act at once and are the session's own choice. Where a folder has a folder colour, they and `/convo-color off` change this session only. In a folder with no folder colour they work as before: the choice is kept for new sessions.
- A colour typed in the field applies at once, to this session.
- **Reset** next to **Session color** now drops a preview and makes the session follow its folder. It no longer brings back the colour the window had when the picker opened.
- **Apply to folder** never changes the colours of the model rows, which stay the same in every folder.
- **Close** stands at the right edge of the colours when the conversation is wide enough for them to stand beside the controls, and in the line of the Apply buttons otherwise.
- The link under the colours reads **Help** instead of **Convo Color Help**. It is still a plain link and opens the same page. The bottom line reads the version, **Help**, **Close**.
- The picker has a line under the field and an Apply row, so it is a little taller than in 0.6.1. It is no wider.

### Not changed

- The outlines of the app's own buttons and of the text field are still faint. The app draws them and the add-on cannot change them. The colour patches stay 22 pixels tall and 18 wide, as in 0.6.1.

There is no button or command that removes a folder colour. To change one, apply another colour. To have none, untick **Show** next to **Session color** and press **Apply to folder**.

## [0.6.1] - 2026-11-17

If you have version 0.5.2, three things work differently after this update: the colour names you can type, the Off button, and what a new session starts with. They are listed under Changed and Removed.

### Added

- A model row above the prompt box. It names the model family in use, Fable, Opus, Sonnet or Haiku, on a colour of its own, and follows the model when you change it. It does not change the conversation background.
- A Claude family that is not one of those four shows its own name in a spare colour. A model with no Claude family in its name shows `Other model` on grey.
- `/convo-color row off` and `/convo-color row on` turn the model row off and on. The picker has the same switch, the tick box **Show** next to **LLM model**.
- The picker colours the row too. The buttons **Background** and **LLM model** choose what the colours and the field set, each with its own **Show** and **Reset**. The row of the model in use is the one that changes, and each family keeps its own colour. **Reset** brings back the colour the window had when the picker opened, or the family's own colour for the row.
- **Light mode** and **Dark mode** buttons switch the colours between a light set and a dark set. The picker opens on the set of the colour you are editing.
- **Set**, next to the text field, does what Enter does.
- The add-on now reads which model the session uses, to draw the model row. The README says so under what it reads, sends and runs.

### Changed

- The picker's colours are now the Tailwind CSS palette, 17 colours wide from Red to Rose. The light set is shades 50 to 400 with a line of beiges under it. The dark set is shades 700 to 950 with a line of greys under it. A colour in the light set always gives a light window and one in the dark set always gives a dark window.
- The picker is one wide panel, with the controls on the left and the colours on the right. The text field reads **Hex code or name**, and the link to the project page reads **Convo Color Help**.
- **Typed colours are hex codes and standard web colour names only.** The names the picker used before, such as `sage` or `deep teal`, no longer work when typed. A colour saved as a hex code keeps working, and so do names like `light pink`.
- **A new session starts with the settings from the most recent time you set them, in any session.** That covers the background colour, both **Show** switches, `/convo-color off`, `/convo-color row on` and `off`, and each family's row colour. Before, `/convo-color off` applied to one session only. Now, after `/convo-color off` in any session, every new session starts without the colour until you tick **Show** next to **Background** or choose a colour.
- The grid names in the message after a click are labels, such as `Red 400`. They cannot be typed.

### Removed

- The **Off** button. Unticking **Show** next to **Background** does the same, and `/convo-color off` still works.

## [0.5.2] - 2026-11-15

### Changed

- When an update cannot run from the app, the message now says to use a terminal, and names PowerShell for Windows.

## [0.5.1] - 2026-11-15

### Added

- The picker shows the installed version, small, in its bottom right corner.

## [0.5.0] - 2026-11-15

If the update does not arrive by itself, remove the add-on and install it again with the line in the README.

### Added

- The picker has 84 colours, up from sixteen. They are sorted by hex code, from white down to black.
- A text field in the picker for any other colour. Type six hex digits, with or without a `#`, or a colour name, and press Enter.
- A **Help** link in the picker opens the project's page on GitHub.
- The colour names the picker uses can also be typed after `/convo-color`, such as `sage` or `deep teal`. Five of them, pink, beige, navy, plum and brown, give the web colour of that name.
- The README shows the picker in a light window and in a dark one.
- The README says that the project is independent of Anthropic, where to report a problem, and under which licence it is shared.

### Changed

- You click the colour itself. Before, only the name beside a colour could be clicked.
- The picker stays open after a click, so you can try several colours. **Close** closes it.
- The colours are one list. They are no longer split into a group for a light window and one for a dark window.
- **Off** is one button, the first in the picker.
- The licence notice for the icon is in its own file, `THIRD-PARTY-NOTICES.md`.

## [0.4.9] - 2026-11-14

### Added

- An icon, the MIT licence and the author's name.
- A README section on what the add-on reads, sends and runs.

### Changed

- The version number is written in the code, and the call that sets the theme is written out in full.

## [0.4.8] - 2026-11-14

### Added

- First public version. `/convo-color` sets the colour behind the conversation: a hex code, a colour name, a picker of sixteen colours, or `off`.
- A check for a newer version on GitHub. A row above the prompt box offers **Update now** and **Not now**.
- The README with the install instructions.
