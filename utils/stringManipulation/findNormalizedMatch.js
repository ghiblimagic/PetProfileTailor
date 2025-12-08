import normalizeString from "./normalizeString";

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ############ Find Partial ################

// ex: will return docs if the string "Sephiroth is an excitable pup" appears at the very start of the document

// Pro:

// anchored at the start the regex can use the B-tree index for speed, but then it needs to have the EXACT same starting point
// Performance is roughly O(log N), like a normal indexed query.
// Memory/CPU usage is low because MongoDB doesn’t scan the full collection.
// free
// should work for most cases of users copy and pasting what they find

// Con:
// its still needs to be an exact match. Although I've removed most common differences (extra spaces, punctation, casing), it could still return with a false negative if someone adds an extra the ect.
// however Regex with $regex isn’t as index-friendly as direct equality
// no risk of extra cost like mongodb atlas search for fuzzy searching

export async function findStartNormalized(Model, content) {
  const normalizedString = normalizeString(content).slice(0, 400);

  console.log("this is normalizedString", normalizedString);

  return await Model.findOne({
    normalizedContent: {
      $regex: new RegExp("^" + escapeRegex(normalizedString), "i"),
    }, // anchored to the start ^ to take advantage of the index
  }).populate({
    path: "createdBy",
    select: ["name", "profileName", "profileImage"],
  });
}

// best to avoid using this one, with a non-anchored regex

// Con:
// MongoDB must scan every document in the collection, applying the regex to the full field.
// Performance is roughly O(N × M), where:
// N = number of documents
// M = length of the field being scanned
// Even if your field is 400 characters, with thousands or tens of thousands of docs, it can get noticeably slow.

// Pro: will find partial matches, instead of being stuck at the front
export async function findPartialMatch(Model, content) {
  const normalizedString = normalizeString(content).slice(0, 400);

  return await Model.find({
    normalizedContent: {
      $regex: escapeRegex(normalizedString),
      $options: "i",
    },
  }).populate({
    path: "createdBy",
    select: ["name", "profileName", "profileImage"],
  });
}

// ############ Find Exact ################
// ex: will return docs only if they EXACTLY match "butt"
// more reliable way to find duplicates since theres no spaces in the normalizedContent field

// .findOne() because it stops scanning after the first match, unliked .find()
//Slightly less memory + CPU overhead.
export async function findExactNormalized(Model, content) {
  const normalizedString = normalizeString(content);
  return await Model.findOne({
    normalizedContent: normalizedString,
  }).populate({
    path: "createdBy",
    select: ["name", "profileName", "profileImage"],
  });
}
