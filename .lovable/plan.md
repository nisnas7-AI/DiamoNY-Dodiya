

## Relocate 4C's Guide Links from Brand Settings to Content Management

### What's Changing

The `FourCsLinksManager` component will be moved from the Brand Settings tab into the Site Content Manager tab. The component is already fully self-contained (own query, own save button, own state) — no decoupling needed.

### Steps

1. **Remove from BrandSettingsManager** (`src/components/admin/BrandSettingsManager.tsx`)
   - Delete the `<Card>` wrapper at lines 179–183 that renders `<FourCsLinksManager />`
   - Remove the `FourCsLinksManager` import (line 13)

2. **Add to SiteContentManager** (`src/components/admin/SiteContentManager.tsx`)
   - Import `FourCsLinksManager`
   - Append a dedicated `<Card>` at the bottom of the component (after the main content card, ~line 548) containing `<FourCsLinksManager />`
   - The card will have a `CardHeader` with title "קישורי מדריך 4C's" for visual consistency

### Why This Is Simple

The `FourCsLinksManager` already has its own independent save logic — it writes directly to `site_content` with its own "שמור קישורים" button. It was never coupled to the Brand Settings save flow. This is purely a UI relocation with no logic changes.

### Files Modified

- `src/components/admin/BrandSettingsManager.tsx` — remove FourCsLinksManager import and render
- `src/components/admin/SiteContentManager.tsx` — import and render FourCsLinksManager in a new card

