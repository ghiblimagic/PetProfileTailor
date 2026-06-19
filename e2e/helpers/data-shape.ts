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

export function expectLikeNotificationLeanShape(
  notification: {
    likedBy?: Record<string, unknown> & { _id?: unknown };
    contentId?: Record<string, unknown> & { _id?: unknown };
  },
  label: string,
): void {
  if (notification.likedBy?._id !== undefined) {
    expectStringId(notification.likedBy._id, `${label}.likedBy._id`);
    expectNoVersionKey(notification.likedBy, `${label}.likedBy`);
  }
  if (notification.contentId?._id !== undefined) {
    expectStringId(notification.contentId._id, `${label}.contentId._id`);
    expectNoVersionKey(notification.contentId, `${label}.contentId`);
  }
}

export function expectThankNotificationLeanShape(
  notification: {
    thanksBy?: Record<string, unknown> & { _id?: unknown };
    nameId?: Record<string, unknown> & { _id?: unknown };
    descriptionId?: Record<string, unknown> & { _id?: unknown };
  },
  label: string,
): void {
  if (notification.thanksBy?._id !== undefined) {
    expectStringId(notification.thanksBy._id, `${label}.thanksBy._id`);
    expectNoVersionKey(notification.thanksBy, `${label}.thanksBy`);
  }
  for (const key of ["nameId", "descriptionId"] as const) {
    const content = notification[key];
    if (content?._id !== undefined) {
      expectStringId(content._id, `${label}.${key}._id`);
      expectNoVersionKey(content, `${label}.${key}`);
    }
  }
}
