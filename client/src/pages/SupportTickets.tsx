import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { FileText, Loader2, MessageSquareText, Paperclip, Send, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_LABELS = { new: "Новое", in_progress: "В работе", resolved: "Решено" } as const;
const STATUS_CLASSES = { new: "bg-amber-100 text-amber-900", in_progress: "bg-sky-100 text-sky-900", resolved: "bg-emerald-100 text-emerald-900" } as const;

export default function SupportTickets() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const ticketsQuery = trpc.support.list.useQuery(undefined, { staleTime: 15_000 });
  const detailQuery = trpc.support.byId.useQuery({ id: selectedId ?? 0 }, { enabled: selectedId !== null });
  const updateStatus = trpc.support.updateStatus.useMutation({
    onSuccess: () => {
      void utils.support.list.invalidate();
      if (selectedId) void utils.support.byId.invalidate({ id: selectedId });
    },
  });

  useEffect(() => {
    if (!selectedId && ticketsQuery.data?.[0]) setSelectedId(ticketsQuery.data[0].id);
  }, [selectedId, ticketsQuery.data]);

  if (ticketsQuery.isLoading) return <div className="flex min-h-72 items-center justify-center text-sm text-[#486656]"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Загружаем обращения…</div>;
  if (ticketsQuery.error) return <div className="mx-auto max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Для просмотра обращений необходим вход в рабочий кабинет.</div>;

  const tickets = ticketsQuery.data ?? [];
  const selected = detailQuery.data;
  const isAdmin = user?.role === "admin";

  return <main className="support-tickets-page mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
    <section className="rounded-3xl border border-[#dce8dc] bg-white p-5 shadow-[0_16px_45px_rgba(19,53,42,0.08)] sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#5f893c]"><MessageSquareText className="h-4 w-4" />Внутренний сервис</div><h2 className="text-2xl font-extrabold text-[#12352a]">Обращения</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d725f]">Здесь собраны обращения, отправленные через поддержку. {isAdmin ? "Вы видите общую очередь команды и можете менять статус обработки." : "Вы видите только свои обращения и прикреплённые файлы."}</p></div><Badge className="w-fit bg-[#e9f5dd] text-[#315d36] hover:bg-[#e9f5dd]">{tickets.length} {tickets.length === 1 ? "обращение" : "обращений"}</Badge></div>
    </section>

    {tickets.length === 0 ? <section className="mt-6 rounded-2xl border border-dashed border-[#b8cfb8] bg-[#f7faf5] p-10 text-center"><MessageSquareText className="mx-auto h-10 w-10 text-[#7ea05c]" /><h3 className="mt-3 font-bold text-[#194f38]">Пока обращений нет</h3><p className="mx-auto mt-1 max-w-md text-sm text-[#617461]">Нажмите «Поддержка» внизу левого меню, чтобы отправить первое обращение. Оно появится здесь вместе с приложенными файлами.</p></section> : <section className="mt-6 grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="overflow-hidden rounded-2xl border border-[#dde5dc] bg-white shadow-sm"><div className="border-b border-[#e7eee5] px-5 py-4 text-sm font-bold text-[#194f38]">Очередь обращений</div><div className="divide-y divide-[#e7eee5]">{tickets.map((ticket) => <button type="button" key={ticket.id} onClick={() => setSelectedId(ticket.id)} className={`w-full p-4 text-left transition hover:bg-[#f6faf2] ${selectedId === ticket.id ? "bg-[#eef7e7]" : "bg-white"}`}><div className="flex gap-3"><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><strong className="line-clamp-1 text-sm text-[#173f30]">{ticket.subject}</strong><Badge className={`${STATUS_CLASSES[ticket.status]} shrink-0 text-[10px] hover:${STATUS_CLASSES[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</Badge></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#627462]">{ticket.message}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6c7b6f]">{isAdmin && <span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" />{ticket.senderName}</span>}<span>{new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ticket.createdAt))}</span></div></div></div></button>)}</div></div>
      <article className="rounded-2xl border border-[#dde5dc] bg-white p-5 shadow-sm sm:p-6">{detailQuery.isLoading ? <div className="flex min-h-48 items-center justify-center text-sm text-[#617461]"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Загружаем обращение…</div> : selected ? <><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#638d47]">Обращение №{selected.id}</p><h3 className="mt-1 text-xl font-extrabold text-[#12352a]">{selected.subject}</h3><p className="mt-1 text-xs text-[#66766b]">{isAdmin ? `${selected.senderName}${selected.senderEmail ? ` · ${selected.senderEmail}` : ""}` : "Ваше обращение"} · раздел {selected.pagePath}</p></div><Badge className={`${STATUS_CLASSES[selected.status]} hover:${STATUS_CLASSES[selected.status]}`}>{STATUS_LABELS[selected.status]}</Badge></div><p className="mt-5 whitespace-pre-wrap rounded-xl bg-[#f6faf3] p-4 text-sm leading-6 text-[#2a4c34]">{selected.message}</p>{selected.attachments.length > 0 && <div className="mt-5"><p className="text-xs font-bold uppercase tracking-wide text-[#557159]">Вложения</p><div className="mt-2 flex flex-wrap gap-2">{selected.attachments.map((attachment) => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#cfe0cf] bg-[#f8fbf6] px-3 py-2 text-xs font-semibold text-[#25503a] hover:bg-[#edf6e9]"><Paperclip className="h-3.5 w-3.5" />{attachment.fileName}<span className="text-[#748375]">{Math.ceil(attachment.sizeBytes / 1024)} КБ</span></a>)}</div></div>}{isAdmin && <div className="mt-6 border-t border-[#e7eee5] pt-5"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#557159]">Статус обработки</p><div className="flex flex-wrap gap-2">{(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((status) => <Button key={status} type="button" size="sm" variant={selected.status === status ? "default" : "outline"} className={selected.status === status ? "bg-[#315d1e] text-white hover:bg-[#244816]" : "border-[#b9cfb9] text-[#315d36]"} disabled={selected.status === status || updateStatus.isPending} onClick={() => updateStatus.mutate({ id: selected.id, status })}>{STATUS_LABELS[status]}</Button>)}</div></div>}</> : <div className="flex min-h-48 items-center justify-center text-sm text-[#617461]">Выберите обращение из списка.</div>}</article>
    </section>}
  </main>;
}
