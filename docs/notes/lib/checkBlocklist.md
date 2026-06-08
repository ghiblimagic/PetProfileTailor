# checkBlocklist

Source: [`lib/checkBlocklist.ts`](../../lib/checkBlocklist.ts)

Word blocklist for user-generated content (names, descriptions, bios, etc.). Consumed by [`utils/api/checkMultipleBlocklists.ts`](../../utils/api/checkMultipleBlocklists.ts), which API routes call before saving.

Lists live in [`data/blockList.js`](../../data/blockList.js).

Input is **`content`** (display text), not `normalizedContent` — the check lowercases and tokenizes at runtime.

## Overview — three passes

`checkBlocklists(input)` runs three passes on lowercased input:

| Pass | List | Rule | Example |
|------|------|------|---------|
| 1 | `exactWordsBlockedEverywhere` | Any **word** in the text matches | `"hello wank"` → blocked (`wank`) |
| 2 | `exactWordsBlocked` | Entire content (if &lt; 100 chars) equals one entry | `"butt"` → blocked; `"fluffy butt"` → allowed |
| 3 | `blocklistSubstrings` (Trie) | Blocklisted substring appears anywhere | `"vaginal content"` → blocked (`vagina`) |

Returns `BlocklistResult`: `{ allowed, blockedBy, type }` where `type` is `"banned-everywhere"`, `"exact-name"`, `"substring"`, or `null` when allowed.

### Pass 1 — `exactWordsBlockedEverywhere`

- Set lookups: **O(1)** per word.
- Split input on whitespace; if any token is in the set, reject.
- The exact word `"coon"` is on the **exact-name** list, not everywhere — so `"raccoon"` stays allowed (substring / word-token rules do not treat `coon` inside longer words as a standalone banned token).
- Entries like `"wank"` in `exactWordsBlockedEverywhere` are rejected **anywhere** they appear as a word: `"hello wank world"` → `{ type: "banned-everywhere" }`.

### Pass 2 — `exactWordsBlocked` (exact-name)

- We do **not** want the entire content to be === a blocklisted word, but the word **is** allowed when it is not alone.
- **`butt`** alone → rejected (`exact-name`).
- **`fluffy butt`** → allowed (more than one token / not an exact full-string match).
- Only runs when `normalizedInput.length < 100` (long bios skip this pass).

### Pass 3 — `blocklistSubstrings` (Trie)

- Applies to descriptions and names (and any field routed through `checkMultipleBlocklists`).
- `"vagina"` used anywhere — `"vaginas"`, `"vaginal"`, etc. — can trigger rejection via substring match.
- Returns the matched substring as `blockedBy` so you know which blocklist entry fired.

---

## Trie implementation (substring blocklist)

### Why a Trie

Instead of checking each substring against the string individually (**O(n × m)** where *n* = string length and *m* = number of substrings), a Trie lets us scan the string once while checking all blocklist substrings.

- **Trie search:** O(n) per character of input — very fast even for thousands of substring entries.
- Works really well when:
  - You have thousands of blocklist items.
  - You have long input strings (like 2000 chars).

**In short:**

1. Insert all substrings into the Trie (once at module load).
2. Scan the string character by character, following Trie paths.
3. Stop immediately if a match is found.

### `TrieNode`

Each `TrieNode` represents a single character:

- `children` — holds the next character nodes; each key is a character, value is another `TrieNode`.
- `isEnd` — marks the end of a valid blocklist substring.

### `insert(word)`

Adds a word (substring) into the Trie:

```text
insert("cat"):

root
  └─ c
     └─ a
        └─ t  (isEnd)
```

Walkthrough:

1. Start at `root`. For each character in `word.toLowerCase()`:
2. If `root` has no child `"c"` for `"cat"`, create a `"c"` node.
3. Move down: `node = node.children[char]` and repeat (`node = node.children["c"]`, then `"a"`, then `"t"`).
4. **Important:** reassign `node` down the tree — do not keep writing at `this.root`, or the trie stays flat instead of nested:

```text
Wrong (flat):

root
 ├─ a
 ├─ t
 └─ c

Right (nested):

root
 └─ c
    └─ a
       └─ t
```

5. After the last character, set `node.isEnd = true`.

### `searchInString(str)`

1. Lowercase the input.
2. For each start index `i`, set `node = root`, `j = i`.
3. While `j < str.length` and `node.children[str[j]]` exists, walk down (`node = node.children[str[j]]`).
4. If `node.isEnd`, return `str.slice(i, j + 1)` — the substring that triggered rejection.
5. If no match from any start position, return `null`.

The Trie is built once:

```typescript
const substringTrie = new Trie();
blocklistSubstrings.forEach((item) => substringTrie.insert(item));
```

Sets for passes 1 and 2 are also built once at module load (lowercased for case-insensitive matching).

---

## Source (annotated)

Full implementation from [`lib/checkBlocklist.ts`](../../lib/checkBlocklist.ts) with original inline comments from `checkBlocklist.js`.

