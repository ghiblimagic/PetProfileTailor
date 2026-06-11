# mongoDataCleanup

**Source:** [`utils/mongoDataCleanup.ts`](../../../utils/mongoDataCleanup.ts)

Shared helper used across pages and API routes. Runs `.lean().exec()` on a Mongoose query, then recursively cleans the result for JSON/client use.

## Purpose

- Stringify `ObjectId` values (including arrays of ObjectIds)
- Remove `__v`, because Mongoose adds a version key on every document.
- Keep `Date` instances as `Date` (Next.js serializes them when passing to client components)

## Mongoose `populate` side-effect imports

When a query uses `.populate()` on a `ref`, the referenced model must be registered before the query runs. Import the model module for its side effect (do not bind a variable):

```ts
import "@/models/NameTag";
import "@/models/User";
```

Avoid `import X from "..."; void X;` — side-effect-only imports state the intent and are not tree-shaken.

## Flow

leanWithStrings(query)
  │
  ├── query.lean().exec()        -- fires the DB query, returns plain objects
  │
  ├── result is array?           -- e.g. find()
  │     └── deepTransform each doc
  │
  ├── result is single object?   -- e.g. findOne()
  │     └── deepTransform the doc
  │
  └── result is null?            -- nothing found
        └── return null

deepTransform(obj)
  │
  ├── ObjectId?    → stringify it
  ├── Date?        → leave it alone
  ├── Array?       → deepTransform each element
  ├── Object?      → skip __v, deepTransform each value
  └── Primitive?   → leave it alone

### Why recursion?

MongoDB documents are arbitrarily nested — arrays of objects containing more arrays, refs that are ObjectIds, subdocuments, etc. You don't know the shape ahead of time. Any non-recursive approach would either:

1. Only handle one level deep (misses nested docs)
2. Require you to manually specify every path to transform (brittle, breaks when schema changes)

### Why not `JSON.parse(JSON.stringify(doc))`?

Popular but wrong here. It drops `Date` objects (converts them to strings), and ObjectIds become objects like `{ id: "..." }` not clean strings.

### Why not Mongoose `.toObject()` / `.toJSON()` on the schema?

You can configure transforms on the schema to auto-strip `__v` and stringify ObjectIds, but that only works on full Mongoose documents, not `.lean()` results. You would scatter transform logic across schema definitions instead of one place.

### `Why does every function but deepTransform use <TReturn> instead of <T>`

Because TReturn is the whole query result shape — like User[] or Post. TReturn only matters in leanWithStrings where you care about the final assembled result matching what the query was supposed to return.

Meanwhile deepTransform is getting called recursively on individual pieces — a single document, then a nested object inside it, then a single field value inside that. By the time you're three levels deep, TReturn is completely irrelevant. So deepTransform uses its own generic T instead.

```
function deepTransform<T>(obj: T): MongoCleanupResult<T>
```
This just means "whatever you pass me, I'll return the cleaned version of that specific thing." It stays generic and reusable rather than being tied to any particular query shape.

### `Why is there no interface spelling out exactly what <TReturn> and <T>s shapes are?`

Because we are using Mongoose, whose models are already typed. So TypeScript just threads it through. Aka TypeScript infers it from the query you pass in. Mongoose's Query type is already generic — when you write something like:

```
User.findOne({ name: "John" })
```
Mongoose already knows that returns a Query<User | null, User> because the User model was defined with that type. So when you pass that query into leanWithStrings:

```
leanWithStrings(User.findOne({ name: "John" }))
```
TypeScript looks at the query, sees it's a Query<User | null, User>, and automatically infers TReturn = User | null. You never have to spell it out.

So TReturn isn't something you define — it's something TypeScript reads off the query object you pass in. The shape comes from wherever you defined your Mongoose model:

```
interface IUser {
  name: string;
  _id: mongoose.Types.ObjectId;
}

const User = mongoose.model<IUser>("User", userSchema);
// User.findOne() now returns Query<IUser | null, IUser>
// so TReturn becomes IUser | null automatically
```

