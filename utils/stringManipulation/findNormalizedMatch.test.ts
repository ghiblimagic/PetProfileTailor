import normalizeString from "./normalizeString";
import {
  escapeRegex,
  findExactNormalized,
  findPartialMatch,
  findStartNormalized,
} from "./findNormalizedMatch";

function mockModel<T>(result: T) {
  const populate = jest.fn().mockResolvedValue(result);
  return {
    findOne: jest.fn().mockReturnValue({ populate }),
    find: jest.fn().mockReturnValue({ populate }),
    populate,
  };
}

describe("escapeRegex", () => {
  it("escapes regex metacharacters", () => {
    expect(escapeRegex("a.b*c?")).toBe("a\\.b\\*c\\?");
    expect(escapeRegex("path[1]")).toBe("path\\[1\\]");
  });
});

describe("findExactNormalized", () => {
  it("queries by fully normalized content", async () => {
    const doc = { normalizedContent: "helloworld" };
    const model = mockModel(doc);

    const result = await findExactNormalized(model as never, "  Hello, World!  ");

    expect(model.findOne).toHaveBeenCalledWith({
      normalizedContent: normalizeString("  Hello, World!  "),
    });
    expect(model.populate).toHaveBeenCalledWith({
      path: "createdBy",
      select: ["name", "profileName", "profileImage"],
    });
    expect(result).toBe(doc);
  });
});

describe("findStartNormalized", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses an anchored regex on the first 400 normalized chars", async () => {
    const model = mockModel(null);
    const content = "Sephiroth is an excitable pup";

    await findStartNormalized(model as never, content);

    const normalized = normalizeString(content).slice(0, 400);
    const call = model.findOne.mock.calls[0][0] as {
      normalizedContent: { $regex: RegExp };
    };

    expect(call.normalizedContent.$regex.source).toBe(
      "^" + escapeRegex(normalized),
    );
    expect(call.normalizedContent.$regex.flags).toBe("i");
  });
});

describe("findPartialMatch", () => {
  it("uses a non-anchored case-insensitive regex", async () => {
    const docs = [{ normalizedContent: "fluffybutt" }];
    const model = mockModel(docs);

    const result = await findPartialMatch(model as never, "fluffy butt");

    const normalized = normalizeString("fluffy butt").slice(0, 400);
    expect(model.find).toHaveBeenCalledWith({
      normalizedContent: {
        $regex: escapeRegex(normalized),
        $options: "i",
      },
    });
    expect(result).toBe(docs);
  });
});
