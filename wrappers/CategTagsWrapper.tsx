/**
 * Client wrapper — hydrates CategoriesAndTagsProvider from root layout.
 * Notes: docs/notes/context/categories-and-tags.md
 */
"use client";

import type { ReactNode } from "react";
import {
  CategoriesAndTagsProvider,
  type CategoryWithTags,
} from "@/context/CategoriesAndTagsContext";

export type CategTagsWrapperProps = {
  nameCateg?: CategoryWithTags[];
  descrCateg?: CategoryWithTags[];
  children: ReactNode;
};

export default function CategTagsWrapper({
  nameCateg,
  descrCateg,
  children,
}: CategTagsWrapperProps) {
  return (
    <CategoriesAndTagsProvider
      nameCateg={nameCateg}
      descrCateg={descrCateg}
    >
      {children}
    </CategoriesAndTagsProvider>
  );
}
