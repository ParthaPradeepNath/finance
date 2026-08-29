import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api.accounts.$post>;
type RequestType = InferRequestType<typeof client.api.accounts.$post>["json"];

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType, { previous: unknown }>({
    mutationFn: async (json) => {
      const response = await client.api.accounts.$post({ json });
      if (!response.ok) throw new Error("Failed to create account");
      return await response.json();
    },
    // Optimistic update — instant feedback, rollback on error (Lighthouse UX)
    onMutate: async (newAccount) => {
      await queryClient.cancelQueries({ queryKey: ["accounts"] });
      const previous = queryClient.getQueryData<unknown>(["accounts"]);
      queryClient.setQueryData(["accounts"], (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return [...old, { id: `optimistic-${Date.now()}`, ...newAccount }];
      });
      return { previous };
    },
    onError: (err, _new, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["accounts"], ctx.previous);
      toast.error(err.message || "Failed to create account");
    },
    onSuccess: () => {
      toast.success("Account created", { description: "Account added to your workspace" });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });

  return mutation;
};
