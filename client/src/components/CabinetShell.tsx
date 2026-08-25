import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import CabinetSearchDialog from "@/components/CabinetSearchDialog";
import CabinetSupportDialog from "@/components/CabinetSupportDialog";
import { Bell, BookOpen, Building2, FilePlus2, Headphones, LayoutDashboard, Menu, Search, Sprout, Trophy, X } from "lucide-react";
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

export default function CabinetShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const pageTitle = cabinetPageTitle(location);
  const pageTheme = cabinetTheme(location);

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
              <div><p className="cabinet-page-kicker">Doctor Farmer · рабочий кабинет</p><h1>{pageTitle}</h1></div>
            </div>
            <div className="cabinet-topbar-actions">
              <button type="button" className="cabinet-search-hint" onClick={() => setIsSearchOpen(true)} aria-label="Открыть поиск по кабинету"><Search className="h-4 w-4" /><span>Поиск по кабинету</span><kbd>⌘ K</kbd></button>
              <button type="button" className="cabinet-notification" aria-label="Уведомления"><Bell className="h-4 w-4" /></button>
              <Link href="/proposals/new" className="cabinet-new-proposal">Новое КП</Link>
            </div>
          </header>
          <main className="cabinet-content">{children}</main>
        </div>
      </div>
      <CabinetSearchDialog open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CabinetSupportDialog open={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}
