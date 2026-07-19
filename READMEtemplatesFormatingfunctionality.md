# Resume Templates, Formatting, Preview & Builder System — Complete Reference

## Overview

This document covers the entire resume rendering pipeline: template system, formatting toolbar, live preview panel, PDF export, and the builder shell that ties everything together. It serves as a developer's guide for understanding, maintaining, or extending the resume display system.

---

## Architecture Diagram

```
BuilderShell.tsx
├── Left Panel: Form Steps (Title → Personal Info → ... → Review)
│   └── Each step renders a form component
│       └── All feed into central `formData` state
│
├── Right Panel: Live Preview
│   ├── Preview Header (desktop only)
│   │   ├── "Live Preview · {template}" label
│   │   ├── FormattingToolbar  ← NEW: font size + alignment controls
│   │   ├── ZoomControls       ← scale 0.3x – 2.0x
│   │   └── DownloadButton     ← exports PDF
│   │
│   └── ResumePreview
│       ├── Auto-fit scale calculation (ResizeObserver)
│       ├── CSS zoom for font size scaling
│       └── TemplateComponent (Modern | Classic | Minimal)
│           ├── ModernTemplate.tsx   ← two-column with sidebar
│           ├── ClassicTemplate.tsx  ← single-column serif
│           └── MinimalTemplate.tsx  ← ultra-clean sans-serif
│
└── Hidden: PDFRenderContainer
    ├── Off-screen at left: -9999px
    ├── Renders same template at zoom=1
    └── Captured by html2canvas → jspdf for PDF download
```

---

## Part 1: Template System

### File Map
```
src/
├── lib/
│   ├── templates.ts              # Template registry & type definitions
│   └── types.ts                  # ResumeFormatting, ResumeFormData
└── components/preview/templates/
    ├── ModernTemplate.tsx         # Two-column with dark sidebar
    ├── ClassicTemplate.tsx        # Single-column serif, traditional
    └── MinimalTemplate.tsx        # Ultra-clean, generous whitespace
```

### Template Interface (`src/lib/templates.ts`)

```typescript
export interface TemplateProps {
  resume: Resume;
  formatting?: ResumeFormatting;  // ← NEW: formatting controls
}

export interface TemplateDefinition {
  name: string;
  description: string;
  component: ComponentType<TemplateProps>;
}
```

### Template Registry

```typescript
export const templates: Record<Resume["template"], TemplateDefinition> = {
  modern: { name: "Modern", component: ModernTemplate },
  classic: { name: "Classic", component: ClassicTemplate },
  minimal: { name: "Minimal", component: MinimalTemplate },
};
```

### ModernTemplate — Two-Column Dark Sidebar

**Layout:**
- Left sidebar (30% width): dark navy (`#1e2a4a`) background
  - Name + title at top
  - Contact info with icon row
  - Skills as rounded pill badges
  - Education entries (institution, degree/field, dates)
- Right main column (70%): white background
  - Professional Summary paragraph
  - Work Experience entries — role · company, dates, bullets
  - Projects (optional)

**Typography:** Inter/Segoe UI, 11pt base, 1.5 line-height
**Section headings:** 10pt uppercase with indigo underline border
**Sidebar headings:** 8.5pt uppercase with subtle border

**Formatting support:**
- `formatting.fontSize` → applied via CSS `zoom` on the parent (scales all `pt` sizes)
- `formatting.headerAlign` → text-align on header container, flex alignment on contact list
- `formatting.sectionAlign` → text-align on all `<h2>` section headings
- `formatting.bodyAlign` → text-align on bullets, descriptions, summary, projects

### ClassicTemplate — Traditional Single-Column Serif

**Layout:**
- Single column, centered
- Georgia serif font with Segoe UI for headings
- Horizontal rules (`<hr>`) between sections
- Contact items joined with "|" separators

**Typography:** 11pt Georgia, 1.5 line-height
**Section headings:** 11pt uppercase, Segoe UI font
**Print styling:** `@media print` with zero margin

**Formatting support:**
- All same alignment props as ModernTemplate
- Header text-align on the header wrapper
- Section headings text-align via inline style
- Body text-align on all paragraphs, bullets, and descriptions

### MinimalTemplate — Ultra-Clean Sans-Serif

