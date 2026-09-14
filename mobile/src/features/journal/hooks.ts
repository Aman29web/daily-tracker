import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { journalApi, JournalInput } from "@/api/endpoints/journal";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/stores/toastStore";

export function useJournalEntries(params?: { start?: string; end?: string; mood?: string; tag?: string; search?: string }) {
  return useQuery({ queryKey: ["journal", params], queryFn: () => journalApi.list(params) });
}

export function useJournalByDate(date: string) {
  return useQuery({ queryKey: ["journal-date", date], queryFn: () => journalApi.getByDate(date) });
}

export function useUpsertJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: JournalInput) => journalApi.upsert(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      queryClient.invalidateQueries({ queryKey: ["journal-date"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast.success("Journal entry saved");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not save journal entry")),
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: journalApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      toast.success("Entry deleted");
    },
  });
}
