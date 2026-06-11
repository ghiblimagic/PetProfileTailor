/**
 * Pick name vs description categories/tag list for a content type.
 * Notes: docs/notes/context/categories-and-tags.md
 */
import {
  useCategAndTags,
  type CategoryWithTags,
} from "@/context/CategoriesAndTagsContext";
import type { TagOption } from "@/hooks/useTags";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

export type CategoriesForDataType = {
  categoriesWithTags: CategoryWithTags[];
  tagList: TagOption[];
};

const emptyCategories: CategoriesForDataType = {
  categoriesWithTags: [],
  tagList: [],
};

export function useCategoriesForDataType(
  dataType: ContentType | string,
): CategoriesForDataType {
  const { nameCateg, descrCateg, nameTagList, descriptionTagList } =
    useCategAndTags();

  if (dataType === "names") {
    return { categoriesWithTags: nameCateg, tagList: nameTagList };
  }

  if (dataType === "descriptions") {
    return { categoriesWithTags: descrCateg, tagList: descriptionTagList };
  }

  return emptyCategories;
}
