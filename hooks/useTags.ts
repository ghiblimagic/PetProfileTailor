/**
 * Selected tags state for react-select + cheat-sheet checkboxes.
 * Notes: docs/notes/hooks/useTags.md
 */
import { useState, useMemo, useCallback } from "react";
import type { MultiValue } from "react-select";

export type TagOption = {
  label: string;
  value: string;
};

export type TagCheckboxChange = {
  id: string;
  label: string;
  checked: boolean;
};

export function useTags(initial: TagOption[] = []) {
  const [tagsToSubmit, setTagsToSubmit] = useState<TagOption[]>(initial);

  const tagIds = useMemo(
    () => tagsToSubmit.map((tag) => tag.value),
    [tagsToSubmit],
  );

  const handleSelectChange = useCallback((selected: MultiValue<TagOption>) => {
    if (!selected || selected.length === 0) {
      setTagsToSubmit([]);
      return;
    }

    setTagsToSubmit((prev) => {
      const prevIds = prev.map((t) => t.value);
      const newTags = [...prev];

      selected.forEach((s) => {
        if (!prevIds.includes(s.value)) {
          newTags.push(s);
        }
      });

      return newTags.filter((t) => selected.some((s) => s.value === t.value));
    });
  }, []);

  const clearTags = useCallback(() => setTagsToSubmit([]), []);

  const handleCheckboxChange = useCallback(
    ({ id, label, checked }: TagCheckboxChange) => {
      setTagsToSubmit((prev) => {
        if (checked) {
          if (!prev.some((t) => t.value === id)) {
            return [...prev, { label, value: id }];
          }
          return prev;
        }
        return prev.filter((t) => t.value !== id);
      });
    },
    [],
  );

  return {
    tagsToSubmit,
    tagIds,
    handleSelectChange,
    handleCheckboxChange,
    clearTags,
  };
}
