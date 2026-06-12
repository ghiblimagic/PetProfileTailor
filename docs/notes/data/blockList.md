# blockList

Source: [`data/blockList.ts`](../../../data/blockList.ts)

Static word lists consumed by [`lib/checkBlocklist.ts`](../../../lib/checkBlocklist.ts). No runtime logic in this file — edit lists here when moderation rules change.

## Exports

| Export | Used in pass |
|--------|----------------|
| `exactWordsBlockedEverywhere` | Pass 1 — any **word** token in input |
| `exactWordsBlocked` | Pass 2 — whole string match when input &lt; 100 chars |
| `blocklistSubstrings` | Pass 3 — Trie substring search |

See [checkBlocklist.md](../lib/checkBlocklist.md) for behavior, examples, and Trie details.

## Special behavior

- Lists are plain `string[]` — matching is always case-insensitive in `checkBlocklists`.
- `"genitals"` is on the substring list with comment: *since congenital would be blocked with genital* (shorter `genital` is not a substring entry).
- `"coon"` is on **exact-name** only, not everywhere — so `"raccoon"` is not blocked as a word token.
