export const defaultRegions = [
  "Республика Башкортостан",
  "Оренбургская область",
  "Челябинская область",
  "Тюменская область",
  "Омская область",
  "Новосибирская область",
  "Краснодарский край",
  "Липецкая область",
  "Курская область",
  "Белгородская область",
  "Кемеровская область",
] as const;

export type RegionalMembershipRole = "manager" | "rop" | "cluster_director" | "deputy_ceo" | "ceo";

export const regionalMembershipRoles: RegionalMembershipRole[] = [
  "manager",
  "rop",
  "cluster_director",
  "deputy_ceo",
  "ceo",
];

export const regionalMembershipRoleLabels: Record<RegionalMembershipRole, string> = {
  manager: "Менеджер",
  rop: "РОП",
  cluster_director: "Директор кластера",
  deputy_ceo: "Заместитель генерального директора",
  ceo: "Генеральный директор",
};

export const regionalMembershipRoleRank: Record<RegionalMembershipRole, number> = {
  manager: 1,
  rop: 2,
  cluster_director: 3,
  deputy_ceo: 4,
  ceo: 5,
};

export function canOverseeRole(actorRole: RegionalMembershipRole, targetRole: RegionalMembershipRole) {
  return regionalMembershipRoleRank[actorRole] >= regionalMembershipRoleRank[targetRole];
}

export function isLeadershipRole(role: RegionalMembershipRole) {
  return role !== "manager";
}
