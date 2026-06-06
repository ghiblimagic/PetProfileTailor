/**
 * @jest-environment node
 */
import mongoose from "mongoose";
import { leanWithStrings } from "./mongoDataCleanup";

// Stub the lean().exec() chain so we can test transforms without a DB.
function mockQuery<T>(result: T) {
  return {
    lean: () => ({
      exec: async () => result,
    }),
  };
}

describe("leanWithStrings", () => {
  it("returns null when the query finds nothing", async () => {
    await expect(leanWithStrings(mockQuery(null))).resolves.toBeNull();
  });

  it("stringifies _id and removes __v on a single document", async () => {
    const id = new mongoose.Types.ObjectId();
    const result = await leanWithStrings(
      mockQuery({ _id: id, __v: 0, name: "Ada" }),
    );

    expect(result).toEqual({ _id: id.toString(), name: "Ada" });
  });

  it("transforms an array of documents", async () => {
    const id1 = new mongoose.Types.ObjectId();
    const id2 = new mongoose.Types.ObjectId();

    const result = await leanWithStrings(
      mockQuery([
        { _id: id1, __v: 1, name: "One" },
        { _id: id2, __v: 2, name: "Two" },
      ]),
    );

    expect(result).toEqual([
      { _id: id1.toString(), name: "One" },
      { _id: id2.toString(), name: "Two" },
    ]);
  });

  it("stringifies arrays of ObjectIds and nested ObjectIds", async () => {
    const docId = new mongoose.Types.ObjectId();
    const tagId = new mongoose.Types.ObjectId();
    const nestedId = new mongoose.Types.ObjectId();
    const createdAt = new Date("2024-01-15T12:00:00.000Z");

    const result = await leanWithStrings(
      mockQuery({
        _id: docId,
        __v: 0,
        tags: [tagId],
        author: { _id: nestedId },
        createdAt,
      }),
    );

    expect(result).toEqual({
      _id: docId.toString(),
      tags: [tagId.toString()],
      author: { _id: nestedId.toString() },
      createdAt,
    });
  });
});
