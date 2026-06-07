# Prepetual Design Guidelines

Welcome to the official **Prepetual** Design Guidelines. This document serves as the single source of truth for developers and designers working on the Prepetual application. It details our design system, including typography, colors, layout structures, components, and responsive behaviors for both **Light** and **Dark** modes.

---

## 1. Design Philosophy

Prepetual's user interface is designed to be **premium, modern, and engaging**. Inspired by student-centered learning apps but enhanced with high-end dark aesthetics and glassmorphism, it bridges the gap between study utility and visual wow-factor.

### Core Principles
* **Distraction-Free Focus:** High-contrast text, clear visual hierarchy, and hidden scrollbars to keep students focused on learning.
* **Tactile Interactions:** Subtle micro-interactions, custom elevation overlays, and bounce effects to make interfaces feel reactive and alive.
* **AI-Infused Accents:** Use of soft gradients, glows, and scan lines to convey AI capabilities without overwhelming the screen.
* **Unified Dual-Theme:** A dark-first aesthetic that translates beautifully to light mode using mathematically aligned color spaces.

---

## 2. Typography System

We use two primary Google Fonts to structure our visual hierarchy.

* **Brand / Headings Font:** `Funnel Display` (sans-serif, weight: `800`). It is used exclusively for primary display elements, landing titles, page headers, and the logo to establish a distinct, bold, modern geometric presence.
* **Interface / Body Font:** `DM Sans` (sans-serif, weights: `400` / `500` / `700` / `900`). It is used for all UI text, sidebars, buttons, form controls, and descriptive body paragraphs to ensure readability.

### Type Scale

| Category | Tailwind Classes | Font Family | Font Weight | Letter Spacing | Use Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `text-4xl md:text-5xl` | `Funnel Display` | Bold (`800`) | `-0.02em` | Main dashboard titles, action header titles |
| **Brand Logo** | `text-xl` | `Funnel Display` | Bold (`800`) | `-0.02em` | Sidebar logo text |
| **Page Subtitle**| `text-lg md:text-xl` | `DM Sans` | Medium (`500`) | Normal | Under headlines, descriptions |
| **Section Header**| `text-lg font-black` | `DM Sans` | Black (`900`) | `-0.01em` | Sidebar sections, card group headers |
| **Card Title** | `text-base md:text-lg` | `DM Sans` | Bold (`700`) | Normal | Inside item cards, list titles |
| **Body Text** | `text-sm md:text-base` | `DM Sans` | Normal (`400`) | Normal | Normal reading text, explanation details |
| **Action Text** | `text-sm font-bold` | `DM Sans` | Bold (`700`) | Normal | Button labels, clickable links |
| **Micro Labels** | `text-[10px]` | `DM Sans` | Black (`900`) | `widest` | Badges, file format labels, uppercase tags |

---

## 3. Color System

Prepetual uses dynamic HSL color variables linked to Tailwind CSS. The primary highlight is a vibrant yellow-gold, paired with deep carbon colors in Dark mode and clean slate colors in Light mode.

### Dual-Theme Token Directory

Below is the comparison of HSL design tokens between Light Mode and Dark Mode:

| CSS Variable | Light Mode (HSL) | Dark Mode (HSL) | Visual Description / Intent |
| :--- | :--- | :--- | :--- |
| `--primary` | `48 96% 53%` (Gold) | `48 96% 58%` (Gold) | Primary brand accents, key highlight text, CTAs |
| `--primary-foreground` | `0 0% 10%` (Charcoal) | `0 0% 10%` (Charcoal) | Text overlay on primary yellow buttons |
| `--primary-3d-shadow` | `45 96% 38%` (Dark Gold) | `45 96% 30%` (Deep Gold) | Solid base depth shadow for 3D buttons |
| `--background` | `0 0% 98%` (Off-white) | `240 4% 8%` (Slate-Black) | Main app frame and page body background |
| `--foreground` | `0 0% 9%` (Near Black) | `0 0% 95%` (Off-white) | Base text color |
| `--border` | `240 6% 90%` (Slate-Gray) | `240 4% 16%` (Zinc-Gray) | Global borders and dividing lines |
| `--card` | `0 0% 96%` (Soft White) | `240 4% 10%` (Zinc-900) | Card components and surface elevations |
| `--card-border` | `240 5% 92%` (Gray) | `240 4% 13%` (Zinc-800) | Subtle borders for elevated card components |
| `--sidebar` | `240 5% 94%` (Gray) | `240 4% 12%` (Zinc-950) | Left navigation sidebar background |
| `--sidebar-border`| `240 5% 88%` (Slate) | `240 4% 16%` (Zinc-Gray) | Sidebar boundary lines |
| `--muted-foreground`| `240 4% 40%` (Slate) | `240 5% 65%` (Gray) | Subtext, labels, and secondary reading details |
| `--destructive` | `0 84% 52%` (Red) | `0 72% 48%` (Red) | Errors, delete buttons, alert alerts |
| `--destructive-3d-shadow` | `0 84% 38%` (Dark Red) | `0 72% 30%` (Deep Red) | Solid base depth shadow for 3D destructive buttons |
| `--success` | `145 84% 39%` (Emerald) | `145 84% 39%` (Emerald) | Completed uploads, success states, green tags |
| `--warning` | `28 100% 50%` (Orange) | `28 100% 65%` (Orange) | Difficulty alerts, medium priority tags |

---

## 4. Custom Interaction & Elevation System

Rather than relying on basic Tailwind shadows, Prepetual implements a highly custom **Elevate System** that uses pseudo-elements (`::before`/`::after`) to shift button and card contrast dynamically on interactions.

