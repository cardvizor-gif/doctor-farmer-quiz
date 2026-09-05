import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clipboard, KeyRound, MailCheck, MapPin, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Mode = "request" | "activate";

export const accessDialogOverlayClasses = "fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto overscroll-contain px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] touch-pan-y sm:items-center sm:overflow-hidden sm:p-4";
export const accessDialogPanelClasses = "my-0 max-h-[calc(100dvh-2rem)] w-full max-w-md shrink-0 overflow-y-auto overscroll-contain rounded-[2rem] border border-white/80 bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_28px_80px_rgba(22,61,39,0.3)] sm:my-auto sm:max-h-none sm:overflow-visible sm:p-8";

export default function AccessPortalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("request");
  const [requestedName, setRequestedName] = useState("");
  const [requestPosition, setRequestPosition] = useState("");
  const [requestRegionId, setRequestRegionId] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [activationEmail, setActivationEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const utils = trpc.useUtils();
  const { data: regions = [] } = trpc.access.regions.useQuery();
  const requestAccess = trpc.access.request.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: () => toast.error("Не удалось отправить заявку. Проверьте данные и повторите."),
  });
  const activateInvite = trpc.access.activate.useMutation({
    onSuccess: (user) => {
      void utils.auth.me.invalidate();
      toast.success("Кабинет активирован");
      onClose();
      window.location.assign("/farms");
    },
    onError: (error) => toast.error(error.message || "Не удалось активировать приглашение"),
  });

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose, open]);

  if (!open) return null;
  const submitRequest = (event: React.FormEvent) => {
    event.preventDefault();
    requestAccess.mutate({ requestedName, position: requestPosition, email: requestEmail, regionId: Number(requestRegionId) });
  };
  const submitActivation = (event: React.FormEvent) => {
    event.preventDefault();
    activateInvite.mutate({ email: activationEmail, code: inviteCode.trim().toUpperCase() });
  };
  const startOwnerLogin = () => {
    if (!startLogin()) toast.error("Вход владельца не настроен на этом сервере. Нужны HTTPS и параметры OAuth.");
  };

  return <div className={`${accessDialogOverlayClasses} bg-[#173f30]/40 backdrop-blur-sm`} onMouseDown={onClose} role="presentation">
    <section className={accessDialogPanelClasses} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Доступ к рабочему кабинету">
      <div className="flex items-start justify-between gap-4"><div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9f5dd] text-[#315d1e]"><ShieldCheck className="h-5 w-5" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#6f8d4d]">Защищённый кабинет</p><h2 className="mt-1 text-2xl font-extrabold text-[#1d4a2b]">Доступ для команды</h2></div><button type="button" className="grid h-9 w-9 place-items-center rounded-xl text-[#61735f] transition hover:bg-[#f1f6ec]" onClick={onClose} aria-label="Закрыть"><X className="h-5 w-5" /></button></div>
      <div className="mt-6 grid grid-cols-2 rounded-2xl bg-[#f2f7ee] p-1"><button type="button" onClick={() => { setMode("request"); setSubmitted(false); }} className={`rounded-xl px-3 py-2 text-sm font-bold transition ${mode === "request" ? "bg-white text-[#245f37] shadow-sm" : "text-[#728270]"}`}>Запросить доступ</button><button type="button" onClick={() => setMode("activate")} className={`rounded-xl px-3 py-2 text-sm font-bold transition ${mode === "activate" ? "bg-white text-[#245f37] shadow-sm" : "text-[#728270]"}`}>Есть код</button></div>
      {mode === "request" ? submitted ? <div className="mt-6 rounded-2xl bg-[#eff8e7] p-5 text-center"><MailCheck className="mx-auto h-8 w-8 text-[#4d8c38]" /><h3 className="mt-3 font-extrabold text-[#245d36]">Заявка отправлена</h3><p className="mt-2 text-sm leading-6 text-[#5b705d]">Руководитель рассмотрит запрос. После одобрения получите одноразовый код приглашения в согласованном рабочем канале.</p></div> : <form className="mt-6 space-y-4" onSubmit={submitRequest}><p className="text-sm leading-6 text-[#5f715e]">Оставьте рабочие контакты. Доступ появится только после одобрения руководителем.</p><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#587154]">Ваше имя</span><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#6a8c65]" /><input required value={requestedName} onChange={(event) => setRequestedName(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce8d7] bg-[#fbfdf9] pl-10 pr-3 text-sm text-[#244b2d] outline-none focus:border-[#83ab44] focus:ring-4 focus:ring-[#e7f4d7]" placeholder="Имя и фамилия" /></div></label><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#587154]">Должность</span><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#6a8c65]" /><input required value={requestPosition} onChange={(event) => setRequestPosition(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce8d7] bg-[#fbfdf9] pl-10 pr-3 text-sm text-[#244b2d] outline-none focus:border-[#83ab44] focus:ring-4 focus:ring-[#e7f4d7]" placeholder="Менеджер по продажам" /></div></label><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#587154]">Основной регион</span><div className="relative"><MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#6a8c65]" /><select required value={requestRegionId} onChange={(event) => setRequestRegionId(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-[#dce8d7] bg-[#fbfdf9] pl-10 pr-3 text-sm text-[#244b2d] outline-none focus:border-[#83ab44] focus:ring-4 focus:ring-[#e7f4d7]"><option value="" disabled>{regions.length ? "Выберите регион" : "Загрузка регионов…"}</option>{regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></div></label><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#587154]">Рабочий e-mail</span><div className="relative"><MailCheck className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#6a8c65]" /><input required type="email" value={requestEmail} onChange={(event) => setRequestEmail(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce8d7] bg-[#fbfdf9] pl-10 pr-3 text-sm text-[#244b2d] outline-none focus:border-[#83ab44] focus:ring-4 focus:ring-[#e7f4d7]" placeholder="name@company.ru" /></div></label><button type="submit" disabled={requestAccess.isPending} className="flex h-11 w-full items-center justify-center rounded-xl bg-[#315d1e] px-5 text-sm font-bold text-white transition hover:bg-[#244816] disabled:cursor-wait disabled:opacity-60">{requestAccess.isPending ? "Отправляем…" : "Отправить заявку"}</button></form> : <form className="mt-6 space-y-4" onSubmit={submitActivation}><p className="text-sm leading-6 text-[#5f715e]">Введите рабочий e-mail из заявки и одноразовый код, который передал руководитель.</p><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#587154]">Рабочий e-mail</span><input required type="email" value={activationEmail} onChange={(event) => setActivationEmail(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce8d7] bg-[#fbfdf9] px-3 text-sm text-[#244b2d] outline-none focus:border-[#83ab44] focus:ring-4 focus:ring-[#e7f4d7]" placeholder="name@company.ru" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#587154]">Код приглашения</span><div className="relative"><KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#6a8c65]" /><input required value={inviteCode} onChange={(event) => setInviteCode(event.target.value.replace(/\s/g, "").toUpperCase())} maxLength={10} className="h-10 w-full rounded-xl border border-[#dce8d7] bg-[#fbfdf9] pl-10 pr-3 font-mono text-sm font-bold tracking-[0.16em] text-[#244b2d] outline-none focus:border-[#83ab44] focus:ring-4 focus:ring-[#e7f4d7]" placeholder="ABCDEFGHIJ" /></div></label><button type="submit" disabled={activateInvite.isPending} className="flex h-11 w-full items-center justify-center rounded-xl bg-[#315d1e] px-5 text-sm font-bold text-white transition hover:bg-[#244816] disabled:cursor-wait disabled:opacity-60">{activateInvite.isPending ? "Активируем…" : "Активировать кабинет"}</button></form>}
      <div className="mt-6 border-t border-[#e5ede2] pt-4 text-center"><button type="button" onClick={startOwnerLogin} className="inline-flex items-center gap-2 text-xs font-semibold text-[#688060] hover:text-[#315d1e]"><KeyRound className="h-3.5 w-3.5" />Вход владельца кабинета</button></div>
    </section>
  </div>;
}
