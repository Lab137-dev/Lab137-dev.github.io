# Audio redesign

Crumb uses a shared harmonic voice with a rounded low-pass throat, breath texture,
soft attacks, uneven syllable pulses, and small pitch/timing changes. Emotional
phrases share this timbre. Actions use a reusable noise buffer and short impacts;
reward and achievement melodies share a motif with different endings. No samples,
network requests, third-party runtime, or continuous audio sources are needed.

Voice, action, and reward buses feed a master compressor. Reward stingers briefly
lower action volume. Sources disconnect after finishing; a 36-source ceiling,
voice cooldown, sparse idle calls, and distance-based footsteps limit work.

Sound remains opt-in, preserving the existing preference key. Both controls reflect
the same state. Muting stops scheduled sources and zeros the master. Backgrounding
also stops sources and suspends the context; a subsequent pointer or keyboard
gesture resumes it. Interrupted contexts are handled as described in
[MDN's context state documentation](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state).
Effects use actual game state/events rather than translated message text. Reaction
inputs and discovery rules are unchanged; no hidden inputs are shown in the UI.

## Verification

Run `node tests/audio.browser.cjs` with Playwright installed (or set
`CRUMB_PLAYWRIGHT` to its module path). Set `CRUMB_BROWSER` to a Chromium executable
if Chrome is not at the default Windows location.

Verified in installed Chrome with desktop 1280×800, touch phone 390×844, and touch
tablet 820×1180 viewports: game startup, emotional states, action/stinger scheduling,
mute, settings synchronization, persistence, context reuse, suspension and gesture
resume. No page errors. Native offline rendering of overlapping voice and stinger
produced finite, non-silent, varied output with peak below 0.24; muting before
render produced exact silence. JavaScript syntax and diff whitespace checks pass.

The existing `behaviors.test.cjs` suite is already incompatible with the current
HTML: it executes the first inline script (the startup error handler), so all 18
tests fail with `giveWord is not defined`. It was left unchanged. Browser checks
exercise the current game scripts, including their audio integration.

## Remaining listening checks

Physical iPhone/iPad Safari and Android hardware were not available. Check speaker
clarity and headphones, background/lock/phone-call recovery, and repeated mute
toggles there before public release. Viewport emulation does not validate Safari
or physical audio output. A human listening pass should tune the growl and crying
phrases, and confirm relative loudness during longer play sessions. Lightweight
recorded rustles may be worth comparing later; this pass adds no asset downloads.

## Longer voice revision

Vocal phrases now last roughly 0.7–1.8 seconds, with sustained vowels, gentle pitch quivers, changing throat brightness, and softer attacks. Scared calls retain a quick onset followed by a longer whimper. Repeating the same emotion waits until the previous phrase finishes. The reusable breath buffer loops only until the scheduled source stop. Action and reward durations are unchanged.

## Reward-save follow-up

Reward choices and placements now receive a separate backup after a verified write. A missing or unreadable primary save can recover from that backup. If both saves are unreadable, they are preserved rather than silently replaced; failed writes show a warning in Rewards. Reset all progress removes the backup as well.

`node tests/rewards.browser.cjs` verifies the extracted file URL across a full Chrome restart, recovery from a missing/corrupted primary save, visible write-failure warnings, and preservation of unreadable data. These checks passed. The reported loss of existing reward choices has not been reproduced; the backup cannot reconstruct choices already lost before it existed.

## Scurrying footsteps

Walking now produces quiet alternating tink taps with a faint inharmonic ring and soft contact texture. One tap per 18 pixels of travel makes slow wandering about 2.7 taps per second and running proportionately faster. Stationary frames and large relocations reset stride accumulation. Footsteps use the action bus, existing source ceiling, mute cancellation, and reward ducking.


Eating now schedules six short, rounded num syllables with a closing nasal-like filter envelope, in approximately 1.7 seconds. Browser checks verify all six are scheduled during the actual eating phase. Social visits use the existing voice and shared mix. `node tests/social-colors.browser.cjs` covers eating, social discovery and persistence, four colored/wearing visitors, arrival/departure and interruptions, 249/250-word color gating, persistent color choice, trophy descriptions, and reduced motion across desktop/phone/tablet viewports. Reward and nest recovery regression checks also pass.

## Lantern village

The village arrival uses a gentle five-note layered welcome phrase. Concerts use a short four-note bell pattern with soft percussion; picnics reuse the six-syllable num voice. These cues share the existing buses, source cap and mute cancellation, with no downloaded samples or continuous music. Village sound controls mirror the room preference. Browser checks cover the new cues and suppression while muted.
