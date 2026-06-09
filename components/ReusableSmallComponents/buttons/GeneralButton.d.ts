import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

export type GeneralButtonProps = {
  text?: string;
  className?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  subtle?: boolean;
  warning?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  plain?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  active?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  dataModalToggle?: string;
  ariaLabel?: string;
};

declare function GeneralButton(props: GeneralButtonProps): ReactElement;

export default GeneralButton;
