/**
 * Generic migration helper for renaming or adding fields in MongoDB using Mongoose.
 *
 * @param {import("mongoose").Model} model - The Mongoose model to update
 * @param {string|null} oldField - The old field name (null if creating a brand new field)
 * @param {string} newField - The new field name
 * @param {boolean} removeOld - Whether to remove the old field
 * @param {*} defaultValue - Value to use if oldField doesn't exist
 */
export async function migrateField(
  model,
  oldField,
  newField,
  removeOld = true,
  defaultValue = null,
) {
  console.log(`Migrating ${model.modelName}: ${oldField} → ${newField}`);

  try {
    let result;

    if (oldField) {
      // Step 1: Copy values from oldField → newField if newField doesn't exist
      result = await model.updateMany(
        { [oldField]: { $exists: true }, [newField]: { $exists: false } },
        [{ $set: { [newField]: `$${oldField}` } }],
      );
      console.log(
        `Copied ${oldField} → ${newField} in ${result.modifiedCount} docs`,
      );
    }

    // Step 2: Add defaultValue if specified and newField missing
    if (defaultValue !== null) {
      result = await model.updateMany(
        { [newField]: { $exists: false } },
        { $set: { [newField]: defaultValue } },
      );
      console.log(
        `Set default for ${newField} in ${result.modifiedCount} docs`,
      );
    }

    // Step 3: Optionally remove old field
    if (oldField && removeOld) {
      const cleanup = await model.updateMany(
        { [oldField]: { $exists: true } },
        { $unset: { [oldField]: "" } },
      );
      console.log(` Removed ${oldField} from ${cleanup.modifiedCount} docs`);
    }

    // Step 4: Verify a sample
    const check = await model.findOne({});
    console.log(" Sample document after migration:", check);
  } catch (err) {
    console.error(` Migration failed for ${model.modelName}:`, err);
  }
}
