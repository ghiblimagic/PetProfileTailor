import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3000";
const VUS = Number(__ENV.VUS || 10);
const IS_SMOKE_TEST = __ENV.SMOKE === "1";
const MAX_VUS = 100;

let baseUrl;
const localUrlMatch =
  /^http:\/\/(localhost|127\.0\.0\.1)(?::(\d+))?\/?$/i.exec(BASE_URL);
const port =
  localUrlMatch && localUrlMatch[2] !== undefined
    ? Number(localUrlMatch[2])
    : undefined;

if (
  !localUrlMatch ||
  (port !== undefined && (!Number.isInteger(port) || port > 65535))
) {
  throw new Error(
    `Invalid BASE_URL (${BASE_URL}). Use http://localhost:3000 or http://127.0.0.1:3000.`
  );
}
baseUrl = `http://${localUrlMatch[1].toLowerCase()}${
  port === undefined || port === 80 ? "" : `:${port}`
}`;

if (!Number.isInteger(VUS) || VUS < 1 || VUS > MAX_VUS) {
  throw new Error(`VUS must be an integer between 1 and ${MAX_VUS}.`);
}

export const options = {
  stages: IS_SMOKE_TEST
    ? [
        { duration: "5s", target: VUS },
        { duration: "5s", target: 0 },
      ]
    : [
        { duration: "30s", target: VUS },
        { duration: "1m", target: VUS },
        { duration: "15s", target: 0 },
      ],
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:names_swr}": ["p(95)<500"],
    "http_req_duration{endpoint:descriptions_swr}": ["p(95)<500"],
  },
};

function requestListing(endpoint, page, caseId) {
  const response = http.get(`${baseUrl}/api/${endpoint}/swr?page=${page}`, {
    tags: {
      endpoint: endpoint === "names" ? "names_swr" : "descriptions_swr",
      page: String(page),
      case_id: caseId,
    },
  });
  const payload = response.json();
  const hasDataArray =
    payload !== null &&
    typeof payload === "object" &&
    Array.isArray(payload.data);

  check(
    response,
    {
      [`${caseId} status is 200`]: (res) => res.status === 200,
      [`${caseId} has paginated listing shape`]: () =>
        hasDataArray &&
        Number.isInteger(payload.currentPage) &&
        Number.isInteger(payload.totalDocs) &&
        Number.isInteger(payload.totalPagesInDatabase),
      [`${caseId} page matches request and is non-empty`]: () =>
        hasDataArray && payload.currentPage === page && payload.data.length > 0,
      [`${caseId} page contains at most 50 records`]: () =>
        hasDataArray && payload.data.length <= 50,
      [`${caseId} first record has a string id and no version key`]: () =>
        hasDataArray &&
        payload.data.length > 0 &&
        typeof payload.data[0]._id === "string" &&
        !Object.prototype.hasOwnProperty.call(payload.data[0], "__v"),
    },
    { endpoint, page: String(page), case_id: caseId }
  );
}

export default function () {
  const page = __ITER % 2 === 0 ? 1 : 10;

  requestListing("names", page, page === 1 ? "PERF-API-001" : "PERF-API-002");
  requestListing(
    "description",
    page,
    page === 1 ? "PERF-API-003" : "PERF-API-004"
  );

  sleep(1);
}
