import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { Loader2, MailCheck, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type CorporateAuthGateProps = {
  children: ReactNode;
};

export default function CorporateAuthGate({ children }: CorporateAuthGateProps) {
  const { loading, error, isAuthenticated } = useAuth();
  const authWasForbidden =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("auth") === "forbidden";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f7f3] flex items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-[#174f3b] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-semibold">Проверяем корпоративный вход…</span>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f4f7f3] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
          <section className="w-full rounded-[2rem] border border-[#d8e4dc] bg-white p-7 text-center shadow-[0_24px_70px_rgba(23,79,59,0.12)] sm:p-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#e9f3ed] text-[#174f3b]">
              <DoctorFarmerLogo className="h-14 w-14" />
            </div>
            <div className="mb-2 flex items-center justify-center gap-2 text-[#174f3b]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.16em]">Корпоративный портал</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#173b2d] sm:text-3xl">
              Вход для сотрудников Doctor Farmer
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#63756c] sm:text-base">
              Используйте рабочий адрес с доменом <strong className="text-[#174f3b]">@doctorfarmer.ru</strong>. Доступ к АгроПомощнику, Тестированию и Базе знаний открывается после проверки корпоративной почты.
            </p>
            {authWasForbidden ? (
              <p className="mt-4 rounded-xl bg-[#fff5eb] px-4 py-3 text-sm leading-5 text-[#8a4d16]">
                Этот адрес не относится к домену Doctor Farmer. Используйте рабочую почту с окончанием <strong>@doctorfarmer.ru</strong>.
              </p>
            ) : error ? (
              <p className="mt-4 rounded-xl bg-[#fff5eb] px-4 py-3 text-sm leading-5 text-[#8a4d16]">
                Не удалось проверить сессию. Попробуйте войти ещё раз.
              </p>
            ) : null}
            <Button
              type="button"
              onClick={startLogin}
              className="mt-7 h-12 w-full rounded-xl bg-[#174f3b] text-base font-bold text-white hover:bg-[#123f2f]"
            >
              <MailCheck className="mr-2 h-5 w-5" aria-hidden="true" />
              Войти по корпоративной почте
            </Button>
            <p className="mt-4 text-xs leading-5 text-[#829088]">
              Личная почта и адреса других доменов не допускаются.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