**Layout:**
- Single column, generous padding (52px/60px)
- No dividers or rules — whitespace separates sections
- Light font-weight emphasis (300 vs 600)
- Dashes instead of disc bullets (absolute-positioned)

**Typography:** 11pt Inter/Segoe UI, 1.7 line-height
**Section headings:** 8pt uppercase indigo (`#4f6bed`)
**Name:** 30pt, font-weight 300 (extra light)

**Formatting support:**
- Same alignment pattern as other templates
- Body text, bullets, descriptions all use `textAlign: bodyAlign`

### How Templates Are Selected
1. User chooses template on the Title step (ResumeTitle component)
2. Value stored in `formData.template` ("modern" | "classic" | "minimal")
3. `ResumePreview` reads `template` from resume data
4. Looks up `templates[templateKey]?.component`
5. Falls back to Modern if unknown key
6. Passes `formatting` prop to the template component

---

## Part 2: Formatting Toolbar

### File: `src/components/preview/FormattingToolbar.tsx`

### Props
```typescript
interface FormattingToolbarProps {
  formatting: ResumeFormatting;
  onChange: (formatting: ResumeFormatting) => void;
}
```

### UI Layout

```
┌──────────────┐
│ ═══  Format  │  ← Toggle button (text + SVG icon)
└──────────────┘
       ↓ click
┌─────────────────────────────────────┐
│  Font Size                         │
│  [ XS ] [ S ] [ M*] [ L ] [ XL ]  │  ← Active = indigo bg
│                                    │
│  Name & Contact                    │
│  [≡ left] [≡ center*] [≡ right]   │  ← Active = indigo bg
│                                    │
│  Section Headings                  │
│  [≡ left*] [≡ center] [≡ right]   │
│                                    │
│  Body & Bullets                    │
│  [≡ left*] [≡ center] [≡ right]   │
└─────────────────────────────────────┘
```

### Behavior
- **Toggle button:** Click to show/hide popover
- **Click outside:** Closes popover (`mousedown` event listener on `document`)
- **Font size presets:** XS (0.8), S (0.9), M (1.0), L (1.1), XL (1.2)
- **Alignment:** Three SVG icons per row — left, center, right
- **Active state:** Indigo-600 background with white text
- **Position:** `absolute right-0 top-full` — floats below the toggle button
- **Desktop only:** Hidden on mobile (`hidden lg:flex` on the header row)
- **Styling:** White panel, gray border, rounded-xl, shadow-xl, z-50

### How Font Size Scaling Works

**Critical design decision:** Templates use inline `pt` sizes (e.g., `fontSize: "11pt"`), not Tailwind classes. CSS `zoom` property scales everything proportionally — text, spacing, images — so we don't need to convert font sizes:

```jsx
// In ResumePreview.tsx (line ~104):
<div data-paper style={{ zoom: formatting.fontSize }}>
  <TemplateComponent ... />
</div>
```

- `fontSize: 1.0` → `zoom: 1.0` → default size
- `fontSize: 0.8` → `zoom: 0.8` → 80% scale (compact)
- `fontSize: 1.2` → `zoom: 1.2` → 120% scale (large)
- Works correctly with `html2canvas` for PDF export

---

## Part 3: ResumePreview Component

### File: `src/components/preview/ResumePreview.tsx`

### Props
```typescript
interface ResumePreviewProps {
  resume: ResumeFormData;
  zoom?: number;                              // Preview zoom (default 1.0)
  formatting?: ResumeFormatting;              // NEW: format controls
}
```

### Rendering Pipeline

```
1. Measure panel width (ResizeObserver)
       ↓
2. Calculate autoFitScale = panelWidth / 816px (PAPER_W)
       ↓
3. effectiveScale = autoFitScale × zoom
       ↓
4. Render flow sizer at renderedW × renderedH
   (sets scrollable area for browser)
       ↓
5. Absolutely-position paper div at PAPER_W × PAPER_H
   transform: scale(effectiveScale)
   zoom: formatting.fontSize
       ↓
6. Render template component inside paper div
```

### Paper Dimensions
- US Letter at 96 dpi: `PAPER_W = 816`, `PAPER_H = 1056`
- Matches `min-height: 1056px` used by all templates

### Zoom Behavior
- Preview zoom (ZoomControls): CSS `transform: scale()` affects visual sizing
- Font zoom (FormattingToolbar): CSS `zoom` property scales content proportionally
- Both compose together: preview can be zoomed out for overview while font size is independently adjusted

