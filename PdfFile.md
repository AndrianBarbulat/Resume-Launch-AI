# CV Display & Preview System — Comprehensive Reference

## Overview

The CV display page is the live preview panel shown alongside the resume builder form. It renders resume data as a styled PDF-like document with real-time updates, zoom controls, and PDF export capabilities. The system also includes a full-screen review step and a dedicated download/view pipeline via hidden DOM rendering.

---

## Architecture & File Map

```
src/
├── components/
│   ├── preview/
│   │   ├── ResumePreview.tsx          # CV display: renders all sections into a single-page layout
│   │   ├── ZoomControls.tsx           # +/- buttons and reset control for preview zoom
│   │   ├── DownloadButton.tsx         # Triggers PDF download or opens in new tab
│   │   └── PDFRenderContainer.tsx     # Hidden off-screen container for high-fidelity PDF rendering
│   └── builder/
│       ├── BuilderShell.tsx           # Layout shell: left form + right preview panel
│       └── ReviewStep.tsx             # Full-screen review before save
├── app/
│   ├── dashboard/page.tsx             # Dashboard listing user resumes
│   ├── resume/[id]/page.tsx           # View/edit a specific resume
│   └── api/
│       └── ai/pdf/                    # PDF generation API (if exists)
```

---

## 1. Page Layout & Component Structure

### Builder Shell (`BuilderShell.tsx`)

The primary CV display is a **two-panel layout**:

```
┌──────────────────────────────────────────────────────────┐
│   Left Panel (lg:w-1/2)     │   Right Panel (lg:w-1/2)   │
│   ┌──────────────────────┐  │   ┌──────────────────────┐  │
│   │  Step Progress       │  │   │  "Live Preview"      │  │
│   │  [Title][Info][...]  │  │   │  Template: modern     │  │
│   │                      │  │   │  [Zoom] [Download]   │  │
│   │  Form Card           │  │   │                      │  │
│   │  ┌────────────────┐  │  │   │  ResumePreview       │  │
│   │  │  Step Content   │  │  │   │  ┌────────────────┐  │  │
│   │  │  (inputs, etc)  │  │  │   │  │  CV Rendering  │  │  │
│   │  │                 │  │  │   │  │                │  │  │
│   │  └────────────────┘  │  │   │  └────────────────┘  │  │
│   │                      │  │   │                      │  │
│   │  [Back]  [Continue]  │  │   │                      │  │
│   └──────────────────────┘  │   └──────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Desktop:** Two columns side-by-side. Left has form steps, right has the CV preview.

**Mobile:** Single column with a toggle button at the bottom:
- "Preview" button — switches to the preview panel
- "Edit" button — switches back to the form panel
- The right panel is `hidden` when `mobileView === "form"` and vice versa
- Preview header (label + zoom + download) is hidden on mobile (`hidden lg:flex`)

**Key layout CSS:**
- Right panel: `lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto` — sticks to viewport, scrolls independently
- Background: `bg-gray-100` on the preview panel, `bg-slate-950` on the form panel
- Mobile toggle: `lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50`

---

## 2. ResumePreview Component

**File:** `src/components/preview/ResumePreview.tsx`

### Props
```typescript
interface ResumePreviewProps {
  resume: ResumeFormData;
  zoom?: number;  // Default: 1.0
}
```

### Rendering Logic

The component renders an **A4 paper simulation** inside a centered container:

```jsx
<div className="w-[210mm] bg-white text-gray-900 shadow-2xl">
  {/* Header (Personal Info) */}
  {/* Summary section */}
  {/* Experience section */}
  {/* Education section */}
  {/* Skills section */}
  {/* Projects section */}
