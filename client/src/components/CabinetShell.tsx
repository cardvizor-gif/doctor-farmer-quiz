import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import CabinetSearchDialog from "@/components/CabinetSearchDialog";
import CabinetSupportDialog from "@/components/CabinetSupportDialog";
import AccessPortalDialog from "@/components/AccessPortalDialog";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { countPendingAccessRequests } from "@/lib/accessRequests";
import { trpc } from "@/lib/trpc";
import { BookOpen, Building2, ChevronDown, FilePlus2, Headphones, LayoutDashboard, LogOut, Menu, PencilLine, Save, Search, ShieldCheck, Sprout, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

export const cabinetNavigation = [
  { href: "/", label: "Обзор", icon: LayoutDashboard },
  { href: "/agro-helper", label: "АгроПомощник", icon: Sprout },
  { href: "/farms", label: "Хозяйства", icon: Building2 },
  { href: "/proposals/new", label: "Генератор КП", icon: FilePlus2 },
  { href: "/knowledge-base", label: "База знаний", icon: BookOpen },
  { href: "/quiz", label: "Тестирование", icon: Trophy },
] as const;

export function cabinetPageTitle(pathname: string) {
  return cabinetNavigation.find((item) => item.href === pathname)?.label ?? "Рабочий кабинет";
}

function cabinetTheme(pathname: string) {
  if (pathname === "/") return "overview";
  if (pathname.startsWith("/agro-helper")) return "agro";
  if (pathname.startsWith("/farms")) return "farms";
  if (pathname.startsWith("/proposals")) return "proposal";
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
  const { data: accessRequests } = trpc.access.list.useQuery(undefined, {
    enabled: user?.role === "admin",
    staleTime: 15_000,
  });
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: (updatedUser) => {
      utils.auth.me.setData(undefined, updatedUser);
      setIsEditingProfile(false);
    },
  });
  const pageTitle = cabinetPageTitle(location);
  const pageTheme = cabinetTheme(location);
  const account = accountIdentity(user);
  const pendingAccessRequests = countPendingAccessRequests(accessRequests);

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
    <div className="cabinet-canvas">
      <div className="cabinet-frame">
        <aside className={`cabinet-sidebar ${isMobileMenuOpen ? "is-open" : ""}`} aria-label="Навигация рабочего кабинета">
          <div className="cabinet-sidebar-top">
            <Link href="/" className="cabinet-brand" onClick={() => setIsMobileMenuOpen(false)} aria-label="Doctor Farmer — обзор">
              <DoctorFarmerLogo className="h-10 w-auto" clickable={false} />
            </Link>
            <button type="button" className="cabinet-mobile-close" onClick={() => setIsMobileMenuOpen(false)} aria-label="Закрыть меню"><X className="h-5 w-5" /></button>
          </div>
          <nav className="cabinet-nav">
            {cabinetNavigation.map((item) => {
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
              {user?.role === "admin" && <Link href="/access-requests" className="cabinet-access-requests-link" aria-label={pendingAccessRequests > 0 ? `Заявки доступа: ${pendingAccessRequests} новых` : "Заявки доступа: новых нет"}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /><span>Заявки</span>{pendingAccessRequests > 0 && <strong aria-hidden="true">{pendingAccessRequests}</strong>}
              </Link>}
              {!isAuthLoading && (user ? <div className="cabinet-account-wrap">
                <button type="button" className="cabinet-account-trigger" onClick={() => setIsAccountMenuOpen((open) => !open)} aria-expanded={isAccountMenuOpen} aria-haspopup="menu">
                  <span className="cabinet-account-avatar" aria-hidden="true">{account.initials}</span>
                  <span className="cabinet-account-copy"><strong>{account.name}</strong><small>{account.email}</small></span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isAccountMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {isAccountMenuOpen && <div className="cabinet-account-menu" role="menu" aria-label="Меню аккаунта">
                  <div className="cabinet-account-menu-identity"><span className="cabinet-account-avatar is-large" aria-hidden="true">{account.initials}</span><div><strong>{account.name}</strong><span>{account.email}</span></div></div>
                  {user.role === "admin" && <Link href="/access-requests" role="menuitem" className="cabinet-account-edit-trigger" onClick={() => setIsAccountMenuOpen(false)}><ShieldCheck className="h-4 w-4" />Заявки доступа</Link>}
                  {isEditingProfile ? <div className="cabinet-account-edit"><label htmlFor="cabinet-display-name">Отображаемое имя</label><input id="cabinet-display-name" value={displayNameDraft} onChange={(event) => setDisplayNameDraft(event.target.value)} maxLength={120} autoFocus /><div><button type="button" onClick={() => setIsEditingProfile(false)}>Отмена</button><button type="button" onClick={saveProfileName} disabled={displayNameDraft.trim().length < 2 || updateProfile.isPending}><Save className="h-3.5 w-3.5" />{updateProfile.isPending ? "Сохраняем…" : "Сохранить"}</button></div>{updateProfile.error && <p role="alert">Не удалось сохранить имя. Повторите ещё раз.</p>}</div> : <button type="button" role="menuitem" className="cabinet-account-edit-trigger" onClick={startProfileEdit}><PencilLine className="h-4 w-4" />Изменить отображаемое имя</button>}
                  <button type="button" role="menuitem" className="cabinet-account-logout" onClick={() => void handleLogout()} disabled={isLoggingOut}><LogOut className="h-4 w-4" />{isLoggingOut ? "Выходим…" : "Выйти из аккаунта"}</button>
                </div>}
              </div> : <button type="button" className="cabinet-login-button" onClick={() => setIsAccessOpen(true)}>Войти</button>)}
              <Link href="/proposals/new" className="cabinet-new-proposal">Новое КП</Link>
            </div>
          </header>
          <main className="cabinet-content">{children}</main>
        </div>
      </div>
      <CabinetSearchDialog open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CabinetSupportDialog open={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <AccessPortalDialog open={isAccessOpen} onClose={() => setIsAccessOpen(false)} />
    </div>
  );
}
