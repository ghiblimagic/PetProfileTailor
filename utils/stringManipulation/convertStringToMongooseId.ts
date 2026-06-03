import mongoose, { Types } from "mongoose";

export default function convertToObjectId(
  input: string | string[],
): Types.ObjectId | Types.ObjectId[] {
  if (Array.isArray(input)) {
    return input.map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId string: ${id}`);
      }
      return new mongoose.Types.ObjectId(id);
    });
  }

  if (!mongoose.Types.ObjectId.isValid(input)) {
    throw new Error(`Invalid ObjectId string: ${input}`);
  }

  return new mongoose.Types.ObjectId(input);
}