### Contrast Adjustments
* **Light Mode:** 
  * `--elevate-1`: `rgba(0,0,0, 0.03)` (adds soft darkness on hover)
  * `--elevate-2`: `rgba(0,0,0, 0.08)` (adds deep darkness on click)
* **Dark Mode:**
  * `--elevate-1`: `rgba(255,255,255, 0.04)` (adds soft luminosity on hover)
  * `--elevate-2`: `rgba(255,255,255, 0.09)` (adds highlighted luminosity on click)

### Elevation CSS Classes
* `.hover-elevate`: Dynamically layers `--elevate-1` overlay on top of the content when hovered.
* `.active-elevate-2`: Layers `--elevate-2` on click to create a tactile depression.
* `.toggle-elevate.toggle-elevated`: Layers background tints to represent a toggled/active sidebar link or select button.

---

## 5. UI Components & Layout Guidelines

### 5.1 Sidebar Layout
* **Visual Anchor:** The logo contains a round avatar image accompanied by the text `prepetual` styled in the custom `font-brand` (`Funnel Display`).
* **Sidebar Menu Items:**
  * Active state: Highlighting using `bg-sidebar-accent` or primary brand colors.
  * Collapsed state: Compact view displaying icons only with tooltip fallback indicators.
* **Footer User Widget:** Displays avatar initials (`getInitials`) or profile image next to the username and email, alongside the `ThemeToggle` button.

### 5.2 Content & Dashboard Cards
* **The Welcome Header:** Always displays the user's name styled with a primary yellow color (`text-primary`) for high visual contrast.
* **Stats Panel:** Displays data in colored panels matching specific context:
  * *Created metrics:* Blue tint background.
  * *Question counts:* Purple tint background.
  * *Accuracy percentages:* Green tint background.
* **Glowing Action Card ("Tạo quiz mới"):** Highlighted as a primary visual trigger. Uses primary yellow background, rounded borders, and a glowing yellow shadow overlay (`shadow-primary/20` or bright glow filters).
* **Tag Indicators (Difficulty):** 
  * `Khó` (Hard): Red tag badge.
  * `Trung Bình` (Medium): Orange tag badge.
  * `Dễ` (Easy): Green tag badge.

### 5.3 Input Fields & Editor Controls
* **Text Input Areas:**
  * Uses `bg-background` and `border-border`.
  * Active Focus State: Outline turns to bright yellow/gold (`border-primary` / ring focus).
* **Word Counters:** Muted gray badge in the editor footer displaying current stats (`bg-muted/50`).

### 5.4 Dialogs & Upload Modals
* **Backdrop Styling:** Modals must use `backdrop-blur-xl` or `backdrop-blur-md` overlay, darkening the background for maximum focus.
* **Drag-and-Drop Dropzone:**
  * Features a dotted layout border `border-2 border-dashed border-border/50`.
  * Highlighted upload state: Glow background (`bg-primary/5`) and scale animation (`scale-[1.02]`).
  * Formats Badges: Uses uppercase small pills (`text-[10px] bg-background/50 border`).
* **Loading State:** 
  * Circular spinner and bouncing cloud/upload indicator.
  * Gradient progress bar transitioning from `primary` (yellow) to `violet` (purple) to represent active processing status.

### 5.5 Buttons & Action CTA Design
All buttons with a card layout (`default`, `destructive`, `outline`, and `secondary` variants) feature a tactile 3D design that simulates a physical push button. Text-only buttons without card layout boundaries (`ghost` and `link` variants) remain flat.
* **Resting State:** 
  * Features a solid, matching darker HSL shade bottom depth shadow of `4px`:
    * `default`: `shadow-[0_4px_0_0_var(--primary-3d-shadow)]`
    * `destructive`: `shadow-[0_4px_0_0_var(--destructive-3d-shadow)]`
    * `secondary`: `shadow-[0_4px_0_0_var(--secondary-3d-shadow)]`
    * `outline`: `shadow-[0_4px_0_0_var(--outline-3d-shadow)]`
  * Positioned normally at `translate-y-0` (so they align perfectly with flat/ghost icons in headers and side-menus).
* **Pressed / Clicked State (`:active`):**
  * Translates down along the Y-axis: `active:translate-y-[4px]`.
  * Shadow disappears: `active:shadow-none`. (This creates the illusion of pressing down into the page, keeping the bottom edge visual position stable).
  * Brightness overlay is disabled via `.no-default-active-elevate` to keep the button face solid.
* **Disabled State:**
  * Resets to flat styling (`disabled:translate-y-0 disabled:shadow-none`) and opacity reduction.
* **Transition snappy speed:** snappier `duration-75` transition-all ensures instant feedback.

---

## 6. Animations & Micro-interactions

Prepetual relies on subtle CSS and Framer Motion transitions to keep the application responsive:
* **Interactive Scales:** Interactive components (like files, buttons, and choice cards) scale to `scale-[1.01]` or `scale-[1.02]` on hover with a smooth `duration-300` ease.
* **Bouncing UI:** Dialog triggers and button clicks utilize a spring physics animation (`type: "spring"` with framer-motion) to provide elastic response.
* **Tilt Effect:** Large hero cards or main dashboards can include a subtle tilt background loop (`.animate-tilt` rotating slightly from `-0.5deg` to `0.5deg`).
* **AI Scan Effect:** The document scanning overlay utilizes a vertical/horizontal scanner slide animation (`.animate-scan` / `.animate-scan-horizontal`) to represent real-time AI OCR extraction.
