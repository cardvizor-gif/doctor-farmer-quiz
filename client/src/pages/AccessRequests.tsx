import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BriefcaseBusiness, Check, Clipboard, Clock3, History, ShieldCheck, UserRound, UserRoundX, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const statusCopy = { pending: "Ожидает решения", approved: "Код выдан", rejected: "Отклонена", activated: "Кабинет активирован" } as const;

type IssuedCode = { code: string; name: string; expiresAt: Date };

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("ru-RU");
}

function statusClass(status: keyof typeof statusCopy) {
  if (status === "pending") return "bg-[#fff5da] text-[#946d1b]";
  if (status === "activated") return "bg-[#e9f7df] text-[#397330]";
  return "bg-[#eef2ec] text-[#627060]";
}

export default function AccessRequests() {
  const utils = trpc.useUtils();
  const { data: requests = [], isLoading, error } = trpc.access.list.useQuery();
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [issuedCode, setIssuedCode] = useState<IssuedCode | null>(null);
  const selectedRequest = useMemo(() => requests.find(request => request.id === selectedRequestId) ?? null, [requests, selectedRequestId]);
  const historyQuery = trpc.access.history.useQuery(
    { id: selectedRequestId ?? 0 },
    { enabled: Boolean(selectedRequestId), staleTime: 15_000 },
  );
  const approve = trpc.access.approve.useMutation({
    onSuccess: result => {
      setSelectedRequestId(result.request.id);
      setIssuedCode({ code: result.code, name: result.request.requestedName, expiresAt: result.expiresAt });
      void utils.access.list.invalidate();
      void utils.access.history.invalidate({ id: result.request.id });
    },
    onError: () => toast.error("Не удалось одобрить заявку"),
  });
  const reissue = trpc.access.reissue.useMutation({
    onSuccess: result => {
      setSelectedRequestId(result.request.id);
      setIssuedCode({ code: result.code, name: result.request.requestedName, expiresAt: result.expiresAt });
      void utils.access.list.invalidate();
      void utils.access.history.invalidate({ id: result.request.id });
      toast.success("Новый код выдан. Сотрудник сможет задать новый пароль");
    },
    onError: error => toast.error(error.message || "Не удалось выдать новый код"),
  });
  const reject = trpc.access.reject.useMutation({
    onSuccess: () => void utils.access.list.invalidate(),
    onError: () => toast.error("Не удалось отклонить заявку"),
  });

  const copyCode = async (code: string, name: string) => {
    try {
      await navigator.clipboard.writeText(`АгроПомощник DF — код доступа для ${name}: ${code}`);
      toast.success("Код скопирован");
    } catch {
      toast.error("Не удалось скопировать код");
    }
  };

  if (error) return <section className="access-requests-page mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm"><ShieldCheck className="h-8 w-8 text-[#5d7e34]" /><h2 className="mt-4 text-xl font-extrabold text-[#244b2d]">Раздел доступен владельцу кабинета</h2><p className="mt-2 text-sm text-[#647461]">Войдите в аккаунт владельца, чтобы просматривать и обрабатывать заявки коллег.</p></section>;

  return <section className="access-requests-page mx-auto max-w-5xl">
    <div className="rounded-[2rem] bg-[linear-gradient(130deg,#244f2f,#47733a)] p-7 text-white shadow-[0_20px_50px_rgba(31,75,44,0.22)] sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ddf2ad]">Доступ команды</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Заявки на рабочий кабинет</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">Одобрите заявку — система создаст одноразовый код. Передайте его коллеге вручную в согласованном рабочем канале.</p></div>
    {issuedCode && <div className="mt-5 rounded-3xl border border-[#cfe7b9] bg-[#f2f9e9] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#628341]">Одобрено для {issuedCode.name}</p><p className="mt-2 font-mono text-2xl font-extrabold tracking-[0.18em] text-[#2b592a]">{issuedCode.code}</p><p className="mt-2 text-xs text-[#647560]">Код одноразовый и действует до {new Date(issuedCode.expiresAt).toLocaleDateString("ru-RU")}.</p></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => void copyCode(issuedCode.code, issuedCode.name)}><Clipboard className="mr-2 h-4 w-4" />Копировать</Button><Button type="button" variant="ghost" onClick={() => setIssuedCode(null)} aria-label="Скрыть код"><X className="h-4 w-4" /></Button></div></div></div>}
    <div className="mt-6 overflow-hidden rounded-3xl border border-[#e3ebe0] bg-white shadow-sm"><div className="border-b border-[#edf2ea] px-6 py-5"><h3 className="font-extrabold text-[#244b2d]">Все заявки</h3><p className="mt-1 text-sm text-[#6b7b68]">Откройте заявку, чтобы увидеть профиль сотрудника и всю историю выданных кодов.</p></div>{isLoading ? <div className="p-8 text-sm text-[#61735f]">Загружаем заявки…</div> : requests.length === 0 ? <div className="p-10 text-center"><Clock3 className="mx-auto h-7 w-7 text-[#91aa83]" /><p className="mt-3 text-sm font-semibold text-[#4c654d]">Новых заявок пока нет</p></div> : <div className="divide-y divide-[#edf2ea]">{requests.map(request => <div key={request.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => { setSelectedRequestId(request.id); setIssuedCode(null); }} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><strong className="text-[#244b2d]">{request.requestedName}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(request.status)}`}>{statusCopy[request.status]}</span></div><p className="mt-1 text-sm text-[#667766]">{request.email}</p><p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8a9888]"><span>Запрос: {formatDate(request.createdAt)}</span><span className="inline-flex items-center gap-1 text-[#5b7558]"><BriefcaseBusiness className="h-3 w-3" />{request.position || "Должность не указана"}</span></p></button><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => { setSelectedRequestId(request.id); setIssuedCode(null); }}><UserRound className="mr-2 h-4 w-4" />Профиль</Button>{request.status === "pending" && <><Button type="button" onClick={() => approve.mutate({ id: request.id })} disabled={approve.isPending} className="bg-[#315d1e] text-white hover:bg-[#244816]"><Check className="mr-2 h-4 w-4" />Одобрить</Button><Button type="button" variant="outline" onClick={() => reject.mutate({ id: request.id })} disabled={reject.isPending}><UserRoundX className="mr-2 h-4 w-4" />Отклонить</Button></>}</div></div>)}</div>}</div>
    {selectedRequest && <section className="mt-6 rounded-3xl border border-[#dce8d7] bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#edf2ea] pb-5"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#628341]"><UserRound className="h-4 w-4" />Профиль сотрудника</p><h3 className="mt-2 text-2xl font-extrabold text-[#244b2d]">{selectedRequest.requestedName}</h3><p className="mt-1 text-sm text-[#667766]">{selectedRequest.email}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(selectedRequest.status)}`}>{statusCopy[selectedRequest.status]}</span><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedRequestId(null)} aria-label="Закрыть профиль"><X className="h-4 w-4" /></Button></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#f6faf2] p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#71846c]"><BriefcaseBusiness className="h-4 w-4" />Должность</p><p className="mt-2 font-bold text-[#244b2d]">{selectedRequest.position || "Не указана в заявке"}</p></div><div className="rounded-2xl bg-[#f6faf2] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#71846c]">Дата запроса</p><p className="mt-2 font-bold text-[#244b2d]">{formatDate(selectedRequest.createdAt)}</p></div></div>{(selectedRequest.status === "approved" || selectedRequest.status === "activated") && <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#f6faf2] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[#244b2d]">Восстановить доступ?</p><p className="mt-1 text-xs leading-5 text-[#71806f]">Будет выдан новый одноразовый код. Сотрудник задаст новый пароль, а существующий профиль и права сохранятся.</p></div><Button type="button" onClick={() => reissue.mutate({ id: selectedRequest.id })} disabled={reissue.isPending} className="shrink-0 bg-[#315d1e] text-white hover:bg-[#244816]"><History className="mr-2 h-4 w-4" />{reissue.isPending ? "Выдаём…" : "Выдать код восстановления"}</Button></div>}<div className="mt-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="flex items-center gap-2 font-extrabold text-[#244b2d]"><History className="h-4 w-4 text-[#5d7e34]" />История кодов доступа</h4><p className="mt-1 text-xs leading-5 text-[#71806f]">Коды хранятся зашифрованно и расшифровываются только для владельца кабинета.</p></div></div>{historyQuery.isLoading ? <div className="mt-3 rounded-2xl bg-[#fafcf8] p-4 text-sm text-[#61735f]">Загружаем историю кодов…</div> : historyQuery.error ? <div className="mt-3 rounded-2xl bg-[#fff8f4] p-4 text-sm text-[#985b4b]">Не удалось загрузить историю кодов.</div> : historyQuery.data?.length ? <div className="mt-3 grid gap-2">{historyQuery.data.map(item => { const isUsed = Boolean(item.usedAt); const isExpired = new Date(item.expiresAt).getTime() <= Date.now() && !isUsed; return <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-[#e5eee1] bg-[#fbfdf9] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-lg font-extrabold tracking-[0.16em] text-[#244b2d]">{item.code}</p><p className="mt-1 text-xs text-[#71806f]">Выдан: {formatDate(item.createdAt)} · до: {formatDate(item.expiresAt)}</p><p className="mt-1 text-xs font-bold text-[#5d7e34]">{isUsed ? `Использован ${formatDate(item.usedAt!)}` : isExpired ? "Истёк срок действия" : "Действует"}</p></div><Button type="button" variant="outline" onClick={() => void copyCode(item.code, selectedRequest.requestedName)}><Clipboard className="mr-2 h-4 w-4" />Копировать</Button></div>; })}</div> : <div className="mt-3 rounded-2xl bg-[#fafcf8] p-4 text-sm text-[#71806f]">История кодов пока пуста. Она появится после одобрения заявки.</div>}</div></section>}
  </section>;
}