```typescript
import {
  exactWordsBlocked,
  exactWordsBlockedEverywhere,
  blocklistSubstrings,
} from "@/data/blockList";

export type BlocklistType = "banned-everywhere" | "exact-name" | "substring";

export type BlocklistResult =
  | { allowed: true; blockedBy: null; type: null }
  | { allowed: false; blockedBy: string; type: BlocklistType };

// ------------------------------
// TRIE IMPLEMENTATION (for substring blocklist)
// ------------------------------
// Set lookups: O(1) per word.
// Trie search: O(n) per character of input, which is very fast even for thousands of substring entries.
// Efficient for large substring lists (Trie is O(n) per input character).
//
// Why Trie is efficient here:
//   Instead of checking each substring against the string individually (O(n*m) where n is string length
//   and m is number of substrings), a Trie allows us to scan the string once while efficiently
//   checking for all blocklist substrings.
// Works really well when:
//   - You have thousands of blocklist items.
//   - You have long input strings (like 2000 chars).
//
// In short:
//   1. Insert all substrings into the Trie.
//   2. Scan the string character by character, following Trie paths.
//   3. Stop immediately if a match is found.

class TrieNode {
  // Each TrieNode represents a single character.
  children: Record<string, TrieNode> = {}; // key = character, value = another TrieNode
  isEnd = false; // Marks the end of a word / valid substring
}

class Trie {
  private root = new TrieNode();

  // insert("cat")
  insert(word: string): void {
    // Adds a word (substring) into the Trie
    let node = this.root;
    for (const char of word.toLowerCase()) {
      // We iterate over each character.
      // root has no child "c" for "cat"? create a "c" node.
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      // If the character doesn't exist yet in the current node's children, we create a new TrieNode.

      node = node.children[char];
      // Move down to the next node (node = node.children[char]) and repeat.
      // aka node = node.children["c"], then ["a"], then ["t"].
      // Otherwise we'd just keep overwriting the children at the root.
      // Replaces the variable "node" with node.children[char].
      //
      //   root
      //     └─ c
      //        └─ a
      //           └─ t
      //
      // If it stayed "this.root" we'd just keep overwriting the root so the trie would be flat, not nested:
      //
      //   root
      //    ├─ a
      //    ├─ t
      //    └─ c
    }
    // After finishing the word, we mark isEnd = true to signify the end of a valid substring.
    node.isEnd = true;
  }

  searchInString(str: string): string | null {
    const lower = str.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      // We scan the string starting from each character (i index)
      let node = this.root;
      let j = i;
      while (j < lower.length && node.children[lower[j]]) {
        // From i, we traverse down the Trie (j index) as long as there's a matching child node.
        node = node.children[lower[j]];
        if (node.isEnd) {
          // If we reach a node where isEnd === true, we found a blocklist substring inside the string.
          // Returns the substring found (so you know which block triggered the rejection).
          return lower.slice(i, j + 1);
        }
        j++;
      }
    }
    return null;
  }
}

// Build Trie once for substrings
const substringTrie = new Trie();
blocklistSubstrings.forEach((item) => substringTrie.insert(item));

// ------------------------------
// SINGLE-PASS CHECK FUNCTION
// ------------------------------

// Lowercased at build time so matching aligns with normalized input
const exactWordBlocklistSet = new Set(
  exactWordsBlocked.map((w) => w.toLowerCase()),
);
const blockedEverywhereSet = new Set(
  exactWordsBlockedEverywhere.map((w) => w.toLowerCase()),
);

export function checkBlocklists(input: string): BlocklistResult {
  // value is content not normalizedContent
  const normalizedInput = input.toLowerCase();

  // 1. Check forbidden everywhere first
  // the exact word "coon" will always be rejected, but racoon will be accepted
  const words = normalizedInput.split(/\s+/);
  for (const word of words) {
    if (blockedEverywhereSet.has(word)) {
      return { allowed: false, blockedBy: word, type: "banned-everywhere" };
    }
  }

  // 2. Check exact-word blocklist
  // we don't want the entire content to be === this exact word, but the word is allowed if its not by itself.
  // butt will be rejected, but fluffy butt won't
  if (normalizedInput.length < 100) {
    if (exactWordBlocklistSet.has(normalizedInput)) {
      return {
        allowed: false,
        blockedBy: normalizedInput,
        type: "exact-name",
      };
    }
  }

  // 3. Check substring blocklist (applies to descriptions and names)
  // "vagina" used anywhere "vaginas" ect will lead to a rejection
  const substringMatch = substringTrie.searchInString(normalizedInput);
  if (substringMatch) {
    return { allowed: false, blockedBy: substringMatch, type: "substring" };
  }

  return { allowed: true, blockedBy: null, type: null };
}
```

---

## Usage examples

```typescript
import { checkBlocklists } from "@/lib/checkBlocklist";

checkBlocklists("fluffy butt");
// { allowed: true, blockedBy: null, type: null }

checkBlocklists("butt");
// { allowed: false, blockedBy: "butt", type: "exact-name" }

checkBlocklists("hello wank world");
// { allowed: false, blockedBy: "wank", type: "banned-everywhere" }

checkBlocklists("vaginal content");
// { allowed: false, blockedBy: "vagina", type: "substring" }

checkBlocklists("raccoon");
// { allowed: true, blockedBy: null, type: null }
```

Original dev notes also referenced `checkBlocklists("this is chinky")` blocking on `"chink"` — that depends on which list contains `chink` and whether it appears as a word or substring; see [`lib/checkBlocklist.test.ts`](../../lib/checkBlocklist.test.ts) for current expected behavior against [`data/blockList.js`](../../data/blockList.js).

---

## Related files

- [`utils/api/checkMultipleBlocklists.ts`](../../utils/api/checkMultipleBlocklists.ts) — multi-field wrapper + 403 response
- [`utils/api/bannedWordsMessage.ts`](../../utils/api/bannedWordsMessage.ts) — user-facing message from `type`
- [`lib/checkBlocklist.test.ts`](../../lib/checkBlocklist.test.ts) — unit tests for all three passes
