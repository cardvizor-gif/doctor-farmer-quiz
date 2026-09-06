export const permissionCodes = [
  "farms.read",
  "farms.write",
  "proposals.read",
  "proposals.write",
  "orders.read",
  "orders.write",
  "support.create",
  "support.manage",
  "team.read",
  "team.manage",
  "team.transfer",
  "knowledge.read",
  "agro.use",
  "quiz.use",
  "sales.read",
  "sales.write",
  "sales.assign",
  "workspace.manage",
] as const;

export type PermissionCode = (typeof permissionCodes)[number];

export const permissionLabels: Record<PermissionCode, { title: string; description: string }> = {
  "farms.read": { title: "Хозяйства: просмотр", description: "Просмотр собственных карточек хозяйств." },
  "farms.write": { title: "Хозяйства: редактирование", description: "Создание, изменение, импорт и удаление собственных карточек." },
  "proposals.read": { title: "КП: просмотр", description: "Просмотр собственных коммерческих предложений." },
  "proposals.write": { title: "КП: редактирование", description: "Создание и изменение собственных коммерческих предложений." },
  "orders.read": { title: "Заявки: просмотр", description: "Просмотр собственных заявок и истории отгрузок." },
  "orders.write": { title: "Заявки: редактирование", description: "Создание и изменение собственных заявок и отгрузок." },
  "support.create": { title: "Обращения: создание", description: "Создание и просмотр собственных обращений." },
  "support.manage": { title: "Обращения: обработка", description: "Просмотр общей очереди и изменение статусов обращений." },
  "team.read": { title: "Команда: просмотр", description: "Просмотр доступной командной сводки." },
  "team.manage": { title: "Команда: управление", description: "Изменение permissions обычных сотрудников без назначения администраторов." },
  "team.transfer": { title: "Команда: передача баз", description: "Передача базы обычного сотрудника и архивирование его доступа." },
  "knowledge.read": { title: "База знаний", description: "Доступ к базе знаний препаратов и материалов." },
  "agro.use": { title: "АгроПомощник", description: "Доступ к схемам защиты и расчётам применения." },
  "quiz.use": { title: "Тестирование", description: "Доступ к профессиональным тестам." },
  "sales.read": { title: "Продажи: просмотр", description: "Просмотр рабочего плана, задач и доступных сделок." },
  "sales.write": { title: "Продажи: свои задачи", description: "Создание личных задач и обновление их статуса." },
  "sales.assign": { title: "Продажи: постановка задач", description: "Постановка задач сотрудникам в доступных рабочих пространствах." },
  "workspace.manage": { title: "Рабочие пространства", description: "Управление регионами, пространствами и назначениями команды." },
};

export const allPermissionCodes = [...permissionCodes] as PermissionCode[];

/** Рабочий пресет менеджера: без управления командой, передачей баз и рабочими пространствами. */
export const defaultManagerPermissions: PermissionCode[] = [
  "farms.read", "farms.write", "proposals.read", "proposals.write",
  "orders.read", "orders.write", "support.create", "knowledge.read",
  "agro.use", "quiz.use", "sales.read", "sales.write",
];

/** Расширенный пресет администратора: все permission-коды, но не флаг суперпользователя. */
export const defaultAdminPermissions: PermissionCode[] = [...allPermissionCodes];

export function defaultPermissionsForRole(role: "user" | "admin"): PermissionCode[] {
  return role === "admin" ? [...defaultAdminPermissions] : [...defaultManagerPermissions];
}