</div>
```

**Zoom transformation:** The outer container uses CSS transform with the zoom multiplier:
```jsx
<div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
```
This allows smooth zooming from the ZoomControls without re-rendering the PDF-sized content.

### Section Rendering

Each section is conditionally rendered based on data presence:

#### Header (Personal Info)
- Full name — rendered as `<h2>` in large bold text
- Contact row: email, phone, location, LinkedIn, website — rendered as inline links/items
- LinkedIn and website are rendered as `<a>` tags (only if non-empty)
- Email shows as a mailto link

#### Summary
- Rendered only if `resume.summary` is non-empty
- Section heading: "Professional Summary"
- Body: paragraph with `whitespace-pre-line` for newline preservation

#### Experience
- Section heading: "Experience"
- Each entry card:
  - **Header row:** role + company (e.g., "Senior Engineer at Acme Corp")
  - **Date range:** "Jan 2020 — Present" or "Jan 2020 — Dec 2022"
  - **Description:** rendered if `entry.description` exists, as a paragraph with `whitespace-pre-line`
  - **Bullets:** rendered as `<ul><li>` list, each bullet as a `<li>` with `whitespace-pre-line`
- Date formatting: parses YYYY-MM strings and formats as "MMM YYYY" (e.g., "2020-01" → "Jan 2020")

#### Education
- Section heading: "Education"
- Each entry card:
  - **Institution name** as bold heading
  - **Degree + Field** on one line: e.g., "Bachelor of Science in Computer Science"
  - **Date range:** formatted same as experience dates — "Sep 2018 — May 2022"
  - **Description:** rendered if `entry.description` exists, as a paragraph

#### Skills
- Section heading: "Skills"
- Rendered as a flex-wrap group of skill pills/chips
- Only rendered if `resume.skills.length > 0`

#### Projects
- Section heading: "Projects" (only rendered if `resume.projectsEnabled === true`)
- Each project card:
  - **Project name** as bold heading
  - **URL** as a link (rendered only if `project.url` is non-empty)
  - **Description** as a paragraph with `whitespace-pre-line`

### Visual Styling
- Paper dimensions: `w-[210mm]` (A4 width), height auto
- Font sizes: header ~text-2xl, section headings ~text-lg font-bold, body ~text-sm
- Section headings have a bottom border (`border-b border-gray-200 pb-1`)
- Section spacing: `space-y-6` or `space-y-4` between sections
- Bullet list uses disc markers with `list-disc list-inside` or custom `•` markers
- Date text is gray, body text is near-black (`text-gray-800/900`)

### Template System
- Template selection via `resume.template` ("modern" | "classic" | "minimal")
- Currently the rendering logic appears to use a **single template style** (modern) regardless of the template prop — the template value is displayed in the preview header label (e.g., "Live Preview · modern") but hasn't branched logic yet
- Color scheme: dark header bar, clean white body, consistent typography

---

## 3. ZoomControls Component

**File:** `src/components/preview/ZoomControls.tsx`

### Props
```typescript
interface ZoomControlsProps {
  zoom: number;
  onChange: (zoom: number) => void;
}
```

### UI
- Three buttons in a horizontal group:
  1. **"-" button**: Decrements zoom by 0.1, minimum 0.3
  2. **Reset button**: Sets zoom back to 1.0 (100%)
  3. **"+" button**: Increments zoom by 0.1, maximum 2.0
- Display: Shows current zoom as percentage (e.g., "100%") between the buttons
- Styling: Small rounded buttons, icon-only with SVG +/- icons
- Disabled states: "-" disabled at min (0.3), "+" disabled at max (2.0)

### Behavior
- Zoom is stored in `BuilderShell` as `useState(1.0)`
- Passed to both `ZoomControls` and `ResumePreview`
- Changes immediately transform the preview scale
- Zoom does NOT affect the PDF download — it's visual preview only

---

## 4. DownloadButton Component

**File:** `src/components/preview/DownloadButton.tsx`

### Props
```typescript
interface DownloadButtonProps {
  resume: Resume;
  containerRef: React.RefObject<HTMLDivElement>;
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
}
```

### Behavior
- Clicking the button triggers PDF generation:
  1. Shows a loading spinner on the button
  2. Uses `html2canvas` to capture the hidden `PDFRenderContainer` content
  3. Converts the canvas to a PDF using `jspdf`
  4. Triggers browser download
- File name: `{resume.title || 'resume'}.pdf` (sanitized — replaces spaces with underscores)
- The `containerRef` points to the hidden PDF container — ensuring high-fidelity capture at A4 size without the preview scaling

### UI
- **Variant "primary"**: `bg-indigo-600 hover:bg-indigo-500 text-white` — used in review step
- **Variant "ghost"**: transparent with border — used in preview header
- Shows "Download PDF" label or icon-only depending on size prop
- Loading state: spinner replaces icon/text

---

## 5. PDFRenderContainer Component

**File:** `src/components/preview/PDFRenderContainer.tsx`

### Props
```typescript
interface PDFRenderContainerProps {
  resume: Resume;
  containerRef: React.RefObject<HTMLDivElement>;
}
```

### Purpose
Renders the resume **off-screen** at full A4 size for PDF capture:

```jsx
<div
  ref={containerRef}
  className="fixed left-[-9999px] top-0"
  style={{ width: "210mm" }}
