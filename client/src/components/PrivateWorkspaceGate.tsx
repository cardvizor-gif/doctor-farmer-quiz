import AccessPortalDialog from "@/components/AccessPortalDialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LockKeyhole, ShieldCheck, Sprout } from "lucide-react";
import { type ReactNode, useState } from "react";

export default function PrivateWorkspaceGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [isAccessOpen, setIsAccessOpen] = useState(false);

  if (loading) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center px-5">
        <div className="rounded-3xl border border-[#dce9d8] bg-white/90 px-8 py-7 text-center shadow-sm">
          <Sprout className="mx-auto mb-3 h-7 w-7 text-[#6f9728]" />
          <p className="text-sm font-semibold text-[#1f4b2c]">Проверяем доступ к рабочему кабинету…</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (<>
      <section className="flex min-h-[64vh] items-center justify-center px-5 py-10">
        <div className="max-w-xl rounded-[2rem] border border-white/80 bg-white/95 p-8 text-center shadow-[0_20px_60px_rgba(31,75,44,0.16)] sm:p-12">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#ecf7d7] text-[#365d24]">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a8b3b]">Защищённый рабочий раздел</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1f4b2c]">Ваши хозяйства доступны только вам</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#5f6f5e]">
            Карточки хозяйств, контакты и коммерческие предложения изолированы по аккаунтам. Запросите доступ или активируйте выданное приглашение.
          </p>
          <Button onClick={() => setIsAccessOpen(true)} className="mt-7 h-11 rounded-xl bg-[#315d1e] px-6 font-bold text-white hover:bg-[#244816]">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Получить доступ к кабинету
          </Button>
        </div>
      </section>
      <AccessPortalDialog open={isAccessOpen} onClose={() => setIsAccessOpen(false)} />
    </>);
  }

  return <>{children}</>;
}
