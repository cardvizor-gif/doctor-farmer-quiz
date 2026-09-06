export function selectNewsNotifications<T extends { kind: string }>(items: T[]) {
  return items.filter((item) => item.kind === "news");
}
