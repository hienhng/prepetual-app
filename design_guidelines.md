# Design Guidelines: AI Quiz Generation Application

## Design Approach
**Reference-Based Approach** inspired by Quizlet and Kahoot's clean, student-friendly learning interfaces. Focus on distraction-free study environments with clear visual hierarchy and intuitive interactions.

## Color System
- **Primary**: #4255FF (vibrant blue) - CTAs, active states, primary actions
- **Secondary**: #9C27B0 (purple) - highlights, secondary actions, accents
- **Success**: #00C853 (green) - correct answers, success states
- **Error**: #F44336 (red) - incorrect answers, error states
- **Accent**: #FF6F00 (orange) - notifications, important highlights
- **Background**: #FAFAFA (off-white) - main background
- **Surface**: #FFFFFF (white) - cards, elevated surfaces
- **Text Primary**: #212121 (charcoal)
- **Text Secondary**: #757575 (gray)

## Typography
**Primary Font**: Poppins (headings, UI elements)
**Secondary Font**: Inter (body text, descriptions)
**Fallback**: Roboto

**Type Scale**:
- Hero/Display: text-5xl/text-6xl, font-bold (Poppins)
- Page Title: text-4xl, font-bold (Poppins)
- Section Headers: text-2xl/text-3xl, font-semibold (Poppins)
- Card Titles: text-xl, font-semibold (Poppins)
- Body Text: text-base, font-normal (Inter)
- Small/Meta: text-sm, font-normal (Inter)
- Button Text: text-base, font-medium (Poppins)

## Spacing System
Tailwind units: 2, 4, 6, 8, 12, 16, 24
- **Component spacing**: p-6, p-8
- **Section spacing**: py-12, py-16, py-24
- **Element gaps**: gap-4, gap-6, gap-8
- **Card padding**: p-6 (mobile), p-8 (desktop)

## Layout Structure

### Upload Page
- **Hero Section**: Full-width centered container (max-w-4xl) with welcoming headline and upload zone
- **Upload Zone**: Large drag-and-drop area (min-h-64) with dashed border, centered icon (80px), clear instruction text
- **Supported Formats**: Pills/badges below upload showing PDF, JPG, PNG with icons
- **Processing State**: Full-screen overlay with animated spinner and progress text

### Quiz Generation Interface
- **Container**: max-w-5xl centered
- **Content Extracted Card**: White card with shadow, showing preview of extracted text (max 300 characters) with "Show Full Text" expansion
- **Generation Controls**: 
  - Question count selector (dropdown or number input)
  - Question type checkboxes (Multi-column on desktop: grid-cols-3)
  - Difficulty slider (visual representation)
  - Large "Generate Quiz" button (w-full on mobile, w-auto on desktop)

### Quiz Taking Interface
- **Progress Bar**: Fixed top, full-width, colored fill showing completion
- **Question Card**: 
  - Large centered card (max-w-3xl) with generous padding (p-8 md:p-12)
  - Question number badge (top-left, small rounded pill)
  - Question text (text-2xl, font-semibold, mb-8)
  - Answer options as individual cards (min-h-16, hover state with scale and border)
  - Large touch targets (min 48px height)
  - Navigation: Previous/Next buttons (bottom, space-between layout)

### Results Page
- **Score Display**: Hero section with large circular progress indicator (200px diameter) showing percentage
- **Performance Summary**: Card with stats (grid-cols-3: correct, incorrect, skipped)
- **Answers Review**: 
  - Accordion-style question list
  - Each question shows: question, user's answer, correct answer, explanation
  - Color-coded indicators (green check/red X icons)
  - Expandable sections for detailed explanations

## Component Library

### Cards
- **Base Card**: bg-white, rounded-2xl, shadow-md, p-6
- **Interactive Card** (answers): hover:shadow-lg, hover:scale-[1.02], transition-all, cursor-pointer
- **Selected State**: border-2 border-primary, shadow-primary/20

### Buttons
- **Primary**: bg-primary text-white, rounded-xl, px-8 py-4, font-medium, hover:opacity-90
- **Secondary**: bg-secondary text-white, rounded-xl, px-8 py-4
- **Outline**: border-2 border-primary text-primary, rounded-xl, px-8 py-4
- **Icon Buttons**: w-12 h-12, rounded-full, centered icon

### Form Elements
- **Input Fields**: border-2 border-gray-200, rounded-xl, px-4 py-3, focus:border-primary
- **Dropdowns**: Same styling as inputs with chevron icon
- **Checkboxes/Radio**: Custom styled with primary color, large touch targets (24px minimum)

### Progress Indicators
- **Linear Progress**: h-2, rounded-full, bg-gray-200, filled portion bg-gradient (primary to secondary)
- **Circular Progress**: Donut chart style with percentage in center
- **Question Counter**: "3 / 10" format in small badge

### Feedback Elements
- **Success Banner**: bg-success/10, border-l-4 border-success, p-4, rounded-r-lg
- **Error Banner**: bg-error/10, border-l-4 border-error, p-4, rounded-r-lg
- **Loading State**: Spinner (w-8 h-8) with "Processing..." text below

## Images
**Hero Section Image**: Include an abstract illustration showing documents transforming into quiz cards with AI sparkle effects (positioned as background or side element). Use vibrant blue and purple gradient tones matching the color scheme.

**Empty States**: Illustrations for "no quizzes yet" and "upload first document" with friendly, student-focused graphics.

## Responsive Behavior
- **Mobile** (< 768px): Single column, stacked layout, full-width cards, larger touch targets (min-h-14)
- **Tablet** (768px - 1024px): Two-column grids where appropriate, max-w-4xl containers
- **Desktop** (> 1024px): Multi-column layouts, max-w-6xl containers, hover states enabled

## Animations
- **Page Transitions**: Smooth fade-in (300ms) when navigating between upload/quiz/results
- **Answer Selection**: Subtle scale (1.02) and shadow increase on hover
- **Score Reveal**: Animated counter counting up to final percentage
- **Keep minimal**: Focus on functional feedback, not decorative motion

## Key Interactions
- **Drag & Drop**: Visual feedback with border color change and slight scale on drag-over
- **Answer Selection**: Single-select with radio button behavior, clear visual selection state
- **Quiz Navigation**: Keyboard support (arrow keys, enter to submit)
- **Results Expansion**: Smooth accordion animation (300ms) for answer details