---
name: Kęs
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#424843'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#737972'
  outline-variant: '#c2c8c1'
  surface-tint: '#4a6452'
  primary: '#274130'
  on-primary: '#ffffff'
  primary-container: '#3e5846'
  on-primary-container: '#b0cdb6'
  inverse-primary: '#b0ceb7'
  secondary: '#9b4424'
  on-secondary: '#ffffff'
  secondary-container: '#fe906a'
  on-secondary-container: '#75280a'
  tertiary: '#324014'
  on-tertiary: '#ffffff'
  tertiary-container: '#495729'
  on-tertiary-container: '#bbcc93'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ccead2'
  primary-fixed-dim: '#b0ceb7'
  on-primary-fixed: '#072012'
  on-primary-fixed-variant: '#334c3b'
  secondary-fixed: '#ffdbcf'
  secondary-fixed-dim: '#ffb59c'
  on-secondary-fixed: '#390c00'
  on-secondary-fixed-variant: '#7c2d0f'
  tertiary-fixed: '#d8eaae'
  tertiary-fixed-dim: '#bccd94'
  on-tertiary-fixed: '#151f00'
  on-tertiary-fixed-variant: '#3e4c1f'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  display-hero:
    fontFamily: Epilogue
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Epilogue
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Epilogue
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  xs: 0.125rem
  sm: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  2xl: 1rem
  3xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies a modern Scandinavian culinary aesthetic: grounded, organic, serene, and intentional. It treats meal planning and daily nourishment not as clinical domestic chores, but as ritualistic acts of self-care and sensory delight. The experience balances pristine Nordic minimalism with tactile warmth—reminiscent of bespoke stoneware ceramics, unbleached linen aprons, sunlit kitchen counters, and fresh pantry herbs.

The target demographic consists of design-conscious home cooks, mindful planners, and dietary enthusiasts navigating nutritional requirements (such as low-GI, vegetarian, or high-iron regimens) alongside culinary efficiency (speedy prep, Thermomix workflows). The user interface must feel serene and uncluttered amidst dense ingredient lists and recipe metadata, steering entirely clear of commercial recipe site clutter, jarring ad frames, or sterile medical tracking paradigms.

The visual direction blends **Nordic Culinary Minimalism** with **Organic Tactility**:

- Abundant airy margins and balanced breathing room to let high-quality food photography stand out.
- Soft, earth-derived tonal layers and muted borders that honor natural materials.
- High typographic discipline, coupling modern editorial elegance with exceptionally clean technical data legibility.

## Colors

The palette is rooted in botanical greens, baked earthen pigments, and soft porcelain neutrals. These are the semantic values implemented in `apps/mobile/tamagui.config.ts`; the pasted recipes-list prototype's Tailwind config is the source of truth where prose and code disagree.

- **Primary (`#274130` — Deep Herb Sage):** key brand touchpoints, active states, high-priority icons, primary buttons, anchored navigation. `primary-container` (`#3E5846`) is the lighter container tint.
- **Secondary (`#9B4424` — Warm Sourdough Crust / Terracotta):** focal calls-to-action (quick recipe capture), timer highlights, active cooking steps, seasonal dietary highlights. `secondary-container` is `#FE906A`, `secondary-fixed` is `#FFDBCF`.
- **Tertiary (`#324014` — Olive Sprout):** healthy metric badges, positive macro trends, dietary metadata accents. `tertiary-fixed` (`#D8EAAE`) carries the pale badge fill.
- **Neutral Surface (`#FAF9F6` — Oat Chalk):** the warm, unbleached page canvas; `surface-container-lowest` (`#FFFFFF`) is the card/control surface.

Complementary semantic tints:

- **Surface Alt / Container:** `#F4F3F0` (`surface-container-low`), `#EFEEEB` (`surface-container`), `#E9E8E5` (`surface-container-high`) for elevated cards and secondary backgrounds.
- **Surface Border:** `#C2C8C1` (`outline-variant`) for gentle hairline divisions; `outline` is `#737972`.
- **Text On Neutral (Primary):** `#1A1C1A` (`on-surface`) — high legibility without the harshness of `#000000`.
- **Text On Neutral (Muted):** `#424843` (`on-surface-variant`) for secondary metadata, nutrition values, and prep duration notes.

## Typography

