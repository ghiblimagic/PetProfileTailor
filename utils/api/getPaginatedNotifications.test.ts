import { parseNotificationPagination } from "./getPaginatedNotifications";

describe("parseNotificationPagination", () => {
  it("defaults to page 1 and limit 25", () => {
    expect(parseNotificationPagination(new URLSearchParams())).toEqual({
      page: 1,
      limit: 25,
    });
  });

  it("parses page and limit from query string", () => {
    const params = new URLSearchParams("page=3&limit=10");
    expect(parseNotificationPagination(params)).toEqual({
      page: 3,
      limit: 10,
    });
  });

  it("falls back when values are invalid", () => {
    const params = new URLSearchParams("page=abc&limit=");
    expect(parseNotificationPagination(params)).toEqual({
      page: 1,
      limit: 25,
    });
  });
});
