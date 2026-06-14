/**
 * Full-width centered section heading (landing page).
 * Notes: docs/notes/components/reusable-small-components.md
 */
export type WideCenteredHeadingProps = {
  heading: string;
};

export default function WideCenteredHeading({
  heading,
}: WideCenteredHeadingProps) {
  return (
    <h3
      className="text-xl md:text-3xl font-semibold py-4 text-center bg-secondary text-subtleWhite
     border-y-2 border-subtleWhite"
    >
      {heading}
    </h3>
  );
}
