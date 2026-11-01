# Demo portfolio site

A fictional demo portfolio for a product designer called Arif Chowdhury. Every name, client, number, review and contact detail on the site is invented. It was built in plain HTML, CSS and JavaScript from a Figma design (the Figma file is the source of truth and is not part of this repo).

## How to open it

- Double click `index.html`, or
- Serve the folder with any static server, for example `npx serve .` or `python -m http.server 8080`, then open `http://localhost:8080/`.

No build step, no dependencies.

## File map

- `index.html`: the landing page (hero, about, services, process, results, work, pricing, testimonials, notes, footer, contact and case study dialogs)
- `404.html`, `privacy.html`, `terms.html`: supporting pages
- `post-1.html`, `post-2.html`, `post-3.html`: the three notes linked from the blog section
- `behance/index.html` and `behance/img/`: a Behance style gallery of the Figma project (cover and 12 slides)
- `assets/css/`: `styles.css` (base and tokens), `parity-a.css`, `parity-b.css`, `parity-c.css`, `parity-d.css` (layered fixes and the case study dialog), `pages.css` (supporting pages)
- `assets/js/`: `main.js` (nav, modals, form, reveal), `parity-b.js`, `parity-c.js`, `parity-d.js`
- `assets/img/`, `assets/icons/`: images and SVG icons
- `audits/`, `PARITY.md`: internal working notes, kept out of git (see `.gitignore`)

## Animation and interaction list

- Marquee strip (continuous loop)
- Rotating ring badges
- Orbit avatars with a floating dwell
- Hover states on buttons, cards, links and icons
- Dialogs: contact form (with sending and sent views) and case study (Hotel booking redesign, Train ticket app)
- Scroll reveal on sections
- Word by word reveal on selected headings
- Pause toggle that stops the marquee, rotation and orbit motion

## Accessibility notes

- Native `<dialog>` with labelled title and description, focus moves in, Tab is trapped, Esc closes, focus returns to the opener, scrim behind
- The case study panel scrolls inside itself and keeps a sticky header with a Close button, down to 375px wide
- `prefers-reduced-motion` turns off animations and transitions, and the pause toggle works for everyone
- Skip link, one `h1`, landmarks, visible focus ring, 44px targets on main controls (a few mobile nav links are 34px)
- `forced-colors` styles for the dialogs and cards
- Chart has a text alternative
- Checked by DOM and computed styles only. Not yet tested with a screen reader or on real touch devices.

## Publish on GitHub Pages

1. Push this folder as its own repository (branch `main`).
2. In the repository open Settings > Pages.
3. Under Build and deployment choose Deploy from a branch, branch `main`, folder `/ (root)`, then Save.

## TODO

- Replace REPLACE-WITH-PAGES-URL in index.html, 404 etc. with the live Pages URL.
- Add the Figma prototype share link in behance/index.html at the marked comment.
