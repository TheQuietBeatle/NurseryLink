---
name: Serene Care Interface
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#3f4849'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#6f7979'
  outline-variant: '#bfc8c8'
  surface-tint: '#23686a'
  primary: '#1f6567'
  on-primary: '#ffffff'
  primary-container: '#3d7e80'
  on-primary-container: '#f2ffff'
  inverse-primary: '#91d2d4'
  secondary: '#5e5f5d'
  on-secondary: '#ffffff'
  secondary-container: '#e0e0dd'
  on-secondary-container: '#626361'
  tertiary: '#8d4b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b15f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aceef0'
  primary-fixed-dim: '#91d2d4'
  on-primary-fixed: '#002021'
  on-primary-fixed-variant: '#004f51'
  secondary-fixed: '#e3e2e0'
  secondary-fixed-dim: '#c7c6c4'
  on-secondary-fixed: '#1a1c1a'
  on-secondary-fixed-variant: '#464745'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display:
    fontFamily: Source Sans 3
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Sans 3
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Source Sans 3
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Source Sans 3
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1200px
  gutter: 20px
---

## Brand & Style

The design system establishes a professional yet empathetic environment for nursery management. It intentionally moves away from traditional "juvenile" aesthetics (bright primary colors and playful characters) in favor of a sophisticated, clinical-yet-approachable direction. 

The visual style is **Modern Corporate** with a **Tactile Minimalist** edge. It prioritizes clarity and calm, ensuring that administrators and parents feel a sense of organized stability. The UI uses high-quality whitespace and thin structural lines to create a sense of breathability, reducing the cognitive load often associated with complex care coordination.

## Colors

The palette is anchored by a warm off-white background to prevent the "coldness" of pure white, creating a paper-like, inviting surface. 

- **Primary (Muted Teal):** Used for primary actions, navigation states, and active indicators. It signifies growth and stability.
- **Secondary (Warm Off-White):** The foundational surface color for all views.
- **Accent (Amber):** Reserved strictly for "Needs Attention" items like unsigned forms or low supply alerts.
- **Critical (Soft Red):** A high-priority color used exclusively for health incidents or emergency alerts.
- **Neutral (Deep Charcoal):** Provides high-contrast legibility for all body text and UI labels.

## Typography

The design system utilizes **Source Sans 3**, a humanist sans-serif that excels in legibility and professional warmth. 

Headlines should be set with tighter letter-spacing for a modern, editorial feel, while body text uses a generous line height (1.5x minimum) to ensure long-form reports and logs are easy to scan. Labels for data entry use a slightly heavier weight to distinguish them from user-generated content.

## Layout & Spacing

This design system follows a **Fixed-Fluid Hybrid** grid. The primary content container is centered with a maximum width of 1200px on desktop, while mobile views utilize a flexible fluid layout with 16px safe-area margins.

The spacing rhythm is based on a strict 8px baseline grid. 
- **Dashboards:** Use a 12-column grid with 20px gutters.
- **Forms/Sidebars:** Use consistent 24px internal padding (lg) to maintain the "airy" feel.
- **Grouping:** Related elements (e.g., a child's name and their daily status) should use the 4px (xs) or 8px (base) units to reinforce proximity.

## Elevation & Depth

To maintain a "clinical yet approachable" look, the design system avoids heavy drop shadows. 

- **Flat Surfaces:** Most containers are flat with a #E8E6E1 hairline border (1px) to distinguish them from the off-white background.
- **Subtle Elevation:** For floating elements like modals or dropdowns, use a single, diffused ambient shadow: `0 4px 20px rgba(45, 45, 45, 0.05)`.
- **Active States:** Instead of shadows, use tonal shifts or 2px solid borders in the Primary color to denote focus or selection.

## Shapes

The shape language is defined by soft, friendly geometry. 
- **Standard UI Elements:** (Inputs, Buttons, Cards) utilize a **10px radius** as the default, providing a balance between precision and softness.
- **Secondary Elements:** Smaller components like chips or badges may use a **Pill (Full Rounding)** to distinguish them as interactive or status-based metadata.

## Components

### Buttons
- **Primary:** Solid Muted Teal (#4A8B8D) with white text. 10px rounded corners.
- **Secondary:** Transparent background with a 1px border of Deep Charcoal at 20% opacity.
- **Destructive:** Soft Red (#EF4444) text only, or solid for high-impact deletions.

### Inputs & Fields
- Use a light gray background (#F1F0EC) for input wells with a 1px bottom border for a clean, modern look. 
- Labels must always be visible above the field in `label-md` style.

### Cards (The "Record" Card)
- The central component of the app. It uses a 1px border (#E8E6E1) and no shadow. 
- Internal padding is 24px.
- Use a vertical color stripe (4px width) on the left edge of the card to indicate status (Teal for checked-in, Amber for attention, Red for incident).

### Status Chips
- Small, pill-shaped indicators.
- Use low-opacity background fills of the status color (e.g., 10% Teal) with full-opacity text for maximum legibility without being visually overwhelming.

### Lists & Activity Logs
- Each entry is separated by a 0.5px horizontal rule. 
- Use subtle, thin-line iconography (2px stroke) to represent activities like feeding, sleep, or diaper changes. Avoid multi-colored or "cute" icons.