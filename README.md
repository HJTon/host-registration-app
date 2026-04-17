# Taranaki Sustainable Trails 2026 — Host Registration App

A multi-step web application for property owners to register their properties for the **Taranaki Sustainable Trails 2026** programme, run by [Sustainable Taranaki](https://www.sustainabletaranaki.org.nz/) in New Zealand. Participants showcase sustainable gardening, permaculture, builds, farms, and lifestyle blocks to the public through three guided trails:

- **Backyards Trail** — 30 October – 8 November 2026
- **Builds, Lifestyle & Farms Trail** — 9 – 15 November 2026

---

## Features

- **11-step guided registration form** tailored to different property types
- **Property type support**: Backyards, Community Gardens, School Gardens, Builds, Farms, and Lifestyle Blocks
- **Category-coloured journey** — the trail category selected on step 4 (Backyards, Builds, or Farms) tints progress indicators, status chips, and the success screen through the rest of the flow
- **Photo uploads** to Google Drive (per-property folder, up to 4 MB per image)
- **AI-assisted text editing** powered by Claude (Anthropic) to help hosts polish their descriptions
- **Draft auto-save** so hosts can resume their registration at any time
- **Edit existing submissions** from the same device
- **Time slot availability grid** for selecting open day hours
- **Pre-registration checklist** and documentation guides
- **Feedback collection** from participating hosts
- Submissions stored in **Google Sheets** (separate tabs per property type)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7 |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 4 (with Trails design tokens) |
| Fonts | Self-hosted Barlow Condensed + Inter via `@fontsource` |
| Build Tool | Vite 7 |
| Backend | Netlify Functions (Node.js, serverless) |
| Storage | Google Sheets (registrations), Google Drive (photos) |
| AI | Anthropic Claude API (`claude-haiku-4-5`) |
| Hosting | Netlify |

---

## Project Structure

```
host-registration-app/
├── src/
│   ├── components/
│   │   ├── ui/                 # Trails design-system primitives
│   │   │   ├── Btn.tsx         # Pill buttons — 5 variants × 3 sizes
│   │   │   ├── Card.tsx        # Paper card — standard + hero
│   │   │   ├── Divider.tsx     # Section label + hairline rule
│   │   │   ├── Field.tsx       # Field wrapper + Input + Textarea
│   │   │   ├── CategoryChip.tsx  # Category pill (backyards/builds/farms)
│   │   │   ├── ProgressBar.tsx   # Animated 6 px progress bar
│   │   │   ├── BrandHeader.tsx   # Trails wordmark lockup
│   │   │   └── index.ts
│   │   ├── CharCounter.tsx
│   │   ├── FieldError.tsx
│   │   ├── FormNavigation.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── TimeSlotGrid.tsx
│   │   └── VoiceInput.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── FormPage.tsx
│   │   ├── SuccessPage.tsx
│   │   ├── ChecklistPage.tsx
│   │   ├── FeedbackPage.tsx
│   │   ├── DocumentsPage.tsx
│   │   ├── EditRegistrationPage.tsx
│   │   └── steps/              # Individual form steps (1–11)
│   │       ├── StepEmail.tsx
│   │       ├── StepContact.tsx
│   │       ├── StepAddress.tsx
│   │       ├── StepPropertyType.tsx
│   │       ├── StepPropertyDetails.tsx
│   │       ├── StepHours.tsx
│   │       ├── StepFeatures.tsx
│   │       ├── StepUnique.tsx
│   │       ├── StepFacilities.tsx
│   │       ├── StepActivities.tsx
│   │       └── StepReview.tsx
│   ├── types/
│   │   └── form.ts             # FormData + property-category helpers
│   ├── utils/
│   │   ├── category.ts         # propertyType → Trails category theme
│   │   ├── storage.ts          # LocalStorage draft/submission management
│   │   └── validation.ts       # Form validation helpers
│   ├── App.tsx                 # Router configuration
│   ├── main.tsx                # Application entry point
│   └── index.css               # Design tokens + Tailwind theme + fonts
├── netlify/
│   └── functions/
│       ├── submit-host-form.ts
│       ├── update-host-submission.ts
│       ├── tidy-field.ts
│       ├── host-media-upload.ts
│       └── submit-feedback.ts
├── public/
│   ├── brand/                  # Trails wordmark + Sustainable Taranaki logo
│   └── favicon.svg
├── index.html
├── netlify.toml
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Design System

The UI implements the **Taranaki Sustainable Trails** visual identity — bright + deep greens, warm creams, Barlow Condensed display type, and selective te reo Māori framing. All tokens live in [`src/index.css`](src/index.css) and are exposed as Tailwind v4 utilities via `@theme`.

### Colour tokens

| Token | Hex | Role |
|---|---|---|
| `brand-green` | `#65B32E` | Primary buttons, active states |
| `brand-green-deep` | `#1F6B2E` | Display headings, wordmark |
| `brand-green-soft` | `#E9F3DC` | Selected/chip backgrounds |
| `brand-green-ink` | `#12351C` | Ultra-dark text |
| `cream` | `#F5EFD9` | Page headers, feature tiles |
| `cream-soft` | `#FAF7EE` | Page background |
| `paper` | `#FFFFFF` | Card backgrounds |
| `ink` · `ink-soft` · `ink-muted` | `#1C2A1A` · `#4A564A` · `#8A958A` | Body, secondary, meta text |
| `line` | `#E7E2D2` | Borders, dividers |
| `danger` | `#B43838` | Errors, destructive actions |

### Category accents

Three per-trail accents drive category chips, selected cards, progress bars, and the success screen:

| Category | Accent | Soft tint |
|---|---|---|
| Backyards | `#4C9A2A` | `#DCEED0` |
| Builds | `#B64A2A` | `#F3D9CC` |
| Farms | `#C98A1D` | `#F5E6C9` |

Lifestyle blocks are grouped with Farms per the 2026 brand guide. The mapping lives in [`src/utils/category.ts`](src/utils/category.ts).

### Type

- **Display**: Barlow Condensed 700, uppercase, `letter-spacing: 0.01em` — headings, stats, wordmark
- **Body**: Inter Variable (400–700)
- **Mono**: system mono — used for dates, codes, timestamps

Both fonts are **self-hosted** via `@fontsource-variable/inter` and `@fontsource/barlow-condensed`, imported at the top of `src/index.css`.

### Shape

- Card radius `14 px`, hero radius `22 px`, buttons/chips are fully pilled (`999 px`)
- Soft Trails shadow: `0 1px 2px rgba(28,42,26,.04), 0 6px 18px rgba(28,42,26,.06)`
- Spacing scale: 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 32 · 40

### Te reo Māori framing

Used selectively (not bilingually), matching the sustainabletrails.org.nz site. Section labels use a middle dot pattern — `<Māori> · <English>`. E.g. *Ātea · Features*, *Mahi · Today's plan*, *Tirohanga · Review*, *Kōrero · Your voice*. Macrons are preserved (ā, ē, ī, ō, ū).

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A [Netlify](https://www.netlify.com/) account (for deployment)
- A Google Cloud project with Sheets and Drive APIs enabled
- An [Anthropic API key](https://console.anthropic.com/) (for AI text tidying)

### Installation

```bash
git clone https://github.com/HJTon/host-registration-app.git
cd host-registration-app
npm install
```

### Environment Variables

Create a `.env` file in the project root (never commit this):

```env
# Google Service Account credentials (JSON stringified)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# Google Sheets spreadsheet ID (from the sheet URL)
HOST_FORM_SPREADSHEET_ID=your_spreadsheet_id

# Google Drive folder ID for photo uploads
HOST_PHOTOS_DRIVE_FOLDER_ID=your_drive_folder_id

# Anthropic API key for AI text tidying
ANTHROPIC_API_KEY=sk-ant-...
```

> On Netlify, set these as **Environment Variables** in your site settings rather than a `.env` file.

### Running Locally

```bash
npm run dev
```

Starts the Vite dev server at `http://localhost:5173`.

> **Note:** Netlify Functions require the [Netlify CLI](https://docs.netlify.com/cli/get-started/) to run locally alongside the frontend. Install it with `npm install -g netlify-cli` and then use `netlify dev` instead of `npm run dev`.

### Building for Production

```bash
npm run build
```

Outputs the compiled app to `dist/`.

---

## Deployment

The app deploys on **Netlify**:

1. Connect your GitHub repository to Netlify.
2. Netlify auto-detects the build settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
3. Add the required environment variables in your Netlify site settings.
4. Push to `main` — Netlify rebuilds and redeploys both the static frontend and serverless functions.

---

## Registration Form Flow

The form adapts its steps based on the selected property type. Each step carries a te reo eyebrow phrase:

| Step | Eyebrow | Backyard | Build / Farm / Lifestyle |
|------|---------|----------|--------------------------|
| 1 | Īmēra | Email | Email |
| 2 | Taku whare | Contact details | Contact details |
| 3 | Wāhi | Address | Address |
| 4 | Momo whare | Property type | Property type |
| 5 | Taipitopito | Property details | Property details |
| 6 | Ātea | Sustainability features | Sustainability features |
| 7 | Rā | Open hours / time slots | Tour dates & times |
| 8 | Kōrero | What makes it unique | What makes it unique |
| 9 | Haereere | Visitor facilities | Visitor facilities |
| 10 | Mahi | Activities & workshops | Activities & workshops |
| 11 | Tirohanga | Review & submit | Review & submit |

From step 4 onwards the progress indicator, status chip, and success screen are tinted with the chosen category's accent colour.

At Step 11, hosts can use the **AI text tidy** button on their descriptions to polish grammar and flow while keeping their own voice.

---

## Google Sheets Structure

Submissions are appended to tabs in a single Google Sheets spreadsheet:

| Tab Name | Property Types |
|---|---|
| Backyards | Backyard |
| Community Gardens | Community Garden |
| School Gardens | School Garden |
| Builds | Build |
| Farms | Farm |
| Lifestyle Blocks | Lifestyle Block |

The `update-host-submission` function locates an existing row by `submissionId` and replaces it in-place, preserving the original submission timestamp.

---

## Brand Assets

- [`public/brand/trails-logo-2026.jpg`](public/brand/trails-logo-2026.jpg) — 2026 Trails wordmark
- [`public/brand/sustainable-taranaki-logo.jpg`](public/brand/sustainable-taranaki-logo.jpg) — parent trust logo (footer)

> Both are JPEG fallbacks pulled from the live Squarespace site. Replace with higher-resolution SVGs when the Trails team supplies them.

---

## License

This project is proprietary software developed for Sustainable Taranaki. All rights reserved.