### Auto-Fit Mechanism
- `ResizeObserver` watches the wrapper `<div>` width
- Calculates `panelWidth / PAPER_W` to fill the available space exactly
- When window resizes, preview rescales automatically
- `effectiveScale = autoFitScale × zoom` (preview zoom multiplier)

---

## Part 4: PDF Export Pipeline

### File: `src/components/preview/DownloadButton.tsx`

### Flow
```
User clicks "Download PDF"
    │
    ▼
DownloadButton.onClick()
    ├─ Sets loading state (spinner)
    ├─ Accesses PDFRenderContainer via containerRef
    ├─ html2canvas captures the hidden A4 container
    │   └─ Uses resume.title for filename (sanitized)
    ├─ jspdf creates A4 PDF from canvas
    ├─ pdf.save("{title}.pdf") triggers browser download
    └─ Resets loading state
```

### Props
```typescript
interface DownloadButtonProps {
  resume: Resume;
  containerRef: React.RefObject<HTMLDivElement>;
  variant?: "primary" | "ghost";   // styling variant
  size?: "sm" | "md";              // button size
}
```

### Variants
- **primary:** `bg-indigo-600 text-white` — used on review step
- **ghost:** `border border-slate-200 text-gray-500` — used in preview header

### PDFRenderContainer

**File:** `src/components/preview/PDFRenderContainer.tsx`

```jsx
<div
  ref={containerRef}
  style={{
    position: "fixed",
    left: "-9999px",           // completely off-screen
    top: 0,
    width: PAPER_W,            // 816px at 96dpi
    height: PAPER_H,           // 1056px
    zoom: formatting.fontSize, // font size scaling for PDF
  }}
>
  <TemplateComponent resume={fullResume} formatting={formatting} />
</div>
```

- Renders the same template component the user sees in preview
- At `zoom: 1.0` (no preview scaling distortion)
- Captured by `html2canvas` for accurate PDF reproduction
- CSS `zoom` is respected by `html2canvas`, so font size formatting carries to PDF

---

## Part 5: BuilderShell — Integration Hub

### File: `src/components/builder/BuilderShell.tsx`

### State Management

```
formData (useState<ResumeFormData>)
├── title: string
├── template: "modern" | "classic" | "minimal"
├── status: "draft" | "completed"
├── personalInfo: { fullName, email, phone, ... }
├── summary: string
├── experience: Experience[]
├── education: Education[]
├── skills: string[]
├── projects: Project[]
├── projectsEnabled: boolean
└── formatting: ResumeFormatting   ← NEW
```

### Auto-Save
- Runs every 30 seconds (`setInterval`)
- Only saves if `dirtyRef.current === true` (form changed)
- Skips if already saving (`savingRef` or `autoSavingRef`)
- Creates new Firestore doc on first save (create mode)
- Updates existing doc on subsequent saves (edit mode)

### Preview Header Layout (Desktop)

```
┌──────────────────────────────────────────────────────────┐
│  Live Preview · modern    [Format] [Zoom] [Download]     │
└──────────────────────────────────────────────────────────┘
```

- `hidden lg:flex` — only visible on desktop
- Format button opens popover below it (`absolute right-0`)
- Zoom shows current percentage (e.g., "100%") with +/- buttons
- Download button exports PDF

### Mobile Layout
- Single panel (form OR preview) with toggle button
- Toggle at bottom center: `fixed bottom-6 left-1/2 -translate-x-1/2`
- Preview on mobile: full screen, no zoom/download controls header
- Format toolbar hidden on mobile (part of `hidden lg:flex` header)

### Step Navigation
- 8 steps: Title → Personal Info → Experience → Education → Skills → Projects → Summary → Review
- Forward: validates current step, marks completed, advances
- Back: clears errors, goes to previous step
- Step click: jumps to any step (via `StepProgress` component)
- Review step: shows full resume with per-section edit buttons
- Save: sets status to "completed", redirects to dashboard

### Edit Mode
- Route: `/resume/[id]`
- Loads existing resume data from Firestore via `getResume()`
- Passes as `initialData` to BuilderShell
- Auto-save updates the existing document
- Reviews step shows loaded data

---

## Part 6: ResumeFormatting Type

