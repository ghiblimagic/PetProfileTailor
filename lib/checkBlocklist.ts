/**
 * Design notes (Trie, three-pass rules): docs/notes/lib/checkBlocklist.md
 */
import {
  exactWordsBlocked,
  exactWordsBlockedEverywhere,
  blocklistSubstrings,
} from "@/data/blockList";

export type BlocklistType = "banned-everywhere" | "exact-name" | "substring";

export type BlocklistResult =
  | { allowed: true; blockedBy: null; type: null }
  | { allowed: false; blockedBy: string; type: BlocklistType };

class TrieNode {
  children: Record<string, TrieNode> = {};
  isEnd = false;
}

class Trie {
  private root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
  }

  searchInString(str: string): string | null {
    const lower = str.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      let node = this.root;
      let j = i;
      while (j < lower.length && node.children[lower[j]]) {
        node = node.children[lower[j]];
        if (node.isEnd) {
          return lower.slice(i, j + 1);
        }
        j++;
      }
    }
    return null;
  }
}

const substringTrie = new Trie();
blocklistSubstrings.forEach((item) => substringTrie.insert(item));

const exactWordBlocklistSet = new Set(
  exactWordsBlocked.map((w) => w.toLowerCase()),
);
const blockedEverywhereSet = new Set(
  exactWordsBlockedEverywhere.map((w) => w.toLowerCase()),
);

export function checkBlocklists(input: string): BlocklistResult {
  const normalizedInput = input.toLowerCase();

  const words = normalizedInput.split(/\s+/);
  for (const word of words) {
    if (blockedEverywhereSet.has(word)) {
      return { allowed: false, blockedBy: word, type: "banned-everywhere" };
    }
  }

  if (normalizedInput.length < 100) {
    if (exactWordBlocklistSet.has(normalizedInput)) {
      return {
        allowed: false,
        blockedBy: normalizedInput,
        type: "exact-name",
      };
    }
  }

  const substringMatch = substringTrie.searchInString(normalizedInput);
  if (substringMatch) {
    return { allowed: false, blockedBy: substringMatch, type: "substring" };
  }

  return { allowed: true, blockedBy: null, type: null };
}
