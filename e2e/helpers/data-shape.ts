import { expect } from "@playwright/test";

export function expectStringId(value: unknown, label: string): void {
  expect(typeof value, `${label} should be a string`).toBe("string");
}

export function expectNoVersionKey(
  record: Record<string, unknown>,
  label: string,
): void {
  expect(record.__v, `${label} should not include __v`).toBeUndefined();
}