## Type: `MongoCleanupResult<T>`
```
type OmitV<T> = T extends object ? Omit<T, "__v"> : T;

export type MongoCleanupResult<T> = T extends mongoose.Types.ObjectId
  ? string
  : T extends mongoose.Types.ObjectId[]
    ? string[]
    : T extends Date
      ? Date
      : T extends readonly (infer U)[]
        ? MongoCleanupResult<U>[]
        : T extends object
          ? {
              [K in keyof OmitV<T>]: MongoCleanupResult<OmitV<T>[K]>;
            }
          : T;
```

Pure compile-time type — no runtime effect. It just tells the compiler what shape to expect coming out of deepTransform. Maps lean query result shapes to JSON-safe values (ObjectId → string, 
etc.).

### `OmitV<T>`

If `T` is an object, strip `__v`. Used inside `MongoCleanupResult` because Mongoose adds a version key on every document.

**`export type MongoCleanupResult<T>:`** Defines a generic type that takes any type T and figures out what it looks like after transformation.

**T extends mongoose.Types.ObjectId** EXTENDS used as a Conditional type check not class/interface inheritance

**Extends** = Is T compatible with/assignable to X?

full line: "if the type T that was passed in is an ObjectId, produce the type string, otherwise move to the next check."

### Conditional type walkthrough

`T extends X ? A : B` is a **conditional type check**, not class inheritance.

| Branch | Meaning |
|--------|---------|
| 1. `T extends ObjectId` → `string` | Single ObjectId becomes string |
| 2. `T extends ObjectId[]` → `string[]` | Must come **before** the general array branch below, otherwise that would catch it first. |
| 3. `T extends Date` → `Date` | Dates unchanged at runtime |
| 4. `T extends readonly (infer U)[]` → `MongoCleanupResult<U>[]` | Else if T is any other array. `infer U` extracts element type (e.g. `Post[]` → `U` is `Post`) |
| 5. `T extends object` → mapped type | Rebuild object with transformed values; `OmitV<T>` strips `__v` from keys |
| 6. else → `T` | Primitives, return it unchanged |

#### Branch 4 more detail:

```
  T extends readonly (infer U)[] ? MongoCleanupResult<U>[]
```
Else if T is any other array — the readonly makes it match both regular and readonly arrays.

infer U is a TypeScript feature that allows you to extract the type of the element of an array. (e.g. if T is Post[], then U is Post).

#### Branch 5 more detail:
```
{
     [K in keyof OmitV<T>]: MongoCleanupResult<OmitV<T>[K]>;
}

```
Else if T is any other object, rebuild it as a new object type where:

1. `OmitV<T>` strips __v from the keys first

2. For each key K in the object, recursively transform the value with `MongoCleanupResult<OmitV<T>[K]>`

3. The result is a new object type where each value is transformed according to the MongoCleanupResult type.


## Function:`deepTransform`

Recursively walks a lean query result:

1. **ObjectId** → `toString()` via `instanceof mongoose.Types.ObjectId`
2. **Date** → unchanged
3. **Array** → map each item through `deepTransform`
4. **Plain object** → skip `__v`, transform each value

```
function deepTransform<T>(obj: T): MongoCleanupResult<T> {
  if (obj instanceof mongoose.Types.ObjectId) {
    return obj.toString() as MongoCleanupResult<T>;
  }

  if (obj instanceof Date) {
    return obj as MongoCleanupResult<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepTransform(item)) as MongoCleanupResult<T>;
  }

  if (obj && typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === "__v") {
        continue;
      }
      newObj[key] = deepTransform(value);
    }
    return newObj as MongoCleanupResult<T>;
  }

  return obj as MongoCleanupResult<T>;
}
```

### Check 1 for ObjectId: 
```
  if (obj instanceof mongoose.Types.ObjectId) {
    return obj.toString() as MongoCleanupResult<T>;
  }
```
**instanceof** checks if an object was created from a specific class/   constructor

**Means:** "was item created by the mongoose.Types.ObjectId constructor?"

**Avoid duplicated logic:** ObjectIds get caught at the top of the next deepTransform call regardless of whether they're standalone or inside an array, because arrays will just recursively call deepTransform on each item.

