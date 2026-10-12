# Crumb — word discovery

Extract the ZIP, then double-click **index.html**. Keep **words.js** beside it. No installation, server, account or network connection is needed. The original scavenger version is preserved separately in crumb-original.

Try giving Crumb words and watch its reaction. It has particular tastes: food, building materials, things to play with, things it dislikes, things that frighten it, and a few commands it understands. Its responses are physical: eating, hauling, chasing, recoiling, hiding, sitting, sleeping and more. Unknown words get a puzzled inspection rather than automatically entering the nest.

The dictionary recognizes whole words and a few short command phrases, ignoring case, extra whitespace and surrounding punctuation. This is a discoverable vocabulary, not an AI conversation system. Category definitions in words.js contain spoilers.

**Field notes** record only recognized words after Crumb actually reacts. Undiscovered words and categories are not listed. Drag settled materials or choose **Make a little mess** and Crumb attempts repairs. It stores twelve nest pieces and considers up to three offerings at once. Other scraps gradually disappear; food gets eaten. Commands bypass the queue. **Fresh nest** resets the desk but keeps discovered vocabulary. Hunger is a gentle cue; there is no death or punishment for leaving it alone.

The nest and discoveries are saved locally when browser storage is available. Some browsers restrict storage for local files; the toy still runs, but its memory may not survive closing. Moving the folder or using another browser may also create a fresh save. No content is sent anywhere.

Eighteen automated behavior tests pass, covering reaction groups, word recognition, commands, carry interruptions, fetching, bounded queues and discovery persistence. They execute the actual update code with a lightweight document stub. To run them, use `node --test tests/behaviors.test.cjs`. Node is not needed to play. Browser rendering and animation have not been visually verified in the build environment.

Original code-drawn creature and environment; no downloaded assets or dependencies. This is a standalone browser toy, not a ChatGPT pet. Existing Lab-137 projects are untouched. Browser visual verification was not available in the build environment.

Personal name triggers now support fury with nest destruction, affectionate swelling, an affectionate dance, and rolling over with wiggling feet. Personal words are deliberately omitted from field notes; they remain visible in source code. These reactions interrupt current activities safely and last about six seconds. After a tantrum Crumb may repair its scattered nest. Poptart is a normal food discovery.
