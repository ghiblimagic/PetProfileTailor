/**
 * Banner shown when a signed-out user hits a gated action.
 * Notes: docs/notes/components/ui/small-ui-components.md
 */
export type MustLoginMessageProps = {
  text: string;
};

export default function MustLoginMessage({ text }: MustLoginMessageProps) {
  return (
    <div className="bg-red-900 p-2 text-subtleWhite font-bold border-2 border-yellow-300 text-center my-2 max-w-2xl mx-auto rounded-2xl">
      {`To avoid spam, users must sign in to ${text}`}
    </div>
  );
}