>
  <ResumePreview resume={resume} zoom={1} />
</div>
```

- Positioned `fixed` at `left: -9999px` (completely off-screen, invisible to user)
- Always renders at `zoom={1}` (100% scale) for accurate PDF reproduction
- Uses the same `ResumePreview` component that the live preview uses
- This ensures what you see in the preview is exactly what gets exported

---

## 6. ReviewStep Component

**File:** `src/components/builder/ReviewStep.tsx`

### Purpose
The final step (step 8) in the builder flow — full-screen resume review before saving.

### Layout
- Takes over the full form panel width
- Renders `ResumePreview` without the zoom wrapper (no scaling)
- Shows each section with an "Edit" button that calls `onEditStep(stepIndex)` to jump back to that step
- "Save Resume" button at the bottom (calls `onSave`)

### Edit Flow
- Each section has a pencil/edit icon button
- Clicking navigates back to the relevant step in the builder
- Step mapping:
  - Personal Info → step 1
  - Experience → step 2
  - Education → step 3
  - Skills → step 4
  - Projects → step 5
  - Summary → step 6

---

## 7. Dashboard Page

**File:** `src/app/dashboard/page.tsx`

### Layout
- Grid of resume cards (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`)
- Each card shows:
  - Resume title
  - Status badge (draft/completed)
  - Last updated timestamp
  - Template name
  - Action buttons: Edit, Delete, Download

### Data Loading
- Fetches user resumes from Firestore via `getResumes(userId)`
- Loading state: skeleton cards with pulse animation
- Empty state: illustration + "Create your first resume" call-to-action button
- Error state: error message with retry button

### Actions per Resume Card
- **Edit**: Navigates to `/resume/[id]` in edit mode
- **Delete**: Shows confirmation dialog, then calls `deleteResume(id)` (deletes Firestore doc + PDF if exists)
- **Download**: Triggers PDF export (opens hidden render container, captures with html2canvas → jspdf, downloads)
- **Create New**: Button at top navigates to builder in create mode

---

## 8. Resume View/Edit Page

**File:** `src/app/resume/[id]/page.tsx`

### Modes
- **Create mode**: `/build` — starts with empty `DEFAULT_FORM_DATA`
- **Edit mode**: `/resume/[id]` — loads existing resume data from Firestore

### Data Flow
1. Page loads → fetches resume from Firestore using `getResume(resumeId)`
2. Passes data to `BuilderShell` as `initialData`
3. BuilderShell manages all state internally (`formData` state)
4. Auto-saves every 30 seconds via `setInterval` → `updateResume()`
5. Manual save on review step → sets status to "completed" → redirects to dashboard

---

## 9. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| **Desktop (lg+)** | Two-panel: form left, preview right (sticky) |
| **Tablet (md)** | Two-panel but preview may stack |
| **Mobile (< lg)** | Single panel with toggle button |

### Mobile Toggle
- Fixed position button at bottom center
- Toggles between `"form"` and `"preview"` views
- Preview panel takes full screen on mobile
- Download button available on both mobile and desktop