### File: `src/lib/types.ts`

```typescript
export interface ResumeFormatting {
  fontSize: number;                              // 0.8 | 0.9 | 1.0 | 1.1 | 1.2
  headerAlign: "left" | "center" | "right";     // Name + contact row
  sectionAlign: "left" | "center" | "right";    // Section headings
  bodyAlign: "left" | "center" | "right";       // Body text, bullets
}

export const DEFAULT_FORMATTING: ResumeFormatting = {
  fontSize: 1.0,
  headerAlign: "center",
  sectionAlign: "left",
  bodyAlign: "left",
};
```

### Backwards Compatibility
Old resumes in Firestore don't have a `formatting` field. BuilderShell handles this:

```typescript
const init = { ...initialData };
if (!init.formatting) {
  init.formatting = { ...DEFAULT_FORMATTING };
}
```

This runs on every page load (both create and edit modes), ensuring old data works seamlessly.

### Persistence
- `formatting` is part of `formData`, so it auto-saves to Firestore every 30 seconds
- Stored as a nested map in the resume document
- No extra API calls or Firestore changes needed — just extended the existing document schema

---

## Part 7: Edge Cases & Error Handling

| Scenario | Behavior |
|---|---|
| Old resume without formatting | Defaults applied on load |
| Missing template key | Falls back to "modern" template |
| PDF generation failure | Silent — button returns to idle |
| Auto-save failure | Silent — user can manually save |
| Rate limit on AI | Toast error, form state reset |
| Empty sections | Section hidden entirely (not rendered) |
| Missing dates | "Present" for current roles, omitted if blank |
| Very long text | No truncation — wraps naturally |
| Special chars in title | Sanitized for PDF filename |
| Window resize | Preview auto-fits via ResizeObserver |
| Mobile view | Single panel with toggle |
| Click outside formatting popover | Closes via mousedown listener |
| Formatting during PDF export | CSS zoom respected by html2canvas |

---

## Part 8: Complete File Reference

| File | Purpose | Lines |
|---|---|---|
| `src/lib/types.ts` | Types: Resume, ResumeFormatting, Education, etc. | ~90 |
| `src/lib/templates.ts` | Template registry + TemplateProps type | ~38 |
| `src/components/preview/ResumePreview.tsx` | Live preview panel with auto-fit | ~115 |
| `src/components/preview/PDFRenderContainer.tsx` | Off-screen PDF render target | ~50 |
| `src/components/preview/FormattingToolbar.tsx` | Font size + alignment controls | ~230 |
| `src/components/preview/ZoomControls.tsx` | Preview zoom +/- buttons | ~60 |
| `src/components/preview/DownloadButton.tsx` | PDF export via html2canvas+jspdf | ~70 |
| `src/components/preview/templates/ModernTemplate.tsx` | Two-column dark sidebar layout | ~310 |
| `src/components/preview/templates/ClassicTemplate.tsx` | Single-column serif traditional | ~230 |
| `src/components/preview/templates/MinimalTemplate.tsx` | Ultra-clean sans-serif | ~200 |
| `src/components/builder/BuilderShell.tsx` | Layout shell + state + auto-save | ~580 |
| `src/components/builder/ReviewStep.tsx` | Full-screen review before save | ~120 |

---

## Part 9: Adding a New Template

To add a 4th template to the system:

1. **Create** `src/components/preview/templates/NewTemplate.tsx`
   - Accept `{ resume: Resume, formatting?: ResumeFormatting }` props
   - Render at `minHeight: 1056px`
   - Support `formatting.headerAlign`, `formatting.sectionAlign`, `formatting.bodyAlign`
   - Use inline `pt` sizes for fonts (so CSS `zoom` scaling works)

2. **Register** in `src/lib/templates.ts`:
   ```typescript
   import { NewTemplate } from "@/components/preview/templates/NewTemplate";
   // ...
   newtemplate: {
     name: "New Template",
     description: "Description here",
     component: NewTemplate,
   }
   ```

3. **Update** the `Resume["template"]` union type in `types.ts`:
   ```typescript
   template: "modern" | "classic" | "minimal" | "newtemplate";
   ```

4. **Update** the template selector in `ResumeTitle` component to include the new option.

That's it — the template will automatically receive formatting props from the toolbar, work in the live preview, and export correctly to PDF.