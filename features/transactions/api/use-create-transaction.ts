import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.transactions.$post>;
type RequestType = InferRequestType<
  typeof client.api.transactions.$post
>["json"];

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType, { prevTx: unknown; prevSum: unknown }>({
    mutationFn: async (json) => {
      const response = await client.api.transactions.$post({ json });
      if (!response.ok) throw new Error("Failed to create transaction");
      return await response.json();
    },
    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: ["transactions"] });
      await queryClient.cancelQueries({ queryKey: ["summary"] });
      const prevTx = queryClient.getQueryData<unknown>(["transactions"]);
      const prevSum = queryClient.getQueryData<unknown>(["summary"]);
      queryClient.setQueryData(["transactions"], (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return [{ id: `optimistic-${Date.now()}`, ...newTx, date: newTx.date || new Date().toISOString() }, ...old];
      });
      return { prevTx, prevSum };
    },
    onError: (err, _new, ctx) => {
      if (ctx?.prevTx) queryClient.setQueryData(["transactions"], ctx.prevTx);
      if (ctx?.prevSum) queryClient.setQueryData(["summary"], ctx.prevSum);
      toast.error(err.message || "Failed to create transaction");
    },
    onSuccess: () => {
      toast.success("Transaction created", { description: "Added to your history" });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });

  return mutation;
};
