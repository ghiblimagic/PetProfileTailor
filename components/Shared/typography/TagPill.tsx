/**
 * "#tag" pill — shared visual token for tag chips sitewide.
 * Notes: docs/notes/components/form-components.md
 */
import type { ReactNode } from "react";

// Exported (not just baked into the component below) so call sites that
// can't use <TagPill> directly — e.g. TagsSelectAndCheatSheet.tsx's
// react-select MultiValue override, which has to wire up react-select's
// own remove-button props onto its own element structure — can still
// apply the exact same classes instead of drifting into a near-duplicate.
export const tagPillClassName =
  "bg-white/10 text-subtleWhite text-xs px-3 py-1 rounded-full min-w-0 max-w-full break-words";

export type TagPillProps = {
  children: ReactNode;
  className?: string;
};

/** Read-only "#tag" pill. Consumers: ContentListing.tsx, addingdescription.tsx tag preview. */
export default function TagPill({ children, className = "" }: TagPillProps) {
  return (
    <span className={`${tagPillClassName} ${className}`}>#{children}</span>
  );
}
