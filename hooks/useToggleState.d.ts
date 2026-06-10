export type UseToggleStateOptions<TRollback = unknown> = {
  initialActive: boolean;
  apiUrl: string;
  body: Record<string, unknown>;
  onApplyOptimistic?: (newLiked: boolean) => TRollback;
  onRollback?: (rollbackData: TRollback) => void;
};

export function useToggleState<TRollback = unknown>(
  options: UseToggleStateOptions<TRollback>,
): {
  active: boolean;
  isProcessing: boolean;
  toggle: () => Promise<void>;
};
