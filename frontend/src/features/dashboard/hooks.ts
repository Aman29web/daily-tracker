import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../api/endpoints/insights";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.get,
    refetchOnMount: "always",
  });
}
