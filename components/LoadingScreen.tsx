/**
 * Full-area loading placeholder for root layout Suspense fallback.
 * Notes: docs/notes/components/loading-screen.md
 */
export default function LoadingScreen() {
  return (
    <div className="flex justify-center items-center text-lg font-medium text-subtleWhite h-full">
      <span> Loading </span>
      <div className="w-12 h-12 ml-3 border-4 border-t-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );
}
