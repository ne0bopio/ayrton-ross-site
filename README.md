# Ayrton L. Ross — personal site

A one-page site for Ayrton L. Ross, a credit risk analyst candidate. It is written
as a credit memorandum on the applicant: the reader is the credit officer, and the
five sections are the five Cs of credit. Its job is to get him an interview.

## Files

| File | What it is |
|---|---|
| `index.html` | The site. Styles and the credit model are inline. |
| `surface.js` | The 3D DSCR stress surface (Three.js). Mounted twice: on the cover and in Exhibit 3. |
| `vendor/three.module.min.js` | Three.js r170, vendored so the site depends on no third-party CDN. |
| `portrait.jpg` | The headshot, 760 × 760. |
| `Ayrton_Ross_Resume.pdf` | The résumé linked from the site. Generated from `resume.html`. |
| `resume.html` | Source of the PDF. Not linked from the site; edit it and re-print. |
| `Ayrton_Ross_Resume.docx` | Ayrton's original Word résumé, kept untouched as the source of the facts. |

## What is on the page

| Section | Holds |
|---|---|
| Cover | Name, thesis, the memo summary (applicant, facility requested, market, availability, exhibits, recommendation) and the three buttons. |
| Character | Citibank and Valley Bank, earlier work in one line, standing (notary, languages, recognition). |
| Capacity | The four figures of record and the skills. |
| Capital | Education, coursework, six certifications. |
| Collateral | Three exhibits. **1** the interactive borrower scorecard. **2** an underwritten file: a hypothetical 12-unit multifamily, presented vs adjusted, with a recommendation and conditions. **3** a stress test: a 3D surface of adjusted DSCR over rate and vacancy with the 1.25× covenant plane, a loan-sizing slider that deforms it, the table linked to it, and break-evens. |
| Conditions | Target roles, geography, availability, contact. |

Exhibits 2 and 3 describe a **hypothetical borrower**. They are labelled as such on the page.
All figures in them are computed live from one set of constants, so the spread, the stress
grid and the prose numbers always agree.

## The 3D surface

`surface.js` draws adjusted DSCR as a surface: x is the rate shock (contract rate to +200 bp),
depth is vacancy (0 to 25%), height is DSCR. The translucent red plane is the 1.25× covenant;
lines below it are muted red, lines below 1.00× full red. Drag to orbit (horizontal only on
touch, so the page still scrolls), hover for a readout. The cover copy tilts with the mouse;
the Exhibit 3 copy follows the loan slider and lights up the point you hover in the table.
It renders only when something changes, pauses off-screen, and respects reduced motion (no
intro rise). If WebGL is unavailable the page adds `no-3d` to `<html>` and hides both copies;
nothing else depends on it.

The surface reads the model from `window.AYRTON`, which the inline script sets up, so it
always agrees with the table.

## Editing the numbers

Everything in Exhibits 2 and 3 comes from the `FILE` object near the bottom of `index.html`:

```js
var FILE={
  units:12,rent:1650,other:4800,
  vacP:0.03,vacA:0.07,
  taxP:38000,taxA:42500,insP:9600,insA:12000,util:14400,rep:7200,
  mgmtRate:0.05,resPerUnit:300,
  value:1800000,ltv:0.70,rate:0.0675,amort:30,covenant:1.25
};
```

Change a value and every number on the page follows. The analyst's notes in the table and
the recommendation prose are written by hand, so re-read them after a change.

The scorecard's breakpoint tables (`FICO`, `DSCR`, `LTV`, `DTI`) sit just above `FILE`.

## Regenerating the résumé PDF

`resume.html` is a letter-size page. Print it from Chrome with no headers or footers, or
from the terminal with the site served locally:

```bash
python3 -m http.server 8765 --directory . &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --no-pdf-header-footer --print-to-pdf=Ayrton_Ross_Resume.pdf http://localhost:8765/resume.html
```

## Publishing

The site is live on Vercel at **https://ayrton-ross.vercel.app** (project `ayrton-ross`, team
`ne0bopios-projects`, static, no build step). `.vercelignore` keeps the README, the `.docx` and
env files out of the deploy.

To push a change live from this folder:

```bash
vercel deploy --prod --yes
```

For a custom domain (for example `ayrtonross.com`), buy it wherever, then:

```bash
vercel domains add ayrtonross.com ayrton-ross
```

and set the DNS records the command prints. The `.vercel/` folder and `.env.local` are local
link state and stay out of git.

The GitHub repo `ne0bopio/ayrton-ross-site` is private and is the source of record; Vercel is
deployed from this folder with the CLI, not from the repo.
