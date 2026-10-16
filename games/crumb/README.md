# Crumb

Extract the ZIP and keep **index.html** and the **assets** folder together. The offline release embeds all game scripts in index.html. Open it in Chrome; no installation, account, server, or runtime downloads are needed. When updating, close Crumb and replace index.html and assets in the same existing game folder to retain the same browser save location.

Give Crumb words and watch him react. Recognized discoveries count once toward reward milestones. Field notes record discoveries; secret reactions remain discoverable through play. The vocabulary source contains spoilers.

## Bonus tools

- **100 words — Nest Workshop:** expand the nest from 12 to 48 pieces; add nesting materials from field notes; arrange piles, rows, or rings; decorate the nest; save three named layouts. Loading a layout confirms replacement and keeps an undo copy.
- **250 words — Color Studio:** choose one of eight coat colors. Your choice is saved.
- **350 words — Playground Builder:** build an eight-piece course using tunnels, ramps, hoops, and bells. Drag pieces directly in the room using mouse or touch, with a compact toolbar above the floor. Numbered paths show the route; select a toy to move it earlier/later or remove it. Keyboard users can select a toy in the toolbar and focus the room to move it with arrow keys; Escape exits the editor. Crumb crawls into tunnels, climbs and launches from ramps, leaps through hoops, and strikes swinging bells. Wearables follow his jumps. Put the course away without losing it, or run it whenever you like.
- **400 words — Crumb Village:** visit a separate lantern-lit neighborhood with three permanent friends. Choose spool cottages, acorn cabins, or greenhouses; name neighbors, choose their coats and earned wearables, and give them gardener, tinkerer, or dancer personalities. Neighbors visit, nap, tend plants, make things, dance, and get zoomies; Crumb visits them too. Share a picnic, lead a parade, perform a tiny concert, or take turns through the hoop. Tap a home or resident, or use Make it yours, to customize without closing the village. Room returns to your original nest and playground. The village has its own sound toggle and a Relax button.

The glowing buttons beneath the word input open each tool. Locked tools show the required word count; unlocks are automatic and do not consume your normal milestone reward choice.

## Saving and recovery

The browser saves discoveries, nest pieces, reward choices, color, tool layouts, courses, and village residents locally. Keep using the same extracted file and browser. Private browsing, cleared site data, blocked storage, or moving the file can affect persistence. Reward and tool saves have backups and show warnings when writes fail. No game data is sent anywhere.

**Fresh nest** asks before clearing the nest and loose cards. **Undo fresh nest** restores the previous pile even after reopening; only one undo copy is retained. If an undo copy cannot be saved, the pile is kept. Field notes also offer **Rebuild nest from field notes**, which reconstructs one of each recorded nesting material up to the current nest capacity. Original duplicates and arrangement are not recorded there. Discoveries and rewards survive Fresh nest. **Reset all progress** in Settings clears all saves, including bonus tools and backups.

## Controls and personality

Mouse, touch, and keyboard controls work. Keyboard help is in Settings. Sound is opt-in and can be toggled in the room or Settings. Crumb has emotional vocalizations, num-num eating, tink footsteps, reward melodies, social visitors, and occasional idle dances, waves, zoomies, and reward tidying. New input interrupts idle antics and course/group games; sleeping commands are respected.

## Verification

Browser checks cover desktop, phone, and tablet viewport layouts in installed Chrome. They cover actual milestone boundaries, the full 48-piece nest and save/reopen, favorite layouts, native mouse/touch course dragging, course reordering, obstacle traversal/occlusion, bell cues and interruptions, village arrival, six resident routines, four group activities, home/personality/outfit persistence, village sound toggle, touch home selection, save-failure warnings and Godmode save isolation, color selection, social visits, idle behavior, mute, native audio rendering, reward recovery, and nest undo. Physical iPhone/iPad Safari and Android hardware listening are still recommended before public release.

With Playwright available, run the files in tests ending in .browser.cjs individually with Node. Set CRUMB_PLAYWRIGHT to the Playwright module path and CRUMB_BROWSER to your Chromium executable when necessary. The older behaviors.test.cjs harness selects the startup handler instead of the game script and needs repair; the browser suites exercise the current scripts.


Bonus tools now include illustrated previews and detailed capability lists before unlock. Once unlocked, expand **See everything this tool can do** to revisit the description above the controls. Color Studio includes an eight-coat preview. Crumb’s gaze follows recent pointer activity, his work, or his walking direction, then returns to natural idle glances. Zoomies include a short blurred motion trail and a cartoon ZOOMIES! label; reduced-motion preferences suppress the trail and label wobble.


The game now includes an additional local visual asset in assets/. Keep that folder alongside the scripts when updating. Developer test instructions are maintained separately from the player ZIP.

Nest Workshop: shape and decoration selections apply immediately. A live preview shows the actual nest; Show my nest closes the workshop to see it in the room. Tidy rows have clearer spacing. Godmode workshop edits remain temporary and restore on exit.

Nest Workshop scenery: Wildflower garden adds layered flowers, foliage, moss and subtle fireflies; Mossy stone sanctuary adds shaded stones and balanced cairns; Lantern celebration adds a tall garland and warm lanterns. Scenery sits behind playable items. Motion respects reduced-motion preferences; no extra image or sound downloads are needed.

Offline releases embed all game scripts in index.html to prevent mismatched script files during updates. Replace index.html and keep the assets folder beside it. The modular JavaScript files are needed only by the source checkout.

Share Crumb opens the device share sheet where available; its apps depend on the browser and installed apps. Elsewhere, Facebook, WhatsApp, email and copy-link options are provided. Sharing always points to the public website, including when playing a downloaded copy; no save data or local file paths are shared. The native share dialog remains under the player’s control.
