# Sustainable Backyards 2026 — Host Registration App

A multi-step web application for property owners to register their properties for **Sustainable Backyards 2026**, an open day event run by [Sustainable Taranaki](https://www.sustainabletaranaki.org.nz/) in New Zealand. Participants showcase sustainable gardening, permaculture, builds, farms, and lifestyle blocks to the public through guided trails.

---

## Features

- **11-step guided registration form** tailored to different property types
- **Property type support**: Backyards, Community Gardens, School Gardens, Builds, Farms, and Lifestyle Blocks
- **Photo uploads** to Google Drive (per-property folder, up to 4 MB per image)
- **AI-assisted text editing** powered by Claude (Anthropic) to help hosts polish their descriptions
- **Draft auto-save** so hosts can resume their registration at any time
- **Edit existing submissions** via email lookup
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
| Styling | Tailwind CSS 4 |
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
│   ├── components/           # Reusable UI components
│   │   ├── CharCounter.tsx
│   │   ├── FieldError.tsx
│   │   ├── FormNavigation.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── TimeSlotGrid.tsx
│   │   └── VoiceInput.tsx
│   ├── pages/                # Top-level page components
│   │   ├── LandingPage.tsx
│   │   ├── FormPage.tsx      # Multi-step form controller
│   │   ├── SuccessPage.tsx
│   │   ├── ChecklistPage.tsx
│   │   ├── FeedbackPage.tsx
│   │   ├── DocumentsPage.tsx
│   │   ├── EditRegistrationPage.tsx
│   │   └── steps/            # Individual form steps (1–11)
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
│   │   └── form.ts           # TypeScript interfaces for form data
│   ├── utils/
│   │   ├── storage.ts        # LocalStorage draft/submission management
│   │   └── validation.ts     # Form validation helpers
│   ├── App.tsx               # Router configuration
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles & Tailwind theme
├── netlify/
│   └── functions/            # Serverless API functions
│       ├── submit-host-form.ts       # New registration → Google Sheets
│       ├── update-host-submission.ts # Update existing registration
│       ├── tidy-field.ts             # AI text polishing (Claude API)
│       ├── host-media-upload.ts      # Photo upload → Google Drive
│       └── submit-feedback.ts        # Feedback → Google Sheets
├── public/
│   └── favicon.svg
├── index.html
├── netlify.toml              # Netlify build & routing config
├── vite.config.ts
├── tsconfig.json
└── package.json
```

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

The app is designed to deploy on **Netlify**:

1. Connect your GitHub repository to Netlify.
2. Netlify will auto-detect the build settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
3. Add the required environment variables in your Netlify site settings.
4. Deploy — Netlify handles both the static frontend and serverless functions.

---

## Registration Form Flow

The form adapts its steps based on the selected property type:

| Step | Backyard | Build / Farm / Lifestyle |
|------|----------|--------------------------|
| 1 | Email | Email |
| 2 | Contact details | Contact details |
| 3 | Address | Address |
| 4 | Property type | Property type |
| 5 | Property details | Property details |
| 6 | Open hours / time slots | Tour details |
| 7 | Sustainability features | Sustainability features |
| 8 | What makes it unique | What makes it unique |
| 9 | Visitor facilities | Visitor facilities |
| 10 | Activities & workshops | Activities & workshops |
| 11 | Review & submit | Review & submit |

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

## Design

The UI uses a green nature-inspired colour palette matching the Sustainable Taranaki brand:

| Token | Hex | Use |
|---|---|---|
| Primary | `#2D6A4F` | Buttons, headings |
| Primary Light | `#52B788` | Hover states, accents |
| Primary Dark | `#1B4332` | Dark variants |
| Secondary | `#B7E4C7` | Backgrounds, badges |
| Accent | `#D4A373` | Highlights |

---

## License

This project is proprietary software developed for Sustainable Taranaki. All rights reserved.
