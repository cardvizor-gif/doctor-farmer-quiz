# Dashboard reference audit

## Эталон

The approved reference is a compact desktop CRM workspace with a dark green left sidebar, a white top utility bar, a two-cell greeting row, a narrow action strip, a dense three-column working area, and a narrow right control rail. The reference has no large unused white band between the hero and the working cards.

## Current verified render

The current desktop render now has the dark green sidebar, white utility bar, split hero/plan row, five action buttons, a left work area, a sales/tools column, and a right control rail. The mobile drawer regression caused by the desktop sidebar override was corrected and rechecked at 390×844.

## Remaining measurable gaps to resolve

1. The current split hero/plan row is positioned correctly, but its proportions need to be checked against the reference: the hero should occupy approximately 78–80% of the row and the plan card approximately 20–22%.
2. The current sidebar is approximately 150px at the 1280px viewport and the reference is visually closer to a 150–165px compact rail; the brand, navigation density, and bottom field image must remain readable at that width.
3. The current topbar search and action controls are slightly denser than the reference, so the final pass must lock their height, spacing, and baseline alignment rather than relying on inherited rules.
4. The current working area includes the real empty states, but the reference card heights and vertical rhythm need explicit CSS assertions so the absence of data does not create a different composition.
5. The current plan widget correctly shows “План не задан” when no source exists. Its ring, label, and two-line amount block must remain aligned in both configured and empty states.
6. Mobile must preserve the existing four priority topbar actions, two-line brand, drawer dismissal interactions, and bottom navigation while using the same visual hierarchy as the desktop reference.

## Required evidence before checkpoint

The final pass must include render-level assertions for `dashboard-reference-hero-row`, `dashboard-workday-hero`, `dashboard-sales-plan-inline`, `dashboard-workday-main-grid`, `dashboard-workday-side`, and the hidden summary row. It must also include desktop 1280×720, tablet 768×1024, and mobile 390×844 screenshots after the final CSS is applied, followed by typecheck, the full unit-test suite, and production build.
