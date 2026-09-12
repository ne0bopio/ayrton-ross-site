# Ayrton L. Ross — personal site

A one-page site for Ayrton L. Ross, built to sit alongside his résumé when he
applies for risk analyst and credit risk roles.

Everything is in **`index.html`**. It is a single self-contained file: the
styles, the script and the portrait photo are all embedded, so it works by
double-clicking it, emailing it, or hosting it anywhere.

## What's on the page

| Section | What it holds |
|---|---|
| Hero | Name, positioning, contact buttons, and an interactive borrower risk scorecard |
| Exhibit A | The four numbers from his banking record |
| Exhibit B | Citi and Valley Bank, plus a quiet list of earlier work |
| Exhibit C | Selected work — the Goldman Sachs risk simulation |
| Exhibit D | Six certifications |
| Exhibit E | Education, technical skills, credentials |
| Contact | Email, phone, LinkedIn |

## The scorecard

The panel in the hero is a working borrower risk model. Four inputs (FICO,
DSCR, LTV, DTI) are scored against real underwriting breakpoints rather than a
straight line, weighted 30/30/25/15 into a composite, and mapped to a letter
grade. A DSCR below 1.00× triggers a policy override that declines the file
regardless of the composite — the score is struck through and labelled
"overridden" so the logic reads as deliberate.

To change the model, edit the breakpoint tables near the bottom of
`index.html`:

```js
var FICO=[[550,0],[620,.25],[680,.50],[740,.80],[800,1]];
var DSCR=[[0.80,0],[1.00,.20],[1.25,.45],[1.50,.70],[2.00,.95],[2.50,1]];
```

## Adding a project

Open `index.html`, find `<!-- ================= EXHIBIT C ==========`, and
copy the whole `<article class="work rise"> … </article>` block. Paste it
directly underneath, then swap the title, the source line, the date, the two
columns of prose and the tags. Spacing between entries is handled for you.

## Publishing it

The repo is private. To put it online once Ayrton has signed off:

```bash
gh repo edit --visibility public --accept-visibility-change-consequences
gh api -X POST repos/:owner/:repo/pages -f source[branch]=main -f source[path]=/
```

The site then lives at `https://<user>.github.io/ayrton-ross-site/`.

## Files

- `index.html` — the site, self-contained
- `portrait.jpg` — the source photo, already embedded in the HTML
- `Ayrton_Ross_Resume.docx` — linked from the Résumé button
