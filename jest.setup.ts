/** Deep design notes: docs/notes/jest-setup.md */
import { TextDecoder, TextEncoder } from "util";
import "@testing-library/jest-dom";

Object.assign(global, { TextDecoder, TextEncoder });
