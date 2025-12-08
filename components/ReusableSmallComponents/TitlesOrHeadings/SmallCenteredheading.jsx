import React from "react";

export default function WideCenteredHeader({ heading, level = "3" }) {
  const Tag = `h${level}`;
  return (
    <Tag
      className="text-xl md:text-xl font-semibold py-4 text-center bg-secondary text-subtleWhite
     border-y-2 border-subtleWhite"
    >
      {heading}
    </Tag>
  );
}
