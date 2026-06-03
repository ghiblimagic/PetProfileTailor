export default async function fetcher(
  ...args: Parameters<typeof fetch>
): Promise<unknown> {
  const res = await fetch(...args);
  return res.json();
}
