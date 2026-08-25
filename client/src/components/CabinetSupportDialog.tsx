import { Button } from "@/components/ui/button";
import { Check, Clipboard, Headphones, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CabinetSupportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open) return null;

  const copyRequest = async () => {
    const content = `Doctor Farmer — обращение в поддержку\n\n${message.trim() || "Опишите, что произошло и на каком шаге."}\n\nРаздел: ${window.location.pathname}`;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Текст обращения скопирован");
    } catch {
      toast.error("Не удалось скопировать текст. Выделите и скопируйте его вручную.");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#173f30]/35 p-4 backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <section className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-[0_24px_70px_rgba(22,61,39,0.28)] sm:p-7" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Поддержка Doctor Farmer">
        <div className="flex items-start justify-between gap-4">
          <div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9f5dd] text-[#4e7c25]"><Headphones className="h-5 w-5" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#6f8d4d]">Поддержка Doctor Farmer</p><h2 className="mt-1 text-2xl font-extrabold text-[#1d4a2b]">Подготовить обращение</h2></div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть поддержку"><X className="h-5 w-5" /></Button>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#637260]">Опишите проблему. Кабинет подготовит текст с текущим разделом — его можно сразу отправить вашему ответственному менеджеру в принятом рабочем канале.</p>
        <textarea value={message} onChange={(event) => { setMessage(event.target.value); setCopied(false); }} className="mt-5 min-h-32 w-full rounded-2xl border border-[#dce8dc] bg-[#fbfdf9] p-4 text-sm text-[#244b2d] outline-none transition focus:border-[#82ab45] focus:ring-4 focus:ring-[#dff0c9]" placeholder="Например: не загружается Excel-файл в реестре хозяйств…" />
        <div className="mt-5 rounded-2xl bg-[#f3f8ef] p-4 text-xs leading-5 text-[#5d725f]"><strong className="block text-[#315d36]">Что приложить к обращению</strong>Кратко опишите шаг, ожидаемый результат и скриншот ошибки, если он есть.</div>
        <div className="mt-6 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Закрыть</Button><Button type="button" onClick={() => void copyRequest()} className="bg-[#315d1e] text-white hover:bg-[#244816]">{copied ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}{copied ? "Обращение скопировано" : "Скопировать обращение"}</Button></div>
      </section>
    </div>
  );
}
