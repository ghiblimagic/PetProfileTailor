import normalizeString from "./normalizeString";
import {
  escapeRegex,
  findExactNormalized,
  findPartialMatch,
  findStartNormalized,
} from "./findNormalizedMatch";

function mockModel<T>(result: T) {
  const exec = vi.fn().mockResolvedValue(result);
  const lean = vi.fn().mockReturnValue({ exec });
  const populate = vi.fn().mockReturnValue({ lean, populate: vi.fn().mockReturnValue({ lean }) });
  return {
    findOne: vi.fn().mockReturnValue({ populate }),
    find: vi.fn().mockReturnValue({ populate }),
    populate,
    lean,
    exec,
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
    expect(result).toEqual(doc);
  });
});

describe("findStartNormalized", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    expect(result).toEqual(docs);
  });
});
