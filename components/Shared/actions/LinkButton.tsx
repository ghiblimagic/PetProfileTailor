/**
 * Next.js Link styled like GeneralButton.
 * Notes: docs/notes/components/reusable-buttons.md
 */
"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  BUTTON_BASE_CLASSES,
  BUTTON_VARIANT_CLASSES,
  resolveLinkButtonVariant,
} from "./buttonStyles";

export type LinkButtonProps = {
  href: ComponentProps<typeof Link>["href"];
  className?: string;
  text?: string;
  defaultStyle?: boolean;
  basic?: boolean;
  secondary?: boolean;
  subtle?: boolean;
  icon?: ReactNode;
  warning?: boolean;
  active?: boolean;
  disabled?: boolean;
};

export default function LinkButton({
  href,
  className,
  text,
  defaultStyle,
  basic,
  secondary,
  subtle,
  icon,
  warning,
  active,
  disabled,
}: LinkButtonProps) {
  // Colors/classes live in buttonStyles.ts, shared with GeneralButton — see
  // docs/notes/components/reusable-buttons.md for the rationale. No flag set
  // → no variant classes, matching the previous behavior: several call sites
  // rely on LinkButton rendering unstyled and fully driven by `className`.
  const variant = resolveLinkButtonVariant({
    basic,
    defaultStyle,
    secondary,
    subtle,
    warning,
    active,
    disabled,
  });

  return (
    <Link
      href={href}
      className={cn(
        variant && BUTTON_BASE_CLASSES,
        variant && BUTTON_VARIANT_CLASSES[variant],
        className,
      )}
    >
      {icon && <>{icon}</>} {/* render icon if provided */}
      {text}
    </Link>
  );
}
