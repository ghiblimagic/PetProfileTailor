/** Deep design notes: docs/notes/vitest-setup.md */
import { TextDecoder, TextEncoder } from "util";
import "@testing-library/jest-dom/vitest";

Object.assign(global, { TextDecoder, TextEncoder });