Typography establishes an editorial atmosphere:

- **Headlines (Epilogue):** an expressive, contemporary sans serif with subtle geometric character and structural integrity. It captures the modern culinary monograph feel—crisp, authoritative, yet approachable. Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż) render with natural geometric weight and optical poise. Weights used: 600 (headlines) and 700 (display).
- **Body & Labels (Plus Jakarta Sans):** a friendly, humanized geometric grotesque engineered for legibility across condensed screens. Open counters and clear letterforms keep cooking instructions, ingredient measures, and dietary tags effortless to read during hands-busy kitchen sessions. Weights used: 400 (body), 600 (labels), 700 (micro-labels).

Kerning across Polish headings tightens modestly (`-0.01em` to `-0.02em`) to keep a polished typographic rhythm, while micro-labels and dietary badge uppercase styles use positive tracking (`0.01em` to `0.04em`) for legibility on small viewports. The type styles above are the only typography tokens; there is no separate "DEFAULT" style.

## Layout & Spacing

The layout philosophy follows a rhythm-based **fluid content model** optimized for thumb-reach and fast scanning:

- **Mobile (< 768px):** 4-column fluid layout with `1rem` outer canvas padding (`margin`) and `1rem` gutters between column tracks (`gutter`). Bottom navigation requires persistent safe-zone clearance (`pb-28`, 7rem) to prevent content occlusion.
- **Tablet (768px – 1024px):** 8-column layout with `2rem` margins (`margin-tablet`), `1.5rem` gutters (`gutter-tablet`).
- **Desktop (>= 1025px):** max container width capped at `1200px` centered within a 12-column grid, `3rem` margins (`margin-desktop`), `2rem` gutters (`gutter-desktop`), preserving white space and readable line lengths in recipe steps.

Component internals adhere strictly to standard step intervals:

- `space-xs` (4px): metric icon-to-label inline spacing.
- `space-sm` (8px): chip padding, tag group gaps, compact list item separation.
- `space-md` (16px): card internal content padding, form field row spacing.
- `space-lg` (24px): card-to-card separation, section dividers.
- `space-xl` (40px): major structural section splits (e.g. Weekly Plan vs. Shopping Pantry).

## Elevation & Depth

Hierarchy uses **tonal layering** plus the prototype's shadows, implemented as `boxShadow` tokens:

- **Level 0 (Base Canvas):** solid Oat Chalk (`surface`, `#FAF9F6`). Static, grounded page backdrop.
- **Level 1 (Quiet Cards & Cells):** `surface-container-lowest` (`#FFFFFF`) cards with a hairline `outline-variant` border and `boxShadow="sm"`.
- **Level 2 (Active Meal Cards, Dialogs & Flyouts):** `boxShadow="md"` for hover/raised states.
- **Level 3 (Floating Bar & Capture Action):** the header uses `boxShadow="header"` (`0 1px 12px rgba(39,65,48,0.04)`); the floating navigation dock uses `boxShadow="dock"` (`0 12px 32px -6px rgba(62,88,70,0.16)`); the central capture button uses `boxShadow="capture"` (`0 8px 20px -2px rgba(188,93,59,0.35)`).

Shadows come from the prototype's Tailwind classes. React Native approximates negative spread and multi-shadow values; web is exact.

## Shapes

The interface uses an organic curved geometry with the Tailwind radius ladder:

- **Small meta badges (`rounded="sm"`, 4px):** inline metadata chips inside cards ("Obiad", "4 porcje").
- **Nav items and quick-capture tiles (`rounded="lg"`, 8px):** 8px corner rounding for compact interactive tiles.
- **Container elements (`rounded="xl"`, 12px):** recipe cards, inputs, search fields, the AI suggestion card, modal sheets, and the floating bottom-navigation dock.
- **Large containers (`rounded="2xl"`, 16px) and hero elements (`rounded="3xl"`, 24px):** available for future hero imagery and oversized surfaces.
- **Full Pill (`rounded="full"`, 9999px):** dietary attribute tags (`wege`, `thermomix`, `żelazo`), filter chips, and primary action buttons. The central capture button is a standalone circle.

## Components

### Buttons

