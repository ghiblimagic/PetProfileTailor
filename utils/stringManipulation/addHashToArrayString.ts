type TagRef = { tag: string };

type ContentWithTags = {
  tags: TagRef[];
};

export default function addHashToArrayString(content: ContentWithTags): string {
  return content.tags.map((tag) => `#${tag.tag}`).join(" ");
}
