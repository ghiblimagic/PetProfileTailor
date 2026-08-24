/**
 * Shared button styling — single source of truth for both `GeneralButton`
 * (a real `<button>`) and `LinkButton` (a `next/link` styled to look like
 * one), so the two stop drifting into separate palettes independently.
 * Notes: docs/notes/components/reusable-buttons.md
 */

/** Shared base for every regular (non-hero, non-nav-link) button shape. */
export const BUTTON_BASE_CLASSES =
  "font-bold my-3 py-1 px-4 rounded-2xl text-base";

/**
 * `heroStyle` is a full visual reset (dark navy pill over the landing-page
 * hero image) — a different shape, not just a color swap, so it doesn't
 * build on `BUTTON_BASE_CLASSES`.
 */
export const HERO_BUTTON_BASE_CLASSES =
  "btn w-full mt-2 rounded-full tracking-widest";

export type ButtonVariant =
  | "default"
  | "secondary"
  | "tertiary"
  | "plain"
  | "subtle"
  | "warning"
  | "active"
  | "disabled"
  | "hero"
  | "basicLink";

/**
 * Colors drawn from the design-system tokens (`primary`, `secondary`,
 * `subtleBackground`, `subtleBorder`, `subtleWhite`) plus the accent/outline
 * set added alongside them in tailwind.config.js (`buttonAccent`,
 * `accentFill`, `accentFillBorder`, `outlineBorder`, `warningHover`,
 * `disabledBg`, `disabledText`). All text/background pairs meet WCAG AA
 * (4.5:1); outline borders that are a button's only affordance meet 3:1 —
 * see docs/notes/components/reusable-buttons.md for the checked ratios.
 *
 * Note: the accent token is named `buttonAccent`, not `accent` — a plain
 * `accent` here would collide with (and lose to) tailwind.config.js's
 * pre-existing shadcn `accent: { DEFAULT: "hsl(var(--accent))", ... }`
 * token, which resolves to a near-white gray. Don't rename this back to
 * `accent` without removing that other token first.
 */
export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default:
    "bg-subtleBackground border-[1.5px] border-subtleBorder text-subtleWhite hover:bg-accentFill hover:border-accentFillBorder hover:text-subtleWhite",
  secondary:
    "bg-secondary text-white hover:text-white border-[1.5px] border-outlineBorder hover:border-accentFillBorder hover:bg-accentFill font-black  focus:ring-white py-2",

  tertiary:
    "bg-transparent border-b-[1.5px] border-outlineBorder shadow-none text-subtleWhite hover:border-b-buttonAccent",
  plain:
    "bg-transparent border-[1.5px] border-transparent text-subtleWhite hover:bg-accentFill hover:border-accentFillBorder hover:text-subtleWhite",
  subtle:
    "bg-subtleBackground/40 border-[1.5px] border-outlineBorder text-subtleWhite hover:bg-buttonAccent/40 hover:border-buttonAccent",
  warning:
    "bg-red-800 border-[1.5px] border-outlineBorder text-subtleWhite hover:bg-warningHover",
  active:
    "bg-subtleWhite border-2 border-buttonAccent text-primary hover:bg-accentFill hover:border-accentFillBorder hover:text-subtleWhite",
  disabled:
    "bg-disabledBg border-[1.5px] border-outlineBorder text-disabledText cursor-not-allowed",
  hero: "bg-secondary text-white hover:text-white border-[1.5px] border-outlineBorder hover:border-accentFillBorder hover:bg-accentFill font-black text-sm h-10 focus:ring-white",
  // LinkButton's underline nav-link look — no fill, just a bottom-border
  // reveal on hover. Already token-only (subtleWhite), so recentralizing it
  // here doesn't change how it looks.
  basicLink:
    "text-subtleWhite border-b-2 border-transparent hover:border-subtleWhite rounded-none shadow-none",
};

export type GeneralButtonVariantFlags = {
  secondary?: boolean;
  tertiary?: boolean;
  plain?: boolean;
  subtle?: boolean;
  warning?: boolean;
  active?: boolean;
  disabled?: boolean;
  heroStyle?: boolean;
};

/**
 * Reproduces GeneralButton's original sequential-if precedence exactly:
 * flags are applied in this order and a later true flag overrides an
 * earlier one, so combining flags keeps behaving the way it always did.
 */
export function resolveGeneralButtonVariant({
  secondary,
  tertiary,
  plain,
  subtle,
  warning,
  active,
  disabled,
  heroStyle,
}: GeneralButtonVariantFlags): ButtonVariant {
  let variant: ButtonVariant = "default";
  if (secondary) variant = "secondary";
  if (tertiary) variant = "tertiary";
  if (plain) variant = "plain";
  if (subtle) variant = "subtle";
  if (warning) variant = "warning";
  if (active && !disabled) variant = "active";
  if (disabled) variant = "disabled";
  if (heroStyle) variant = "hero";
  return variant;
}

export type LinkButtonVariantFlags = {
  basic?: boolean;
  defaultStyle?: boolean;
  secondary?: boolean;
  subtle?: boolean;
  warning?: boolean;
  active?: boolean;
  disabled?: boolean;
};

/**
 * Same idea for LinkButton, with LinkButton's own flag set and precedence
 * order. Returns `null` when no flag is set — LinkButton (unlike
 * GeneralButton) renders with zero variant classes in that case, and real
 * call sites depend on that to stay fully custom-styled via `className`.
 */
export function resolveLinkButtonVariant({
  basic,
  defaultStyle,
  secondary,
  subtle,
  warning,
  active,
  disabled,
}: LinkButtonVariantFlags): ButtonVariant | null {
  let variant: ButtonVariant | null = null;
  if (basic) variant = "basicLink";
  if (defaultStyle) variant = "default";
  if (secondary) variant = "secondary";
  if (subtle) variant = "subtle";
  if (warning) variant = "warning";
  if (active && !disabled) variant = "active";
  if (disabled) variant = "disabled";
  return variant;
}