- **Primary Action (Global / Screen):** `primary` background (`#274130`), white text, `1rem` vertical padding, `1.5rem` horizontal padding, `rounded="full"`. Subtle hover/active compression (`scale(0.98)`).
- **Hero Quick Capture (Central Nav Button):** `secondary` background (`#9B4424`), pure white glyph, elevated circle (`56px × 56px`), `boxShadow="capture"`, docked in the navigation island.
- **Secondary Action:** `surface-container-high` (`#E9E8E5`) or `surface-container-lowest` (`#FFFFFF`), `primary` text, hairline `outline-variant` border.
- **Tertiary / Ghost:** no background, `primary` text, minimal footprint for secondary cooking actions like "Pomiń krok" or "Edytuj".

### Dietary & Feature Chips (Tags)

Compact pill indicators with `0.25rem` vertical and `0.75rem` horizontal padding.

- **Wege / Roślinne:** `tertiary-fixed` (`#D8EAAE`) background, `on-tertiary-fixed` (`#151F00`) text.
- **Żelazo / Odżywcze:** `secondary-fixed` (`#FFDBCF`) background, `on-secondary-fixed` (`#390C00`) text.
- **Thermomix / Sprzęt:** `surface-container-high` (`#E9E8E5`) background, `on-surface-variant` (`#424843`) text.
- **Niski IG / Szybkie (<=20 min):** `primary-fixed` (`#CCEAD2`) background, `on-primary-fixed` (`#072012`) text.

### Recipe & Meal Cards

Background is `surface-container-lowest` (`#FFFFFF`) over the Oat Chalk canvas, enclosed by a soft `1px` border (`outline-variant`) with `rounded="xl"` (12px) and `boxShadow="sm"`. Layout features an edge-to-edge or softly padded 16:9 food photograph, followed by a title in `headline-sm` (Epilogue), duration and serving metadata in `body-sm` with inline icons (leaf, clock, scale), and a bottom-aligned row of dietary chips.

### Bottom Navigation Bar

A floating island dock anchored `1rem` above the bottom screen safe area, framed with `rounded="xl"` (12px) and backdrop blur (`rgba(249, 248, 245, 0.92)`). It carries four destinations (Przepisy, Planer, Zakupy, Preferencje) in `on-surface-variant`, with the active destination in `primary` plus an understated indicator. The central elevated `secondary` capture button ("Dodaj przepis") sits above the dock.

### Interactive Form Elements (Ingredients & Steps)

- **Checkboxes (Shopping List / Prep Steps):** custom `20px × 20px` rounded boxes with `6px` radius. Unchecked: a `1.5px` `outline-variant` border. Checked: filled `primary` (`#274130`) with a crisp white checkmark glyph. When checked, the ingredient label transitions to strike-through with muted `on-surface-variant` text.
- **Input Fields:** `surface-container-lowest` background (`#FFFFFF`), `1px` border of `outline-variant`, `0.75rem` padding, `rounded="xl"` (12px). Focus shifts the border to `primary`; the prototype's sage aura ring is not part of the stock Tamagui `Input` yet. Placeholder text is `outline` and Polish (e.g. "Wklej link do przepisu lub wpisz składnik...").

## Tamagui mapping

The implementation lives in `apps/mobile/tamagui.config.ts`; Metro/Tamagui load it automatically.

### Naming contract

Tamagui **contract names are never renamed**:

- Theme keys read by stock components: `background`, `background-hover/press/focus/active`, `border-color`, `border-color-hover/press/focus`, `color`, `color-hover/press/focus`, `placeholder-color`, `outline-color`, `shadow-color`, `accent-background`, `accent-color`, `color-1…color-11`.
- Inner theme names stock components expect: `brand` (Checkbox/Switch/RadioGroup/ToggleGroup active state), `Input`, `TextArea`, `level2`.
- Token domains and style plumbing: `color`, `space`, `size`, `radius`, `boxShadow`; fonts via `fontFamily`/`fontSize`/`lineHeight`/`letterSpacing`; shorthands (`bg`, `p`, `rounded`, …).

**Default-pack names are replaced** by design-defined names: `red-600`/`gray-500` and the generated `light_red`/`dark_red` themes came from the v6 color pack, not from Tamagui's API. The design names map 1:1 from the prototype: `bg-surface-container-lowest` → `bg="surface-container-lowest"`, `text-on-surface-variant` → `color="on-surface-variant"`, `bg-primary` → `bg="primary"`.

