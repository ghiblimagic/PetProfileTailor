import type { ReactNode } from "react";

export type ContainerForLikeShareFlagProps = {
  children: ReactNode;
};

/** Shared chrome for like / share / thanks / flag actions on listing rows. */
export default function ContainerForLikeShareFlag({
  children,
}: ContainerForLikeShareFlagProps) {
  return (
    <div className="text-center  rounded-2xl w-14 h-9 flex justify-center items-center hover:border-blue-700 hover:bg-blue-500 ">
      {children}
    </div>
  );
}
