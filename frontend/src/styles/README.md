# StockFlow styles

Keep styles in one clear ownership layer to prevent visual drift and override chains.

- `globals.css`: reset, application shell, and generic UI primitives shared by multiple screens.
- `visual-consistency.css`: the semantic color tokens for light/dark themes and shared theme overrides. Add shared colors here as `--sf-*` tokens, then consume them from component styles.
- `accessibility-theme.css`: text scaling and focused accessibility refinements. Avoid using it as a second general theme palette.
- `auth-theme.css`: the signed-out authentication experience only.
- `sidebar-collapse.css`: layout changes required by the collapsible sidebar.
- `settings.css`, `users.css`, and `stock-movements-fix.css`: screen-specific layout and styling only. Do not redefine shared buttons, cards, avatars, badges, or theme colors here.

Before adding a selector, search the existing stylesheets for the class. Reuse an existing shared class or component when the visual behavior is the same. Prefer semantic tokens over hard-coded light/dark colors, and avoid `!important` unless a third-party or inline style makes it necessary.

The stylesheet import order is defined in `src/main.tsx`: base styles first, screen-specific refinements next, and shared theme styles after them so theme tokens take precedence.
