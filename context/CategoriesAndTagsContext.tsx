/**
 * Server-hydrated name/description categories + flat tag lists for selects.
 * Notes: docs/notes/context/categories-and-tags.md
 */
"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { TagOption } from "@/hooks/useTags";

export type CategoryTag = {
  _id: string;
  tag: string;
};

export type CategoryWithTags = {
  _id: string;
  category: string;
  tags: CategoryTag[];
  order?: number;
};

export type CategoriesAndTagsContextValue = {
  descrCateg: CategoryWithTags[];
  nameCateg: CategoryWithTags[];
  nameTagList: TagOption[];
  descriptionTagList: TagOption[];
};

const CategoriesAndTagsContext =
  createContext<CategoriesAndTagsContextValue | null>(null);

export function useCategAndTags(): CategoriesAndTagsContextValue {
  const context = useContext(CategoriesAndTagsContext);
  if (!context) {
    throw new Error(
      "useCategAndTags must be used within a CategoriesAndTagsProvider",
    );
  }
  return context;
}

function dedupeTagOptions(tags: TagOption[]): TagOption[] {
  return Array.from(new Map(tags.map((tag) => [tag.value, tag])).values());
}

function buildTagList(categories: CategoryWithTags[]): TagOption[] {
  const allTags = categories.flatMap((cat) =>
    cat.tags.map((tag) => ({ label: tag.tag, value: tag._id })),
  );
  return dedupeTagOptions(allTags);
}

export function CategoriesAndTagsProvider({
  children,
  descrCateg = [],
  nameCateg = [],
}: {
  children: ReactNode;
  descrCateg?: CategoryWithTags[];
  nameCateg?: CategoryWithTags[];
}) {
  const nameTagList = useMemo(() => buildTagList(nameCateg), [nameCateg]);

  const descriptionTagList = useMemo(
    () => buildTagList(descrCateg),
    [descrCateg],
  );

  return (
    <CategoriesAndTagsContext.Provider
      value={{ descrCateg, nameCateg, nameTagList, descriptionTagList }}
    >
      {children}
    </CategoriesAndTagsContext.Provider>
  );
}
