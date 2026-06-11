import {
  checkIfValidContentType,
  isDescriptionsContentType,
} from "./checkIfValidContentType";

describe("checkIfValidContentType", () => {
  it("returns true for valid content types", () => {
    expect(checkIfValidContentType("names")).toBe(true);
    expect(checkIfValidContentType("descriptions")).toBe(true);
  });

  it("isDescriptionsContentType matches canonical and legacy values", () => {
    expect(isDescriptionsContentType("descriptions")).toBe(true);
    expect(isDescriptionsContentType("description")).toBe(true);
    expect(isDescriptionsContentType("names")).toBe(false);
  });

  it("throws with status 400 for invalid content types", () => {
    expect(() => checkIfValidContentType("invalid")).toThrow(
      "Invalid contentType: invalid",
    );

    try {
      checkIfValidContentType("bad");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error & { status?: number }).status).toBe(400);
    }
  });
});