### Touch Considerations
- Zoom controls are large enough for touch targets
- Form inputs use standard mobile keyboards
- Month pickers use native `type="month"` inputs

---

## 10. PDF Export Pipeline

### Flow
```
User clicks "Download PDF"
    │
    ▼
DownloadButton.onClick()
    │
    ├─ Sets loading state (spinner)
    ├─ Waits for PDFRenderContainer to be rendered
    ├─ html2canvas captures the hidden A4 container
    ├─ jspdf converts canvas → PDF (A4 page size)
    ├─ pdf.save("{title}.pdf") triggers download
    └─ Resets loading state
```

### Key Details
- PDF uses `html2canvas` for DOM-to-image conversion
- Uses `jspdf` for PDF generation
- The `PDFRenderContainer` renders the same `ResumePreview` component at zoom=1, positioned off-screen
- This avoids zoom distortion in the final PDF
- A4 dimensions: 210mm × 297mm
- PDF file name: sanitized resume title (replaces spaces/special chars with underscores)

---

## 11. Styling & Visual Presentation

### Preview Panel
- **Background:** `bg-gray-100` (light gray) — simulates a desk/document background
- **Paper:** White, A4 width (210mm), with shadow (`shadow-2xl`) for depth
- **Typography:** Clean sans-serif, consistent with the app's design system
- **Colors:** Near-black text (`text-gray-800/900`), gray secondary text (`text-gray-500/600`)

### Section Styles
- **Section headers:** Bold, uppercase tracking, with thin bottom border
- **Experience/Education entries:** Clear visual hierarchy with bold role/degree, gray dates
- **Bullets:** Indented list items with disc markers
- **Skills:** Inline flex-wrap chip/pill layout

### Dark Theme Note
- The preview itself is always **light-themed** (white paper, black text) — it's a CV preview
- Only the editor panel uses the dark theme

---

## 12. User Experience & Accessibility

### Interaction Patterns
- Real-time preview updates as the user types in the form
- Zoom in/out for detailed review
- One-click PDF download
- Mobile toggle for switching between editing and previewing
- Step navigation with progress indicator

### Accessibility
- Buttons have `aria-label` attributes
- Expand/collapse on form cards uses `aria-expanded`
- Form inputs have proper `<label>` associations via `htmlFor`
- Color contrast meets WCAG standards (dark form, light preview)
- SVG icons include `aria-hidden="true"`

### States
- **Loading:** Spinner on download button during PDF generation
- **Empty:** Sections that have no data are hidden (not rendered at all)
- **Error:** PDF generation failures are silent (download simply doesn't happen)
- **Auto-save indicator:** "Saving draft…" text with spinner, "Draft saved · HH:MM" timestamp

---

## 13. Integration Points

### Firestore
- Resume data stored in `resumes/{resumeId}` collection
- Read on page load (edit mode)
- Auto-saved every 30 seconds (create and edit modes)
- Manual save on review step completion

### PDF Generation
- `html2canvas` (DOM screenshot)
- `jspdf` (PDF assembly)
- No server-side PDF generation — fully client-side

### BuilderShell Integration
- All form steps feed into the central `formData` state
- Preview reads `formData` directly
- Download reads `fullResumeForPDF` (built from `formData` + metadata)

---

## 14. Edge Cases & Error Handling

| Scenario | Behavior |
|---|---|
| No experience entries | Section hidden entirely |
| No education entries | Section hidden entirely |
| No skills | Section hidden entirely |
| Projects disabled | Projects section hidden |
| Empty summary | Summary section hidden |
| Missing dates | "Present" displayed for current roles, date omitted if both blank |
| Very long text | Text wraps naturally (no truncation) |
| Special characters in title | Sanitized for PDF filename |
| PDF generation failure | Silent fail — download button returns to idle state |
| Auto-save failure | Silent fail — user can still manually save |
| Rate limit on AI | Toast error message, form state reset |
| First app load | `mountedRef` prevents false dirty state |