# IDRAREN

Static site for IDRAREN — handwoven Moroccan rugs.

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Homepage served at the domain root (copy of `Home.dc.html`) |
| `*.dc.html` | The 14 site pages |
| `idraren.js` | Shared helpers — wishlist, newsletter, header utilities, back-to-top |
| `support.js` | Runtime shell |
| `images/` | Site imagery (rug cutouts, gallery shots, editorial photography) |
| `idraren-hero.mp4` | Homepage hero video |

React and Babel load from the unpkg CDN; fonts from Google Fonts. No build step —
the files deploy as-is.

## Deploying

Upload the contents of this repository to the web root on Hostinger.
