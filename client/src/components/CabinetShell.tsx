import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import CabinetSearchDialog from "@/components/CabinetSearchDialog";
import CabinetSupportDialog from "@/components/CabinetSupportDialog";
import AccessPortalDialog from "@/components/AccessPortalDialog";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { countPendingAccessRequests } from "@/lib/accessRequests";
import { trpc } from "@/lib/trpc";
import { BookOpen, Building2, ChevronDown, ClipboardList, FilePlus2, Headphones, Home, LayoutDashboard, LogOut, Menu, MessageSquareText, PencilLine, Save, Search, ShieldCheck, Sprout, Trophy, UsersRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import type { PermissionCode } from "@shared/permissions";

export const cabinetNavigation = [
  { href: "/", label: "Обзор", icon: LayoutDashboard, permission: undefined },
  { href: "/agro-helper", label: "АгроПомощник", icon: Sprout, permission: "agro.use" as PermissionCode },
  { href: "/farms", label: "Хозяйства", icon: Building2, permission: "farms.read" as PermissionCode },
  { href: "/proposals/new", label: "Генератор КП", icon: FilePlus2, permission: "proposals.read" as PermissionCode },
  { href: "/order-requests", label: "Заявки", icon: ClipboardList, permission: "orders.read" as PermissionCode },
  { href: "/knowledge-base", label: "База знаний", icon: BookOpen, permission: "knowledge.read" as PermissionCode },
  { href: "/quiz", label: "Тестирование", icon: Trophy, permission: "quiz.use" as PermissionCode },
] as const;

export const mobileNavigation = [
  { href: "/", label: "Главная", icon: Home, permission: undefined },
  { href: "/agro-helper", label: "Схемы", icon: Sprout, permission: "agro.use" as PermissionCode },
  { href: "/farms", label: "Хозяйства", icon: Building2, permission: "farms.read" as PermissionCode },
  { href: "/proposals/new", label: "КП", icon: FilePlus2, permission: "proposals.read" as PermissionCode },
  { href: "/knowledge-base", label: "База знаний", icon: BookOpen, permission: "knowledge.read" as PermissionCode },
] as const;

type NavigationUser = { role?: "user" | "admin" | null; isSuperuser?: boolean | null; permissions?: readonly PermissionCode[] | null } | null | undefined;

export function filterCabinetNavigation(user: NavigationUser) {
  return cabinetNavigation.filter((item) => !item.permission || Boolean(user?.isSuperuser) || user?.permissions?.includes(item.permission));
}

export function cabinetPageTitle(pathname: string) {
  if (pathname.startsWith("/support")) return "Обращения";
  return cabinetNavigation.find((item) => item.href === pathname)?.label ?? "Рабочий кабинет";
}

export function cabinetTheme(pathname: string) {
  if (pathname === "/") return "overview";
  if (pathname.startsWith("/agro-helper")) return "agro";
  if (pathname.startsWith("/farms")) return "farms";
  if (pathname.startsWith("/proposals")) return "proposal";
  if (pathname.startsWith("/order-requests")) return "proposal";
  if (pathname.startsWith("/support")) return "overview";
  if (pathname.startsWith("/knowledge-base")) return "knowledge";
  if (pathname.startsWith("/quiz")) return "quiz";
  return "overview";
}

type AccountIdentityInput = { name?: string | null; displayName?: string | null; email?: string | null } | null | undefined;

export function accountIdentity(user: AccountIdentityInput) {
  const name = user?.displayName?.trim() || user?.name?.trim() || user?.email?.split("@")[0] || "Рабочий аккаунт";
  const email = user?.email?.trim() || "Вход выполнен";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "DF";
  return { name, email, initials };
}

export default function CabinetShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const { user, loading: isAuthLoading, logout } = useAuth();
  const utils = trpc.useUtils();
  const activityPing = trpc.activity.ping.useMutation();
  const canCreateSupport = Boolean(user?.isSuperuser || user?.permissions?.includes("support.create"));
  const canAccessSupport = Boolean(canCreateSupport || user?.permissions?.includes("support.manage"));
  const canViewTeam = Boolean(user?.isSuperuser || user?.permissions?.includes("team.read"));
  const { data: accessRequests } = trpc.access.list.useQuery(undefined, {
    enabled: Boolean(user?.isSuperuser),
    staleTime: 15_000,
  });
  const { data: supportTickets } = trpc.support.list.useQuery(undefined, {
    enabled: canAccessSupport,
    staleTime: 15_000,
  });
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: (updatedUser) => {
      void utils.auth.me.invalidate();
      setIsEditingProfile(false);
    },
  });
  const visibleNavigation = filterCabinetNavigation(user);
  const pageTitle = cabinetPageTitle(location);
  const pageTheme = cabinetTheme(location);
  const account = accountIdentity(user);
  const pendingAccessRequests = countPendingAccessRequests(accessRequests);
  const newSupportTickets = (supportTickets ?? []).filter((ticket) => ticket.status === "new").length;

  useEffect(() => {
    if (!user?.openId) return;
    let lastInteractionAt = Date.now();
    const markInteraction = () => { lastInteractionAt = Date.now(); };
    const sendActivityPing = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastInteractionAt > 90_000) return;
      activityPing.mutate();
    };
    const interactionEvents = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    interactionEvents.forEach(eventName => window.addEventListener(eventName, markInteraction, { passive: true }));
    const intervalId = window.setInterval(sendActivityPing, 60_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markInteraction();
        sendActivityPing();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    sendActivityPing();
    return () => {
      window.clearInterval(intervalId);
      interactionEvents.forEach(eventName => window.removeEventListener(eventName, markInteraction));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.openId]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isAccountMenuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("[Auth] Logout failed", error);
    } finally {
      setIsLoggingOut(false);
      setIsAccountMenuOpen(false);
    }
  };

  const startProfileEdit = () => {
    setDisplayNameDraft(account.name);
    setIsEditingProfile(true);
  };

  const saveProfileName = () => {
    const displayName = displayNameDraft.trim();
    if (displayName.length < 2) return;
    updateProfile.mutate({ displayName });
  };

  return (
    <div className={`cabinet-canvas cabinet-canvas-${pageTheme}`}>
      <div className="cabinet-frame">
        <aside className={`cabinet-sidebar ${isMobileMenuOpen ? "is-open" : ""}`} aria-label="Навигация рабочего кабинета">
          <div className="cabinet-sidebar-top">
            <Link href="/" className="cabinet-brand" onClick={() => setIsMobileMenuOpen(false)} aria-label="Doctor Farmer — обзор">
              <DoctorFarmerLogo className="h-10 w-auto" clickable={false} monochrome={pageTheme !== "knowledge"} />
            </Link>
            <button type="button" className="cabinet-mobile-close" onClick={() => setIsMobileMenuOpen(false)} aria-label="Закрыть меню"><X className="h-5 w-5" /></button>
          </div>
          <nav className="cabinet-nav">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`cabinet-nav-item ${isActive ? "is-active" : ""}`}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>;
            })}
          </nav>
          <button type="button" className="cabinet-sidebar-footer w-full text-left" onClick={() => setIsSupportOpen(true)}>
            <div className="cabinet-help-mark"><Headphones className="h-4 w-4" /></div>
            <div><strong>Поддержка</strong><span>Doctor Farmer</span></div>
          </button>
        </aside>
        <div className={`cabinet-workspace cabinet-theme-${pageTheme}`}>
          <header className="cabinet-topbar">
            <div className="flex items-center gap-3">
              <button type="button" className="cabinet-menu-trigger" onClick={() => setIsMobileMenuOpen(true)} aria-label="Открыть меню"><Menu className="h-5 w-5" /></button>
              <div><p className="cabinet-page-kicker">Doctor Farmer · рабочий кабинет</p>{location !== "/" && <h1>{pageTitle}</h1>}</div>
            </div>
            <div className="cabinet-topbar-actions">
              <button type="button" className="cabinet-search-hint" onClick={() => setIsSearchOpen(true)} aria-label="Открыть поиск по кабинету"><Search className="h-4 w-4" /><span>Поиск по кабинету</span><kbd>⌘ K</kbd></button>
              {canViewTeam && <Link href="/admin" className="cabinet-admin-panel-link" aria-label="Открыть панель администратора"><UsersRound className="h-4 w-4" aria-hidden="true" /><span>Команда</span></Link>}
              {user?.isSuperuser && <Link href="/access-requests" className="cabinet-access-requests-link" aria-label={pendingAccessRequests > 0 ? `Заявки доступа: ${pendingAccessRequests} новых` : "Заявки доступа: новых нет"}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /><span>Заявки</span>{pendingAccessRequests > 0 && <strong aria-hidden="true">{pendingAccessRequests}</strong>}
              </Link>}
              {canCreateSupport && <Link href="/support" className="cabinet-access-requests-link" aria-label={newSupportTickets > 0 ? `Обращения: ${newSupportTickets} новых` : "Открыть обращения"}>
                <MessageSquareText className="h-4 w-4" aria-hidden="true" /><span>Обращения</span>{newSupportTickets > 0 && <strong aria-hidden="true">{newSupportTickets}</strong>}
              </Link>}
              {!isAuthLoading && (user ? <div className="cabinet-account-wrap">
                <button type="button" className="cabinet-account-trigger" onClick={() => setIsAccountMenuOpen((open) => !open)} aria-expanded={isAccountMenuOpen} aria-haspopup="menu">
                  <span className="cabinet-account-avatar" aria-hidden="true">{account.initials}</span>
                  <span className="cabinet-account-copy"><strong>{account.name}</strong><small>{account.email}</small></span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isAccountMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {isAccountMenuOpen && <div className="cabinet-account-menu" role="menu" aria-label="Меню аккаунта">
                  <div className="cabinet-account-menu-identity"><span className="cabinet-account-avatar is-large" aria-hidden="true">{account.initials}</span><div><strong>{account.name}</strong><span>{account.email}</span></div></div>
                  {user.isSuperuser && <Link href="/access-requests" role="menuitem" className="cabinet-account-edit-trigger" onClick={() => setIsAccountMenuOpen(false)}><ShieldCheck className="h-4 w-4" />Заявки доступа</Link>}
                  {isEditingProfile ? <div className="cabinet-account-edit"><label htmlFor="cabinet-display-name">Отображаемое имя</label><input id="cabinet-display-name" value={displayNameDraft} onChange={(event) => setDisplayNameDraft(event.target.value)} maxLength={120} autoFocus /><div><button type="button" onClick={() => setIsEditingProfile(false)}>Отмена</button><button type="button" onClick={saveProfileName} disabled={displayNameDraft.trim().length < 2 || updateProfile.isPending}><Save className="h-3.5 w-3.5" />{updateProfile.isPending ? "Сохраняем…" : "Сохранить"}</button></div>{updateProfile.error && <p role="alert">Не удалось сохранить имя. Повторите ещё раз.</p>}</div> : <button type="button" role="menuitem" className="cabinet-account-edit-trigger" onClick={startProfileEdit}><PencilLine className="h-4 w-4" />Изменить отображаемое имя</button>}
                  <button type="button" role="menuitem" className="cabinet-account-logout" onClick={() => void handleLogout()} disabled={isLoggingOut}><LogOut className="h-4 w-4" />{isLoggingOut ? "Выходим…" : "Выйти из аккаунта"}</button>
                </div>}
              </div> : <button type="button" className="cabinet-login-button" onClick={() => setIsAccessOpen(true)}>Войти</button>)}
            </div>
          </header>
          <main className="cabinet-content">{children}</main>
        </div>
      </div>
      <nav className="cabinet-mobile-bottom-nav" aria-label="Основная навигация">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={`cabinet-mobile-bottom-nav-item ${isActive ? "is-active" : ""}`} aria-current={isActive ? "page" : undefined}>
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.8} />
            <span>{item.label}</span>
          </Link>;
        })}
      </nav>
      <CabinetSearchDialog open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CabinetSupportDialog open={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <AccessPortalDialog open={isAccessOpen} onClose={() => setIsAccessOpen(false)} />
    </div>
  );
}
