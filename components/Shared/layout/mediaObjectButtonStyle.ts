/**
 * Maps MediaObjectLeft/MediaObjectRight's `buttonStyle` prop to the
 * LinkButton flag it should set. Centralized so the two components — which
 * render an otherwise-identical LinkButton — can't drift into recognizing
 * different `buttonStyle` values.
 *
 * `buttonStyle` accepts exactly LinkButton's own flag names (`defaultStyle`,
 * `basic`, `secondary`, `subtle`, `warning`, `active`, `disabled`) — no
 * renaming, so this stays a straight passthrough and there's nothing to
 * keep in sync by hand: a flag LinkButton gains is usable here immediately.
 * Notes: docs/notes/components/media-object.md
 */
import type { LinkButtonVariantFlags } from "@components/Shared/actions/buttonStyles";

export type MediaObjectButtonStyle = keyof LinkButtonVariantFlags;

export function mediaObjectLinkButtonFlags(
  buttonStyle: MediaObjectButtonStyle = "defaultStyle",
): LinkButtonVariantFlags {
  return { [buttonStyle]: true };
}
