/**
 * Primary app button — variant flags for color/style.
 * Notes: docs/notes/components/reusable-buttons.md
 */
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  BUTTON_BASE_CLASSES,
  BUTTON_VARIANT_CLASSES,
  HERO_BUTTON_BASE_CLASSES,
  resolveGeneralButtonVariant,
} from "./buttonStyles";

export type GeneralButtonProps = {
  text?: string;
  className?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  subtle?: boolean;
  warning?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  plain?: boolean;
  heroStyle?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  active?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  dataModalToggle?: string;
  ariaLabel?: string;
};

export default function GeneralButton({
  text,
  className,
  onClick,
  subtle,
  warning,
  secondary,
  tertiary,
  plain,
  heroStyle,
  type,
  active = false,
  disabled,
  children,
  dataModalToggle,
  ariaLabel,
}: GeneralButtonProps) {
  // Colors/classes live in buttonStyles.ts, shared with LinkButton — see
  // docs/notes/components/reusable-buttons.md for the rationale.
  const variant = resolveGeneralButtonVariant({
    secondary,
    tertiary,
    plain,
    subtle,
    warning,
    active,
    disabled,
    heroStyle,
  });
  // heroStyle is a full visual reset (its own base classes) for buttons over
  // the landing-page hero image — not designed to combine with the other
  // flags above.
  const baseClasses =
    variant === "hero" ? HERO_BUTTON_BASE_CLASSES : BUTTON_BASE_CLASSES;

  return (
    <button
      className={cn(baseClasses, BUTTON_VARIANT_CLASSES[variant], className)}
      onClick={onClick}
      type={type}
      disabled={disabled}
      data-modal-toggle={dataModalToggle}
      aria-label={ariaLabel}
    >
      <span>{text}</span>
      {children && <span className="flex items-center">{children}</span>}
    </button>
  );
}