So the later array branch can stay dumb and generic, they just call `deepTransform` on each item.

**When does this first branch pass?** ObjectId check should essentially never fire on the first call because at that point obj is the whole document object not a standalone objectId.

It only fires when the recursion drills down and passes the raw ObjectId value itself as obj.

### Check 4 for Objects: 

**Summary** : Temporary working object built in a loop. TypeScript can't infer the final shape until the loop finishes, so we cast at the end: `newObj as MongoCleanupResult<T>`.

```
  if (obj && typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === "__v") {
        continue;
      }
      newObj[key] = deepTransform(value);
    }
    return newObj as MongoCleanupResult<T>;
  }
```
#### Record<string, unknown>

```
 const newObj: Record<string, unknown> = {};
```
**`Record<string, unknown>`**  declare empty object with whose keys are string and values can be anything

 basically: { [key: string]: unknown }.

 The reason it can't be more specific is that this is a temporary   "working" object being built up inside the loop. You're adding   transformed values one by one, and TypeScript can't infer the final   shape until you're done. At the end you cast the whole thing with:

 ```
 for (const [key, value] of Object.entries(obj)) {
    if (key === "__v") continue;
    newObj[key] = deepTransform(value);
  }
 ```
 So after the loop newObj is a brand new clean object with __v gone and all values transformed. Then it gets returned.

 #### `newObj as MongoCleanupResult<T>`

 ```
 return newObj as MongoCleanupResult<T>;
 ```
 is telling typescript  "trust me, this now matches the correct output type, so don't give me any errors about it."

## Type: `LeanQuery` (test mock)
```
type LeanQuery<TReturn> = {
  lean(): { exec(): Promise<TReturn> };
};
```
**`LeanQuery`:** Minimal `{ lean().exec() }` shape so unit tests can mock queries without a real Mongoose query.


## Function: `leanWithStrings`

**Summary** 
basically "run this query against the database, return plain objects instead of Mongoose documents, and wait for the data to come back."
Runs query.lean().exec(), then deepTransform on the result.

 * .lean() returns plain objects (no Mongoose document wrappers). Without this you'd get back Mongoose documents which have a ton of extra methods and properties attached (save(), populate(), etc.) that you don't need and can't serialize.

 * .exec() Actually fires the query against the database and returns a Promise. Without calling .exec(), the query just sits there — Mongoose uses lazy execution, meaning building a query and running it are two separate steps.

 Returns `null` when the query finds nothing (e.g. `findOne` with no match).

```
export async function leanWithStrings<TReturn>(
  query: Query<TReturn, unknown> | LeanQuery<TReturn>,
): Promise<MongoCleanupResult<TReturn> | null> {
  const result = await query.lean().exec();

  if (Array.isArray(result)) {
    return result.map((doc) =>
      deepTransform(doc),
    ) as MongoCleanupResult<TReturn>;
  }

  if (result) {
    return deepTransform(result) as MongoCleanupResult<TReturn>;
  }

  return null;
}
```
### `Query<TReturn, unknown>`

- First generic: what the query resolves to
- Second generic (`unknown`): Mongoose raw document type — not needed here

`leanWithStrings` accepts either a real `Query` or a `LeanQuery` mock.

**Type casts on return:** Mongoose's `lean().exec()` return types don't align with our recursive `MongoCleanupResult<T>`. Explicit casts ("as") on return paths are intentional. The `as MongoCleanupResult<TReturn>` is just you telling TypeScript "I know this looks mismatched to you, but the runtime transformation makes it correct — stop complaining."

TypeScript can't automatically figure out that after running deepTransform the shapes are equivalent, so without the as cast it would throw a type error even though the code is correct.

It's one of the few cases where as is justified rather than being a code smell, because the type system genuinely can't verify recursive type transformations like this automatically.

## Related

- Tests: [`utils/mongoDataCleanup.test.ts`](../../../utils/mongoDataCleanup.test.ts)
- Manual verification: [`TESTING.md`](../../../TESTING.md) § DB + mongoDataCleanup
