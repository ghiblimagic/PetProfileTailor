/**
 * @vitest-environment node
 */
import mongoose from "mongoose";
import convertToObjectId from "./convertStringToMongooseId";

describe("convertToObjectId", () => {
  it("converts a valid hex string to ObjectId", () => {
    const hex = new mongoose.Types.ObjectId().toString();
    const result = convertToObjectId(hex);

    expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
    expect((result as mongoose.Types.ObjectId).toString()).toBe(hex);
  });

  it("throws when the string is not a valid ObjectId", () => {
    expect(() => convertToObjectId("not-a-valid-id")).toThrow(
      /Invalid ObjectId string: not-a-valid-id/,
    );
  });

  it("maps an array of valid ids", () => {
    const hexIds = [
      new mongoose.Types.ObjectId().toString(),
      new mongoose.Types.ObjectId().toString(),
    ];

    const result = convertToObjectId(hexIds) as mongoose.Types.ObjectId[];

    expect(result).toHaveLength(2);
    expect(result[0].toString()).toBe(hexIds[0]);
    expect(result[1].toString()).toBe(hexIds[1]);
  });

  it("throws when any array entry is invalid", () => {
    const valid = new mongoose.Types.ObjectId().toString();

    expect(() => convertToObjectId([valid, "bad-id"])).toThrow(
      /Invalid ObjectId string: bad-id/,
    );
  });
});
