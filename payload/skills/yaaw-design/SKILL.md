---
name: yaaw-design
description: How yaaw-designer builds UI - modes, keeping the existing look, states and the craft floor checks. Preloaded into yaaw-designer and yaaw-reviewer. Use when building, reviewing or polishing a web page, screen, component or other frontend UI.
license: Apache-2.0 (derived from pbakaus/impeccable, see LICENSE)
---

# yaaw-design

Build UI like a design director who ships production code: a clear direction, real content and every state finished. The direction was settled in the probe and written into the ticket's **Design direction**. Build that direction, never your own taste.

## 1. Read what is already true

Before editing, read the ticket's **Design direction**, then the project's `DESIGN.md` and `PRODUCT.md` when they exist, the tokens, the shared components and the screens next to the one you are building.

- **Established look**: the project already has a coherent look in its code. Inherit it, even when there is no `DESIGN.md`.
- **Extending a surface**: a section, component or state inside an existing screen inherits that screen. Resolve only the new content, hierarchy, states and how it joins the rest.
- **New look**: only when the ticket's direction says so. Use the look the ticket describes.

When the ticket and the code disagree about the look, follow the ticket and name the conflict under **Flags**.

## 2. Mode

The **mode** says what success looks like for the visitor on this surface. The ticket names it. It belongs to the surface, not the product: a tool's landing page is Persuade, its settings page is Operate.

- **Operate**: the visitor completes a task (app UI, dashboards, forms, settings, tools). The interface disappears into the task. Familiar patterns earn their place. Brand lives in precise details.
- **Read**: the visitor understands something (docs, articles, help). Structure for reading first, with a 65 to 75 character measure and clear wayfinding.
- **Persuade**: the visitor decides and acts (landing pages, pricing). Commit to a clear point of view. The offer is clear and the primary action is visible in the first viewport.
- **Experience**: the visitor is inside the work (portfolios, galleries). The work leads and the interface recedes.

### Operate surfaces

Most yaaw-se tickets are Operate. On these:

- One well-tuned sans family is often enough. Use a fixed rem scale with a 1.125 to 1.2 step ratio.
- Colour is restrained. The accent marks primary actions, the current selection and state, never decoration.
- Every interactive component has default, hover, focus, active, disabled, loading and error states. Loading uses skeletons in place of content. Empty states teach the next step.
- The same control looks the same everywhere. When "save" looks different on 2 screens, one is wrong.
- Motion shows a state change and lasts 150 to 250 ms.
- Exhaust inline and progressive options before reaching for a modal.
- Overlays escape their container: use `<dialog>`, the popover API, `position: fixed` or a portal, as an `overflow: hidden` ancestor clips them.

## 3. Build

- **The brief wins.** Fonts, colours and patterns named in the ticket or `DESIGN.md` are used as given.
- **Refinement preserves.** A polish or fix ticket keeps the existing look, behaviour and copy outside its scope.
- **Copy is the product's own.** Controls name their action. Errors name the problem and the recovery. Factual copy and claims stay as they are; a change to them goes under **Flags**.
- **Reuse the system.** Use the project's tokens and shared components. Promote a value to a token only when it is reused.
- **Dependencies stay as they are.** Fonts, icon libraries and UI packages not already in the project are listed under **Flags** for the user to approve.

## 4. Look at it

Check the built result by looking at it, at the sizes it ships at (on the web, a phone width and a desktop width). Use the project's own tools: its Playwright or browser tests, its dev server and a screenshot tool it already has. Batch the checks in section 5 into one look, fix what it shows, then look again.

When the project has no way to render the page, read the computed styles from the code, and report the rendered check under **Not checked**.

## 5. Craft floor

These checks apply to the built result. The ticket's direction or `DESIGN.md` overrides any of them except a line marked **ban**.

### Verify

- **Contrast**: body and placeholder text at least 4.5:1, large text at least 3:1. Secondary text on a coloured surface is tinted from that hue, never plain grey.
- **States**: hover, focus, active, disabled, loading, error, empty and success, with real content and working controls.
- **Keyboard**: a visible focus ring, a logical tab order, labels on every input and no keyboard traps.
- **Spacing**: tight groups, generous separation, and more space above a heading than below it.
- **Type**: body measure 65 to 75 characters, clear steps in size and weight, and real copy tested at every width with nothing overflowing.
- **Responsive**: no horizontal scroll on a phone, touch targets at least 24 by 24 px (44 by 44 preferred), and layouts that hold when text is enlarged.
- **Theming**: colours come from tokens. When the project has a dark theme, check both themes.
- **Motion**: one purposeful moment rather than effects everywhere, an ease-out curve, and a `prefers-reduced-motion` alternative that still shows the state change.
- **Browser surfaces**: text selection, caret, focus rings, scrollbars and tabular numerals are styled from the palette rather than left as browser defaults.
- **Images**: set aspect ratios so nothing shifts on load, and write useful alt text.
- **Coverage**: every requirement in the ticket is present and findable within seconds.

### Refuse

These are defaults to avoid, not to tone down. Each one is acceptable only when the ticket or `DESIGN.md` asks for it.

- Pages built from same-size cards of icon, heading and text. Cards inside cards, always.
- The hero-metric template: a big number, a small label, supporting stats and an accent.
- **Ban**: a small kicker or eyebrow label above a heading. Let the heading speak.
- Section numbers (01, 02, 03) when the order carries no meaning.
- Gradient text. Emphasis comes from weight or size.
- Glass and blur as decoration.
- A coloured bar down one side of a rounded box. Use a full border, a tint or a leading icon.
- Hard offset shadows (`4px 4px 0`) outside a deliberately neobrutalist look.
- Monospace as a costume for "technical", rather than for code, data or measurements.
- Emoji or Unicode glyphs standing in for icons. Use one icon library or authored SVG, in one stroke weight.
- Light or dark theme picked by category instead of by where and how the screen is used.

## Source

Distilled from pbakaus/impeccable 4.10.0 (Apache-2.0), mainly its craft floor, modes, operate, polish and audit references. The interactive commands, the launcher and its detector are left out, as a subagent cannot ask questions or install tools.
