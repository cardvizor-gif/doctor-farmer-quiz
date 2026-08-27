export function countPendingAccessRequests(requests: ReadonlyArray<{ status: string }> | undefined) {
  return requests?.filter((request) => request.status === "pending").length ?? 0;
}
