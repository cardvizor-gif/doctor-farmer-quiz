import { Bell, CalendarDays, Check, Newspaper, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { selectNewsNotifications } from "@/lib/news";

export default function News() {
  const [location] = useLocation();
  const { data: notifications = [], isLoading, error } = trpc.notifications.list.useQuery(undefined, { staleTime: 15_000 });
  const markRead = trpc.notifications.markRead.useMutation();
  const markAllRead = trpc.notifications.markAllRead.useMutation();
  const news = useMemo(() => selectNewsNotifications(notifications), [notifications]);
  const selectedId = new URLSearchParams(location.split("?")[1] || "").get("notificationId");
  const unreadNews = news.filter((item) => !item.isRead).length;

  if (isLoading) return <section className="news-page mx-auto max-w-5xl"><div className="news-hero"><p className="news-kicker">Центр информации</p><h1>Новости команды</h1><p>Загружаем актуальные сообщения…</p></div></section>;
  if (error) return <section className="news-page mx-auto max-w-5xl"><div className="news-empty"><Bell className="mx-auto h-8 w-8" /><h2>Не удалось загрузить новости</h2><p>Обновите страницу и повторите попытку.</p></div></section>;

  return <section className="news-page mx-auto max-w-5xl">
    <div className="news-hero">
      <div className="news-hero-icon"><Newspaper className="h-7 w-7" /></div>
      <div className="min-w-0"><p className="news-kicker">Центр информации</p><h1>Новости команды</h1><p>Объявления и важные сообщения, доступные вашему рабочему кабинету.</p></div>
      {unreadNews > 0 && <Button type="button" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="news-read-all"><Check className="mr-2 h-4 w-4" />{markAllRead.isPending ? "Сохраняем…" : "Прочитать всё"}</Button>}
    </div>
    {news.length === 0 ? <div className="news-empty"><Sparkles className="mx-auto h-8 w-8" /><h2>Новостей пока нет</h2><p>Когда суперпользователь опубликует объявление, оно появится здесь и в центре уведомлений.</p></div> : <div className="news-feed">{news.map((item) => { const isSelected = String(item.id) === selectedId; return <article key={item.id} className={`news-card ${item.isRead ? "is-read" : "is-unread"} ${isSelected ? "is-selected" : ""}`}><div className="news-card-mark"><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="news-card-meta"><span>Новости команды</span><time><CalendarDays className="mr-1 inline h-3 w-3" />{new Date(item.createdAt).toLocaleString("ru-RU")}</time></div><h2>{item.title}</h2><p>{item.body}</p>{!item.isRead && <Button type="button" variant="outline" size="sm" onClick={() => markRead.mutate({ id: item.id })} disabled={markRead.isPending}><Check className="mr-2 h-3.5 w-3.5" />Отметить прочитанной</Button>}</div></article>; })}</div>}
  </section>;
}
