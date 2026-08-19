import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HelpCircle, Send, CheckCircle2, Loader2 } from "lucide-react";
import emailjs from "@emailjs/browser";
import { EMAIL_CONFIG } from "@/data/emailConfig";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !message.trim()) {
      setError("Пожалуйста, заполните ФИО, контакт и текст обращения.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await emailjs.send(
        EMAIL_CONFIG.serviceId,
        EMAIL_CONFIG.templateId,
        {
          to_email: "vildanov_sf@doctorfarmer.ru",
          employee_name: name,
          employee_contact: contact,
          subject: subject || "Обращение в поддержку Doctor Farmer",
          message: message,
          timestamp: new Date().toLocaleString("ru-RU"),
        },
        EMAIL_CONFIG.publicKey
      );

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setContact("");
        setSubject("");
        setMessage("");
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error("Support email error:", err);
      window.location.href = `mailto:vildanov_sf@doctorfarmer.ru?subject=${encodeURIComponent(
        subject || "Обращение в поддержку"
      )}&body=${encodeURIComponent(`От: ${name}\nКонтакт: ${contact}\n\n${message}`)}`;
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-white border border-emerald-100 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto mb-1 shadow-inner">
            <HelpCircle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-slate-900">
            Поддержка Doctor Farmer
          </DialogTitle>
          <DialogDescription className="text-center text-slate-600 text-sm">
            Возникли вопросы по работе тестов или АгроПомощника? Отправьте сообщение напрямую руководителю: <span className="font-semibold text-emerald-800">vildanov_sf@doctorfarmer.ru</span>
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Обращение отправлено!</h3>
            <p className="text-sm text-slate-600 max-w-xs">
              Спасибо! Ваше сообщение успешно передано в службу поддержки. Мы ответим в ближайшее время.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Ваши ФИО <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Исмаилов Тимур"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Телефон или Email для связи <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="+7 (999) 000-00-00 или email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Тема вопроса
              </label>
              <Input
                placeholder="Например: Вопрос по регламенту защиты рапса"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Текст обращения <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Опишите подробно ваш вопрос или замечание..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600 resize-none"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-6 shadow-lg shadow-emerald-900/10 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Отправить вопрос
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
