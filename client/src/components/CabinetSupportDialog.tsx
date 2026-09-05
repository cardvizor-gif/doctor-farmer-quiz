import { Button } from "@/components/ui/button";
import { Check, Headphones, Loader2, Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
type SupportAttachmentMime = "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "application/vnd.ms-excel" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain" | "text/csv";
const ACCEPTED_TYPES = new Set<SupportAttachmentMime>(["image/jpeg", "image/png", "image/webp", "application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/csv"]);

function asBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}

export default function CabinetSupportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [success, setSuccess] = useState(false);
  const createTicket = trpc.support.create.useMutation({ onSuccess: () => void utils.support.list.invalidate() });

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open) return null;

  const addAttachments = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;
    if (attachments.length + selected.length > 3) return toast.error("К обращению можно приложить не более трёх файлов.");
    const invalid = selected.find((file) => !ACCEPTED_TYPES.has(file.type as SupportAttachmentMime) || file.size > MAX_FILE_SIZE);
    if (invalid) return toast.error("Разрешены JPG, PNG, WEBP, PDF, Excel, Word, TXT и CSV до 5 МБ.");
    setAttachments((current) => [...current, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitRequest = async () => {
    if (message.trim().length < 5) return toast.error("Опишите вопрос подробнее.");
    try {
      const files = await Promise.all(attachments.map(async (file) => ({ fileName: file.name, mimeType: file.type as SupportAttachmentMime, dataBase64: await asBase64(file) })));
      await createTicket.mutateAsync({ subject: subject.trim() || null, message: message.trim(), pagePath: window.location.pathname, attachments: files });
      setSuccess(true);
      setSubject("");
      setMessage("");
      setAttachments([]);
      toast.success("Обращение отправлено в раздел «Обращения».");
      window.setTimeout(() => { setSuccess(false); onClose(); }, 1_100);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отправить обращение. Повторите попытку.");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#173f30]/35 p-4 backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <section className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-[0_24px_70px_rgba(22,61,39,0.28)] sm:p-7" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Поддержка АгроПомощник DF">
        <div className="flex items-start justify-between gap-4">
          <div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9f5dd] text-[#4e7c25]"><Headphones className="h-5 w-5" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#6f8d4d]">Поддержка АгроПомощник DF</p><h2 className="mt-1 text-2xl font-extrabold text-[#1d4a2b]">Новое обращение</h2></div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть поддержку"><X className="h-5 w-5" /></Button>
        </div>
        {success ? <div className="mt-7 flex min-h-48 flex-col items-center justify-center text-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#e9f5dd] text-[#315d36]"><Check className="h-7 w-7" /></span><h3 className="mt-4 text-lg font-bold text-[#1d4a2b]">Обращение отправлено</h3><p className="mt-1 max-w-xs text-sm text-[#637260]">Оно сохранено в разделе «Обращения» и доступно для обработки.</p></div> : <><p className="mt-3 text-sm leading-6 text-[#637260]">Опишите вопрос или проблему. Обращение будет сохранено внутри кабинета и появится в разделе «Обращения».</p><input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-4 h-10 w-full rounded-xl border border-[#dce8dc] bg-[#fbfdf9] px-3 text-sm text-[#244b2d] outline-none transition focus:border-[#82ab45] focus:ring-4 focus:ring-[#dff0c9]" placeholder="Тема обращения, например: не загружается Excel" maxLength={255} /><textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-3 min-h-32 w-full rounded-2xl border border-[#dce8dc] bg-[#fbfdf9] p-4 text-sm text-[#244b2d] outline-none transition focus:border-[#82ab45] focus:ring-4 focus:ring-[#dff0c9]" placeholder="Опишите, что произошло, на каком шаге и какой результат ожидаете…" /><div className="mt-4 rounded-2xl bg-[#f3f8ef] p-4 text-xs leading-5 text-[#5d725f]"><strong className="block text-[#315d36]">Вложения</strong><span>Можно приложить до трёх файлов: скриншоты, PDF, Excel, Word, TXT или CSV — до 5 МБ каждый.</span><div className="mt-3 flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="sm" className="border-[#b9cfb9] text-[#315d36]" onClick={() => fileInputRef.current?.click()}><Paperclip className="mr-1.5 h-3.5 w-3.5" />Прикрепить файл</Button><input ref={fileInputRef} type="file" multiple className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls,.docx,.txt,.csv" onChange={(event) => addAttachments(event.target.files)} />{attachments.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-[#315d36]"><Paperclip className="h-3 w-3" />{file.name}<button type="button" className="ml-1 text-[#6b7f6d] hover:text-red-700" onClick={() => setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))} aria-label={`Удалить ${file.name}`}>×</button></span>)}</div></div><div className="mt-6 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={createTicket.isPending}>Закрыть</Button><Button type="button" onClick={() => void submitRequest()} disabled={createTicket.isPending} className="bg-[#315d1e] text-white hover:bg-[#244816]">{createTicket.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{createTicket.isPending ? "Отправляем…" : "Отправить обращение"}</Button></div></>}
      </section>
    </div>
  );
}
