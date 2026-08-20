import type { ReactNode } from "react";

export type ContainerForLikeShareFlagProps = {
  children: ReactNode;
  /** Per-action hover accent — defaults to the original generic blue. */
  hoverColor?: "like" | "share" | "thanks";
};

const hoverColorClasses: Record<string, string> = {
  like: "hover:bg-red-500/20 hover:text-red-400",
  share: "hover:bg-violet-500/20 hover:text-violet-300",
  thanks: "hover:bg-emerald-500/20 hover:text-emerald-300",
};

/** Shared chrome for like / share / thanks / flag actions on listing rows. */
export default function ContainerForLikeShareFlag({
  children,
  hoverColor,
}: ContainerForLikeShareFlagProps) {
  const hoverClasses = hoverColor
    ? hoverColorClasses[hoverColor]
    : "hover:border-blue-700 hover:bg-blue-500";

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 transition-colors ${hoverClasses}`}
    >
      {children}
    </div>
  );
}
