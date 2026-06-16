import {
  duplicateDescriptionConflict,
  shouldCheckDescriptionDuplicate,
} from "./descriptionDuplicateCheck";

describe("shouldCheckDescriptionDuplicate", () => {
  it("checks on create when no existing content", () => {
    expect(shouldCheckDescriptionDuplicate("Fluffy lover", null)).toBe(true);
  });

  it("skips when content is unchanged (case-insensitive)", () => {
    expect(
      shouldCheckDescriptionDuplicate("hello world", "hello world"),
    ).toBe(false);
    expect(shouldCheckDescriptionDuplicate("Hello World", "hello world")).toBe(
      false,
    );
    expect(
      shouldCheckDescriptionDuplicate(
        "E2E Seeded Description",
        "E2E Seeded Description",
      ),
    ).toBe(false);
  });

  it("checks when content differs from existing", () => {
    expect(
      shouldCheckDescriptionDuplicate("new text", "old text"),
    ).toBe(true);
  });

  it("skips empty content", () => {
    expect(shouldCheckDescriptionDuplicate("", "something")).toBe(false);
  });
});

describe("duplicateDescriptionConflict", () => {
  it("returns null when no duplicate document", () => {
    expect(duplicateDescriptionConflict(null)).toBeNull();
  });

  it("returns 409 payload shape when duplicate exists", () => {
    const existing = { _id: "abc", content: "taken" };
    expect(duplicateDescriptionConflict(existing)).toEqual({
      message: "Ruh Roh! This description already exists!",
      existingDescription: existing,
    });
  });
});
