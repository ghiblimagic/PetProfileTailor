/**
 * react-toastify container for app-wide toasts.
 * Notes: docs/notes/wrappers/layout-wrappers.md
 */
"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return <ToastContainer />;
}
