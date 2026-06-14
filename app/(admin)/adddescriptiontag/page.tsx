/**
 * Admin: add a description tag and attach to categories.
 * Notes: docs/notes/app/admin-route-group.md
 */
"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import GeneralButton from "@components/shared/actions/GeneralButton";
import DisabledButton from "@components/shared/actions/DisabledButton";
import { useSession } from "next-auth/react";
import { useCategoriesForDataType } from "@/hooks/useCategoriesForDataType";
import { useAdmin } from "@/context/AdminContext";
import StyledInput from "@components/FormComponents/StyledInput";
import StyledSelect from "@/components/FormComponents/StyledSelect";
import type { CategoryWithTags } from "@/context/CategoriesAndTagsContext";

export default function AddDescriptionTag() {
  const { isAdmin } = useAdmin();
  const { categoriesWithTags } = useCategoriesForDataType("descriptions");
  const { data: session } = useSession();
  const [newDescriptionTag, setNewDescriptionTag] = useState("");
  const [categoriesChosen, setCategoriesChosen] = useState<CategoryWithTags[]>(
    [],
  );

  function handleDescriptionTagSubmission(e: FormEvent) {
    e.preventDefault();

    if (!session?.user?.id) return;

    const descriptionTagSubmission = {
      tag: newDescriptionTag,
      createdBy: session.user.id,
    };
    // console.log(descriptionTagSubmission);
    void axios
      .post("/api/descriptiontag", descriptionTagSubmission)
      .then((response) => {
        const newDescriptionTagId = response.data._id as string;
        addTagToCategories(newDescriptionTagId);
      })
      .catch((error) => {
        console.log("this is error", error);
      });
  }

  function addTagToCategories(newDescriptionTagId: string) {
    try {
      void axios.put("/api/descriptioncategory/edittags", {
        newtagid: newDescriptionTagId,
        categoriesToUpdate: categoriesChosen.map((option) => option._id),
      });
    } catch (err) {
      console.log("tag not added to categories :(", err);
    }
  }

  return (
    <div className=" mx-auto flex justify-center text-center">
      <form onSubmit={handleDescriptionTagSubmission}>
        <StyledInput
          type="text"
          id="categoryInput"
          className="text-secondary"
          label="enter a description tag"
          onChange={(e) => setNewDescriptionTag(e.target.value.toLowerCase())}
        />

        {/* TAG AREA */}
        <label
          className="font-bold block mt-4 text-white"
          htmlFor="descriptionTags"
        >
          Categories
        </label>

        <StyledSelect
          id="descriptionTags"
          options={categoriesWithTags}
          value={categoriesChosen}
          onChange={setCategoriesChosen}
          labelProperty="category"
          valueProperty="_id"
        />

        {session && isAdmin ? (
          <GeneralButton
            text="Submit tag"
            type="submit"
            className="ml-2"
          />
        ) : (
          <div>
            <DisabledButton text="Submit tag" />
            <p className="text-yellow-300 bg-red-800 pl-2 py-2 mx-auto border-2 border-yellow-300 mt-2">
              To protect data quality, only users with special permissions can
              submit tags
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
