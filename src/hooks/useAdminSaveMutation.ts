import { useEffect, useRef, useState } from "react";
import {
  type QueryClient,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

const SILENT_ABORT_ERROR = "__ADMIN_SAVE_ABORTED__";
const TIMEOUT_ABORT_REASON = "admin-save-timeout";
const SECURITY_BLOCK_MESSAGE = "Security Block: Please remove script tags and only enter the raw JSON code.";

type AdminSaveMutationOptions<TData, TVariables, TContext> = Omit<
  UseMutationOptions<TData, Error, TVariables, TContext>,
  "mutationFn" | "onError" | "onSuccess"
> & {
  mutationFn: (variables: TVariables, signal: AbortSignal) => Promise<TData>;
  queryKeysToInvalidate?: QueryKey[];
  successMessage?: string;
  errorMessage?: string | ((error: Error) => string);
  timeoutMs?: number;
  optimisticUpdate?: (
    queryClient: QueryClient,
    variables: TVariables,
  ) => Array<{ queryKey: QueryKey; previousData: unknown }> | void;
  onSuccess?: UseMutationOptions<TData, Error, TVariables, TContext>["onSuccess"];
  onError?: UseMutationOptions<TData, Error, TVariables, TContext>["onError"];
};

export function useAdminSaveMutation<TData = void, TVariables = void, TContext = unknown>({
  mutationFn,
  queryKeysToInvalidate = [],
  successMessage,
  errorMessage,
  timeoutMs = 5000,
  optimisticUpdate,
  onSuccess,
  onError,
  onSettled,
  ...rest
}: AdminSaveMutationOptions<TData, TVariables, TContext>) {
  const queryClient = useQueryClient();
  const activeControllerRef = useRef<AbortController | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      activeControllerRef.current?.abort("admin-save-unmount");
      activeControllerRef.current = null;
      setIsSaving(false);
    };
  }, []);

  const mutation = useMutation<TData, Error, TVariables, TContext>({
    ...rest,
    onMutate: async (variables) => {
      await Promise.all(
        queryKeysToInvalidate.map((queryKey) => queryClient.cancelQueries({ queryKey })),
      );

      const rollbackEntries = optimisticUpdate?.(queryClient, variables) ?? [];
      const userContext = await rest.onMutate?.(variables);

      return {
        ...(typeof userContext === "object" && userContext !== null ? userContext : {}),
        __adminRollbackEntries: rollbackEntries,
      } as TContext;
    },
    mutationFn: async (variables) => {
      activeControllerRef.current?.abort("admin-save-replaced");
      setIsSaving(true);

      const controller = new AbortController();
      activeControllerRef.current = controller;

      const timeoutId = globalThis.setTimeout(() => {
        controller.abort(TIMEOUT_ABORT_REASON);
      }, timeoutMs);

      try {
        return await mutationFn(variables, controller.signal);
      } catch (error) {
        if (controller.signal.aborted) {
          if (controller.signal.reason === TIMEOUT_ABORT_REASON) {
            throw new Error(`הפעולה חרגה מזמן ההמתנה (${Math.ceil(timeoutMs / 1000)} שניות). נסה שוב.`);
          }

          throw new Error(SILENT_ABORT_ERROR);
        }

        throw error instanceof Error ? error : new Error("שגיאה לא צפויה בשמירה");
      } finally {
        globalThis.clearTimeout(timeoutId);
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
        }
        setIsSaving(false);
      }
    },
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        toast.success(successMessage);
      }

      void Promise.all(
        queryKeysToInvalidate.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey, refetchType: "active" }),
        ),
      );

      void onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      rollbackOptimisticUpdates(queryClient, context);

      if (error.message === SILENT_ABORT_ERROR) {
        return;
      }

      const message =
        typeof errorMessage === "function"
          ? errorMessage(error)
          : errorMessage || error.message || "שגיאה בשמירה";

      const resolvedMessage = isSecurityBlockError(error.message)
        ? SECURITY_BLOCK_MESSAGE
        : controllerMessageIsTimeout(error.message)
          ? "System Busy - Please Retry"
          : message;

      toast.error(resolvedMessage);
      void onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      setIsSaving(false);

      if (error?.message === SILENT_ABORT_ERROR) {
        return;
      }

      void onSettled?.(data, error, variables, context);
    },
  });

  return {
    ...mutation,
    isPending: isSaving,
    isSaving,
  };
}

function rollbackOptimisticUpdates(queryClient: QueryClient, context: unknown) {
  if (!context || typeof context !== "object" || !("__adminRollbackEntries" in context)) {
    return;
  }

  const rollbackEntries = (context as { __adminRollbackEntries?: Array<{ queryKey: QueryKey; previousData: unknown }> }).__adminRollbackEntries;

  rollbackEntries?.forEach(({ queryKey, previousData }) => {
    queryClient.setQueryData(queryKey, previousData);
  });
}

function controllerMessageIsTimeout(message?: string) {
  return Boolean(message?.includes("זמן ההמתנה") || message?.includes("Please Retry"));
}

function isSecurityBlockError(message?: string) {
  if (!message) return false;

  const normalized = message.toLowerCase();

  return (
    normalized.includes("unexpected token <") ||
    normalized.includes("non-json") ||
    normalized.includes("<html") ||
    normalized.includes("script tags") ||
    normalized.includes("raw json code")
  );
}