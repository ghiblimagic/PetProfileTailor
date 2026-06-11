/**
 * “Keep text” checkbox on add-name / add-description forms.
 * Notes: docs/notes/components/form-components.md
 */
import StyledCheckbox from "../FormComponents/StyledCheckbox";

export type PreserveTextAfterSubmissionProps = {
  setDoNotClear: (value: boolean) => void;
  doNotClear: boolean;
};

export default function PreserveTextAfterSubmission({
  setDoNotClear,
  doNotClear,
}: PreserveTextAfterSubmissionProps) {
  return (
    <div className="mt-8 mx-auto">
      <h6 className="text-lg mb-2"> Entering lots of similar content?</h6>
      <p>
        {" "}
        Click this checkbox to preserve the text and tags after you submit.
      </p>
      <div className="flex justify-center mt-4">
        <StyledCheckbox
          label="Keep text"
          checked={doNotClear}
          onChange={(e) => setDoNotClear(e.target.checked)}
          value="do not clear"
        />
      </div>
    </div>
  );
}
