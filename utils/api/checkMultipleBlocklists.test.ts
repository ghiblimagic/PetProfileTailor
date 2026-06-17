import {
  checkMultipleFieldsBlocklist,
  respondIfBlocked,
} from "./checkMultipleBlocklists";

describe("respondIfBlocked", () => {
  it("includes blockedBy in 403 JSON body", async () => {
    const blockResult = checkMultipleFieldsBlocklist([
      { value: "contains wank phrase", fieldName: "bio" },
    ]);
    expect(blockResult).not.toBeNull();

    const response = respondIfBlocked(blockResult);
    expect(response?.status).toBe(403);

    const body = (await response!.json()) as {
      message: string;
      blockedBy: string;
    };
    expect(body.blockedBy).toBe("wank");
    expect(body.message).toMatch(/bio/i);
  });
});
