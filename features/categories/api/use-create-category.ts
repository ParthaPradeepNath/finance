import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api.categories.$post>;
type RequestType = InferRequestType<typeof client.api.categories.$post>["json"];

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType, { previous: unknown }>({
    mutationFn: async (json) => {
      const response = await client.api.categories.$post({ json });
      if (!response.ok) throw new Error("Failed to create category");
      return await response.json();
    },
    onMutate: async (newCat) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previous = queryClient.getQueryData<unknown>(["categories"]);
      queryClient.setQueryData(["categories"], (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return [...old, { id: `optimistic-${Date.now()}`, ...newCat }];
      });
      return { previous };
    },
    onError: (err, _new, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["categories"], ctx.previous);
      toast.error(err.message || "Failed to create category");
    },
    onSuccess: () => {
      toast.success("Category created", { description: "Category added" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });

  return mutation;
};
