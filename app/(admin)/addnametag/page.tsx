/**
 * Admin: add a name tag and attach to categories.
 * Notes: docs/notes/app/admin-route-group.md
 */
"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import DisabledButton from "@components/Shared/actions/DisabledButton";
import StyledInput from "@components/FormComponents/StyledInput";
import StyledSelect from "@components/FormComponents/StyledSelect";
import { useCategoriesForDataType } from "@/hooks/useCategoriesForDataType";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/context/AdminContext";
import type { CategoryWithTags } from "@/context/CategoriesAndTagsContext";

export default function AddNameTag() {
  const { isAdmin } = useAdmin();
  const { data: session } = useSession();
  const { categoriesWithTags } = useCategoriesForDataType("names");
  const [newNameTag, setNewNameTag] = useState("");
  const [categoriesChosen, setCategoriesChosen] = useState<CategoryWithTags[]>(
    [],
  );

  function handleNameTagSubmission(e: FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;

    const nameTagSubmission = {
      tag: newNameTag,
      createdBy: session.user.id,
    };

    void axios
      .post("/api/nametag", nameTagSubmission)
      .then((response) => {
        const newNameTagId = response.data._id as string;
        addTagToCategories(newNameTagId);
      })
      .catch((error) => {
        console.log("this is error", error);
      });
  }

  function addTagToCategories(newNameTagId: string) {
    try {
      void axios.put("/api/namecategories/edittags", {
        newtagid: newNameTagId,
        categoriesToUpdate: categoriesChosen,
      });
    } catch (err) {
      console.log("tag not added to categories :(", err);
    }
  }

  return (
    <div className=" mx-auto flex justify-center text-center">
      <form
        className="mx-2"
        onSubmit={handleNameTagSubmission}
      >
        <StyledInput
          type="text"
          id="categoryInput"
          className="text-secondary"
          onChange={(e) => setNewNameTag(e.target.value)}
          label="Enter a name tag to add"
        />

        {/* TAG AREA */}
        <label
          className="font-bold block mt-4 text-white"
          htmlFor="categoryTags"
        >
          Categories
        </label>

        <StyledSelect
          id="categoryTags"
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
            onClick={handleNameTagSubmission}
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