Never create a palette token named `background`: a color token shadows the `background` theme key for every `backgroundColor` prop. Use `surface` for the canvas.

`theme="error"` selects the accent theme; `color="error"` selects the palette token. Same distinction the defaults had with `theme="red"` / `color="red-600"`.

### Theme names

| theme | use |
| --- | --- |
| `light` | base theme: `background` is the white control/card surface (`#FFFFFF`), `color` is `on-surface`, `border-color` is `outline-variant`, focus border is `primary`; also holds the neutral `color-1…color-11` ramp. |
| `light_primary` | sage action theme (`<Button theme="primary">`). |
| `light_secondary` | terracotta action theme. |
| `light_tertiary` | olive action theme. |
| `light_error` | destructive action theme (`<Button theme="error">`). |
| `light_brand` | same values as `light_primary`; used by stock Checkbox/Switch/RadioGroup/ToggleGroup active state. |

Light only: there is no `dark` theme, `shouldAddPrefersColorThemes` is `false`, and `userInterfaceStyle` is `light`. `dark:` clauses are inert.

Do not add `light_level2`: stock `Button` nests `<Theme name="level2">`; with no level2 theme it falls back to the accent theme, so `theme="primary"`/`theme="error"` work. If a `light_level2` is added later, matching `light_<accent>_level2` variants are required or the nested level2 overrides the accent.

### Tokens

- **Colors:** `bg="surface-container-lowest"`, `color="on-surface-variant"`, `border` via `borderColor="outline-variant"`. Style values are flat/bare — no `$` prefix.
- **Spacing:** the 4px grid is the base scale; named aliases are `space-xs` (4), `space-sm` (8), `space-md` (16), `space-lg` (24), `space-xl` (40), `margin` (16), `margin-tablet` (32), `margin-desktop` (48), `gutter` (16), `gutter-tablet` (24), `gutter-desktop` (32). Example: `p="space-md"`, `gap="space-sm"`, `px={{ base: "margin", md: "margin-tablet", lg: "margin-desktop" }}`.
- **Radius:** Tailwind rungs: `xs` 2, `sm` 4, `md` 6, `lg` 8, `xl` 12, `2xl` 16, `3xl` 24, `full` 9999. The prototype's `rounded` is `rounded="sm"`, `rounded-lg` is `rounded="lg"`, `rounded-xl` is `rounded="xl"`.
- **Shadows:** `boxShadow="sm"` and `boxShadow="md"` on cards; `boxShadow="header"`, `boxShadow="dock"`, `boxShadow="capture"` for the fixed chrome.

### Fonts

`APP_FONTS` (exported from the config, also used by the splash gate):

| key | family |
| --- | --- |
| `body` | `PlusJakartaSans_400Regular` |
| `label` | `PlusJakartaSans_600SemiBold` |
| `overline` | `PlusJakartaSans_700Bold` |
| `heading` | `Epilogue_600SemiBold` |
| `display` | `Epilogue_700Bold` |

All families share one type scale, so `fontSize`, `lineHeight` and `letterSpacing` token names are consistent regardless of family. Pair the family with the style:

```tsx
<Text
  fontFamily="heading"
  fontSize="headline-lg"
  lineHeight="headline-lg"
  letterSpacing="headline-lg"
  color="primary"
>
  Twoje Przepisy
</Text>
```

Every weight is a distinct family because `expo-font` registers one style per name on both native and web. Stock `ButtonText` hardcodes `fontWeight: 600`, so a label on the 400 family may be synthesized bold on web/Android until a themed Button primitive exists.

### Example

```tsx
<YStack
  bg="surface"
  p={{ base: "margin", md: "margin-tablet", lg: "margin-desktop" }}
  gap="space-md"
>
  <YStack
    bg="surface-container-lowest"
    rounded="xl"
    p="space-md"
    borderWidth={1}
    borderColor="outline-variant"
    boxShadow="sm"
  >
    <Text
      fontFamily="heading"
      fontSize="headline-sm"
      lineHeight="headline-sm"
      letterSpacing="headline-sm"
      color="on-surface"
    >
      Kremowe curry z ciecierzycą
    </Text>
    <Button theme="primary">+ Jadłospis</Button>
  </YStack>
</YStack>
```
