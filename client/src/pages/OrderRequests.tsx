import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRICE_CATALOG } from "@/data/priceCatalog";
import { trpc } from "@/lib/trpc";
import { Building2, ChevronDown, ChevronRight, ClipboardList, FilePlus2, PackageCheck, Plus, Printer, Save, Truck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ItemDraft = { id: string; productName: string; unit: string; quantity: string; unitPrice: string };
type RequestDraft = {
  farmId: string;
  requestDate: string;
  buyerName: string;
  segment: "agroholding" | "dealer" | "large" | "medium" | "small";
  paymentTerms: string;
  paymentDueDate: string;
  supplyDocuments: string;
  deliveryDueDate: string;
  edoStatus: "yes" | "no";
  edoProvider: string;
  notes: string;
  items: ItemDraft[];
};

const segments = {
  agroholding: "Агрохолдинг",
  dealer: "Дилер",
  large: "Крупный покупатель",
  medium: "Средний покупатель",
  small: "Мелкий покупатель",
} as const;

const requestStatuses = {
  draft: "Черновик",
  submitted: "Сохранена",
  partial: "Частичная отгрузка",
  shipped: "Отгружена",
  cancelled: "Отменена",
} as const;

const currency = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 });
const today = () => new Date().toISOString().slice(0, 10);
const asNumber = (value: string | number | null | undefined) => Number(value ?? 0);
const formatMoney = (value: string | number | null | undefined) => `${currency.format(asNumber(value))} ₽`;
const localDate = (value: string) => new Date(`${value}T12:00:00`);
const displayDate = (value: Date | null | undefined) => value ? new Intl.DateTimeFormat("ru-RU").format(new Date(value)) : "—";
const newItem = (): ItemDraft => ({ id: crypto.randomUUID(), productName: "", unit: "шт.", quantity: "", unitPrice: "" });
export const requestProductPlaceholder = "Выбрать препарат";

function emptyDraft(): RequestDraft {
  return {
    farmId: "",
    requestDate: today(),
    buyerName: "",
    segment: "medium",
    paymentTerms: "100%",
    paymentDueDate: "",
    supplyDocuments: "договор, спецификация, УПД, счет",
    deliveryDueDate: "",
    edoStatus: "no",
    edoProvider: "",
    notes: "",
    items: [newItem()],
  };
}

function renderRequestPrint(request: NonNullable<ReturnType<typeof useRequestDetails>>["data"]) {
  if (!request) return;
  const escaped = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
  const rows = request.items.map((item, index) => `<tr><td>${index + 1}</td><td>${escaped(item.productName)}</td><td>${escaped(number.format(asNumber(item.quantity)))} ${escaped(item.unit)}</td><td>${escaped(formatMoney(item.unitPrice))}</td><td>${escaped(formatMoney(item.lineTotal))}</td></tr>`).join("");
  const printWindow = window.open("", "_blank");
  if (!printWindow) return toast.error("Разрешите всплывающие окна, чтобы открыть печатную форму");
  printWindow.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"/><title>Заявка №${request.id}</title><style>body{font-family:Arial,sans-serif;color:#18251d;margin:22mm;font-size:12px}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #285b37;padding-bottom:12px}h1{font-size:23px;margin:0;color:#214e30}.sub{margin-top:5px;color:#526b58}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;margin:20px 0}.item{border-bottom:1px solid #d9e4d8;padding:5px 0}.label{display:block;font-size:9px;text-transform:uppercase;color:#5d725f;font-weight:bold;letter-spacing:.05em}table{width:100%;border-collapse:collapse;margin-top:15px}th{background:#285b37;color:white;text-align:left;padding:7px;font-size:10px}td{padding:7px;border-bottom:1px solid #dbe6dc;vertical-align:top}td:nth-child(1),td:nth-child(3),td:nth-child(4),td:nth-child(5){text-align:right}.total{margin-top:16px;text-align:right;font-size:15px;font-weight:bold}.sign{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:56px}.line{border-top:1px solid #18251d;padding-top:5px;font-size:10px}@media print{body{margin:12mm}}</style></head><body><div class="header"><div><h1>Заявка на поставку товара</h1><p class="sub">АгроПомощник DF · № ${request.id}</p></div><strong>Дата: ${escaped(displayDate(request.requestDate))}</strong></div><div class="grid"><div class="item"><span class="label">Покупатель</span>${escaped(request.buyerName)}</div><div class="item"><span class="label">Сегмент</span>${escaped(segments[request.segment])}</div><div class="item"><span class="label">ФИО менеджера</span>${escaped(request.managerName)}</div><div class="item"><span class="label">Хозяйство</span>${escaped(request.farm.name)}</div><div class="item"><span class="label">Условия оплаты</span>${escaped(request.paymentTerms)}${request.paymentDueDate ? ` · до ${escaped(displayDate(request.paymentDueDate))}` : ""}</div><div class="item"><span class="label">Условия поставки</span>${escaped(request.supplyDocuments || "—")}</div><div class="item"><span class="label">Срок поставки</span>${escaped(displayDate(request.deliveryDueDate))}</div><div class="item"><span class="label">ЭДО</span>${request.edoStatus === "yes" ? `Да${request.edoProvider ? ` · ${escaped(request.edoProvider)}` : ""}` : "Нет"}</div></div><table><thead><tr><th>№ п/п</th><th>Наименование товара</th><th>Кол-во</th><th>Цена, руб.</th><th>Сумма, руб.</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Итого: ${escaped(formatMoney(request.totalAmount))}</p>${request.notes ? `<p><span class="label">Примечание</span>${escaped(request.notes)}</p>` : ""}<div class="sign"><div class="line">Менеджер / ${escaped(request.managerName)}</div><div class="line">Принято бухгалтерией</div></div><script>window.onload=()=>window.print()</script></body></html>`);
  printWindow.document.close();
}

function useRequestDetails(id: number | null) {
  return trpc.orderRequests.byId.useQuery({ id: id ?? 0 }, { enabled: Boolean(id) });
}

export default function OrderRequests() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: farms = [] } = trpc.farms.list.useQuery();
  const { data: requests = [], isLoading } = trpc.orderRequests.list.useQuery();
  const [isCreating, setIsCreating] = useState(false);
  const [shouldPrintAfterSave, setShouldPrintAfterSave] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<RequestDraft>(emptyDraft);
  const [shipmentDate, setShipmentDate] = useState(today());
  const [shipmentDocument, setShipmentDocument] = useState("");
  const [shipmentNotes, setShipmentNotes] = useState("");
  const [shipmentLines, setShipmentLines] = useState<Array<{ requestItemId: number; quantity: string; unitPrice: string }>>([]);
  const detailsQuery = useRequestDetails(selectedId);
  const details = detailsQuery.data;
  const productNames = useMemo(() => Array.from(new Set(PRICE_CATALOG.filter((item) => !item.name.includes("*")).map((item) => item.name))).sort((a, b) => a.localeCompare(b, "ru")), []);

  useEffect(() => {
    if (!details) return;
    setShipmentLines(details.items.map((item) => ({ requestItemId: item.id, quantity: Math.max(0, asNumber(item.quantity) - asNumber(item.shippedQuantity)).toString(), unitPrice: asNumber(item.unitPrice).toString() })));
    setShipmentDate(today());
    setShipmentDocument("");
    setShipmentNotes("");
  }, [details]);

  const saveRequest = trpc.orderRequests.create.useMutation({
    onSuccess: async (request) => {
      await utils.orderRequests.list.invalidate();
      setSelectedId(request.id);
      setDraft(emptyDraft());
      setIsCreating(false);
      if (shouldPrintAfterSave) {
        renderRequestPrint(request);
        setShouldPrintAfterSave(false);
      }
      toast.success("Заявка сохранена");
    },
    onError: (error) => {
      setShouldPrintAfterSave(false);
      toast.error(error.message);
    },
  });
  const updateRequest = trpc.orderRequests.update.useMutation({
    onSuccess: async (request) => {
      await utils.orderRequests.list.invalidate();
      setEditingId(null);
      setIsCreating(false);
      setSelectedId(request.id);
      toast.success("Заявка обновлена");
    },
    onError: (error) => toast.error(error.message),
  });
  const removeRequest = trpc.orderRequests.remove.useMutation({
    onSuccess: async () => {
      await utils.orderRequests.list.invalidate();
      setSelectedId(null);
      toast.success("Черновик заявки удалён");
    },
    onError: (error) => toast.error(error.message),
  });
  const saveShipment = trpc.orderRequests.createShipment.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.orderRequests.list.invalidate(), detailsQuery.refetch()]);
      toast.success("Отгрузка добавлена в историю");
    },
    onError: (error) => toast.error(error.message),
  });

  const setFarm = (farmId: string) => {
    const farm = farms.find((item) => item.id === Number(farmId));
    setDraft((current) => ({ ...current, farmId, buyerName: farm?.name ?? current.buyerName }));
  };
  const patchItem = (id: string, patch: Partial<ItemDraft>) => setDraft((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  const requestTotal = draft.items.reduce((sum, item) => sum + asNumber(item.quantity) * asNumber(item.unitPrice), 0);
  const canModifySelected = Boolean(details && details.shipments.length === 0 && (details.status === "draft" || details.status === "submitted"));

  const createRequest = (printAfterSave: boolean) => {
    const validItems = draft.items.filter((item) => item.productName.trim() && asNumber(item.quantity) > 0);
    if (!draft.farmId) return toast.error("Выберите хозяйство");
    if (!draft.buyerName.trim()) return toast.error("Укажите покупателя");
    if (validItems.length === 0) return toast.error("Добавьте товар и количество");
    if (validItems.some((item) => asNumber(item.unitPrice) < 0)) return toast.error("Цена не может быть отрицательной");
    setShouldPrintAfterSave(printAfterSave);
    const payload = {
      farmId: Number(draft.farmId),
      requestDate: localDate(draft.requestDate),
      buyerName: draft.buyerName,
      segment: draft.segment,
      paymentTerms: draft.paymentTerms,
      paymentDueDate: draft.paymentDueDate ? localDate(draft.paymentDueDate) : null,
      supplyDocuments: draft.supplyDocuments || null,
      deliveryDueDate: draft.deliveryDueDate ? localDate(draft.deliveryDueDate) : null,
      edoStatus: draft.edoStatus,
      edoProvider: draft.edoStatus === "yes" ? draft.edoProvider || null : null,
      notes: draft.notes || null,
      status: "submitted" as const,
      items: validItems.map(({ productName, unit, quantity, unitPrice }) => ({ productName, unit, quantity: asNumber(quantity), unitPrice: asNumber(unitPrice) })),
    };
    if (editingId) updateRequest.mutate({ id: editingId, ...payload, status: "submitted" });
    else saveRequest.mutate(payload);
  };

  const submitShipment = () => {
    if (!details) return;
    const lines = shipmentLines.filter((item) => asNumber(item.quantity) > 0);
    if (!lines.length) return toast.error("Укажите количество хотя бы по одной позиции");
    saveShipment.mutate({
      requestId: details.id,
      shipmentDate: localDate(shipmentDate),
      documentNumber: shipmentDocument || null,
      notes: shipmentNotes || null,
      items: lines.map((item) => ({ requestItemId: item.requestItemId, quantity: asNumber(item.quantity), unitPrice: asNumber(item.unitPrice) })),
    });
  };

  return <section className="order-requests-page mx-auto max-w-7xl">
    <div className="rounded-[2rem] bg-[linear-gradient(130deg,#214e30,#4c7840)] p-7 text-white shadow-[0_20px_50px_rgba(31,75,44,0.22)] sm:p-9"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ddf2ad]">Документы отгрузки</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Заявки на поставку</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">Заполните форму, сохраните номенклатуру и распечатайте готовую заявку. История фактических отгрузок ведётся по каждой заявке.</p></div><Button type="button" onClick={() => setIsCreating(true)} className="shrink-0 bg-[#d5f63d] text-[#183d25] hover:bg-[#e4ff72]"><FilePlus2 className="mr-2 h-4 w-4" />Новая заявка</Button></div><div className="mt-6 grid max-w-xl grid-cols-3 gap-3"><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{requests.length}</strong><span className="mt-1 block text-xs text-white/70">заявок</span></div><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{requests.filter((item) => item.status === "submitted").length}</strong><span className="mt-1 block text-xs text-white/70">сохранено</span></div><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{requests.filter((item) => item.status === "partial" || item.status === "shipped").length}</strong><span className="mt-1 block text-xs text-white/70">с отгрузкой</span></div></div></div>
    
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(280px,0.86fr)_minmax(0,1.45fr)]"><div className="overflow-hidden rounded-3xl border border-[#e3ebe0] bg-white shadow-sm"><div className="border-b border-[#edf2ea] px-6 py-5"><h3 className="font-extrabold text-[#244b2d]">Сохранённые заявки</h3><p className="mt-1 text-sm text-[#6b7b68]">Ваши заявки и их текущий статус.</p></div>{isLoading ? <p className="p-6 text-sm text-[#6b7b68]">Загружаем заявки…</p> : requests.length === 0 ? <div className="p-8 text-center"><ClipboardList className="mx-auto h-9 w-9 text-[#93ab8f]" /><p className="mt-3 font-bold text-[#315d36]">Заявок пока нет</p><p className="mt-1 text-sm text-[#6b7b68]">Создайте первую форму и распечатайте её после сохранения.</p></div> : <div className="divide-y divide-[#edf2ea]">{requests.map((request) => <button type="button" key={request.id} onClick={() => setSelectedId(request.id)} className={`w-full px-5 py-4 text-left transition hover:bg-[#f6faf3] ${selectedId === request.id ? "bg-[#f0f8e8]" : ""}`}><div className="flex items-start justify-between gap-3"><div><strong className="block text-sm text-[#244b2d]">{request.farmName}</strong><span className="mt-1 block text-xs text-[#748270]">Заявка №{request.id} · {displayDate(request.requestDate)}</span></div><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#6b8d55]" /></div><div className="mt-3 flex items-center justify-between gap-2"><span className="rounded-full bg-[#edf4e7] px-2.5 py-1 text-[10px] font-bold text-[#4c7446]">{requestStatuses[request.status]}</span><strong className="text-xs text-[#315d36]">{formatMoney(request.totalAmount)}</strong></div></button>)}</div>}</div>

      <div className="overflow-hidden rounded-3xl border border-[#e3ebe0] bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-[#edf2ea] px-6 py-5 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-extrabold text-[#244b2d]">Карточка заявки и отгрузки</h3><p className="mt-1 text-sm text-[#6b7b68]">Номенклатура и фактическая история поставок.</p></div>{details && <div className="flex flex-wrap gap-2">{canModifySelected && <><Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(details.id); setDraft({ farmId: String(details.farmId), requestDate: new Date(details.requestDate).toISOString().slice(0, 10), buyerName: details.buyerName, segment: details.segment, paymentTerms: details.paymentTerms, paymentDueDate: details.paymentDueDate ? new Date(details.paymentDueDate).toISOString().slice(0, 10) : "", supplyDocuments: details.supplyDocuments ?? "", deliveryDueDate: details.deliveryDueDate ? new Date(details.deliveryDueDate).toISOString().slice(0, 10) : "", edoStatus: details.edoStatus, edoProvider: details.edoProvider ?? "", notes: details.notes ?? "", items: details.items.map((item) => ({ id: crypto.randomUUID(), productName: item.productName, unit: item.unit, quantity: String(item.quantity), unitPrice: String(item.unitPrice) })) }); setIsCreating(true); }}>Изменить</Button><Button type="button" variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" disabled={removeRequest.isPending} onClick={() => { if (window.confirm("Удалить эту сохранённую заявку без отгрузок?")) removeRequest.mutate({ id: details.id }); }}>Удалить</Button></>}<Button type="button" variant="outline" size="sm" onClick={() => renderRequestPrint(details)}><Printer className="mr-2 h-4 w-4" />Печать</Button></div>}</div>{!selectedId ? <div className="p-10 text-center"><PackageCheck className="mx-auto h-10 w-10 text-[#9ab594]" /><p className="mt-3 font-bold text-[#315d36]">Выберите заявку</p><p className="mt-1 text-sm text-[#6b7b68]">Здесь появятся её строки и история отгрузок.</p></div> : detailsQuery.isLoading ? <p className="p-8 text-sm text-[#6b7b68]">Загружаем заявку…</p> : !details ? <p className="p-8 text-sm text-[#9a5b51]">Не удалось загрузить заявку.</p> : <div className="space-y-6 p-6"><div className="grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-2xl bg-[#f5f9f2] p-4"><span className="block text-[10px] font-bold uppercase tracking-wide text-[#6f8b69]">Покупатель</span><strong className="mt-1 block text-[#244b2d]">{details.buyerName}</strong><span className="mt-1 block text-xs text-[#6b7b68]">{segments[details.segment]} · {details.managerName}</span></div><div className="rounded-2xl bg-[#f5f9f2] p-4"><span className="block text-[10px] font-bold uppercase tracking-wide text-[#6f8b69]">Условия</span><strong className="mt-1 block text-[#244b2d]">{details.paymentTerms}</strong><span className="mt-1 block text-xs text-[#6b7b68]">Поставка до {displayDate(details.deliveryDueDate)} · ЭДО: {details.edoStatus === "yes" ? details.edoProvider || "Да" : "Нет"}</span></div></div><div><div className="mb-3 flex items-center justify-between"><h4 className="font-extrabold text-[#244b2d]">Номенклатура</h4><strong className="text-sm text-[#315d36]">{formatMoney(details.totalAmount)}</strong></div><div className="overflow-x-auto rounded-2xl border border-[#e5ede3]"><table className="w-full min-w-[590px] text-left text-xs"><thead className="bg-[#f5f9f2] text-[#577253]"><tr><th className="p-3">Товар</th><th className="p-3 text-right">Заказано</th><th className="p-3 text-right">Отгружено</th><th className="p-3 text-right">Остаток</th><th className="p-3 text-right">Цена</th><th className="p-3 text-right">Сумма</th></tr></thead><tbody className="divide-y divide-[#edf2ea]">{details.items.map((item) => <tr key={item.id}><td className="p-3 font-semibold text-[#244b2d]">{item.productName}</td><td className="p-3 text-right">{number.format(asNumber(item.quantity))} {item.unit}</td><td className="p-3 text-right text-[#4c7446]">{number.format(asNumber(item.shippedQuantity))} {item.unit}</td><td className="p-3 text-right">{number.format(Math.max(0, asNumber(item.quantity) - asNumber(item.shippedQuantity)))} {item.unit}</td><td className="p-3 text-right">{formatMoney(item.unitPrice)}</td><td className="p-3 text-right font-bold">{formatMoney(item.lineTotal)}</td></tr>)}</tbody></table></div></div>{details.status !== "draft" && details.status !== "cancelled" && details.status !== "shipped" && <div className="rounded-2xl border border-[#d9e9d3] bg-[#f8fcf5] p-4"><div className="flex items-center gap-2"><Truck className="h-4 w-4 text-[#4d7b3c]" /><h4 className="font-extrabold text-[#315d36]">Добавить отгрузку</h4></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-[#526f50]">Дата отгрузки<Input type="date" value={shipmentDate} onChange={(event) => setShipmentDate(event.target.value)} className="mt-1" /></label><label className="text-xs font-bold text-[#526f50]">УПД / накладная<Input value={shipmentDocument} onChange={(event) => setShipmentDocument(event.target.value)} className="mt-1" placeholder="Например, УПД-542" /></label></div><div className="mt-4 space-y-2">{details.items.map((item) => { const line = shipmentLines.find((candidate) => candidate.requestItemId === item.id); const remaining = Math.max(0, asNumber(item.quantity) - asNumber(item.shippedQuantity)); return <div key={item.id} className="grid gap-2 rounded-xl border border-[#e2ecdd] bg-white p-3 sm:grid-cols-[1fr_100px_120px]"><div><strong className="block text-sm text-[#315d36]">{item.productName}</strong><span className="text-xs text-[#73846f]">Остаток: {number.format(remaining)} {item.unit}</span></div><Input type="number" min="0" max={remaining} step="0.001" value={line?.quantity ?? "0"} onChange={(event) => setShipmentLines((current) => current.map((candidate) => candidate.requestItemId === item.id ? { ...candidate, quantity: event.target.value } : candidate))} aria-label={`Количество ${item.productName}`} /><Input type="number" min="0" step="0.01" value={line?.unitPrice ?? "0"} onChange={(event) => setShipmentLines((current) => current.map((candidate) => candidate.requestItemId === item.id ? { ...candidate, unitPrice: event.target.value } : candidate))} aria-label={`Цена ${item.productName}`} /></div>})}</div><label className="mt-3 block text-xs font-bold text-[#526f50]">Комментарий<Input value={shipmentNotes} onChange={(event) => setShipmentNotes(event.target.value)} className="mt-1" placeholder="Например, отгрузка первой партии" /></label><div className="mt-4 flex justify-end"><Button type="button" disabled={saveShipment.isPending} onClick={submitShipment} className="bg-[#315d36] text-white hover:bg-[#244b2d]"><Truck className="mr-2 h-4 w-4" />{saveShipment.isPending ? "Сохраняем…" : "Добавить в историю"}</Button></div></div>}<div><h4 className="mb-3 font-extrabold text-[#244b2d]">История отгрузок</h4>{details.shipments.length === 0 ? <p className="rounded-2xl bg-[#fafcf8] p-4 text-sm text-[#748270]">Фактических отгрузок пока нет.</p> : <div className="space-y-3">{details.shipments.map((shipment) => <div key={shipment.id} className="rounded-2xl border border-[#e4ece1] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-[#315d36]">{displayDate(shipment.shipmentDate)}{shipment.documentNumber ? ` · ${shipment.documentNumber}` : ""}</strong><span className="text-xs text-[#70806e]">{shipment.items.reduce((sum, item) => sum + asNumber(item.lineTotal), 0).toLocaleString("ru-RU")} ₽</span></div><div className="mt-3 space-y-1 text-xs text-[#60745d]">{shipment.items.map((item) => <p key={item.id}>{item.productName} — {number.format(asNumber(item.quantity))} {item.unit} × {formatMoney(item.unitPrice)} = <strong>{formatMoney(item.lineTotal)}</strong></p>)}</div>{shipment.notes && <p className="mt-3 border-t border-[#edf2ea] pt-3 text-xs text-[#70806e]">{shipment.notes}</p>}</div>)}</div>}</div></div>}</div></div>

    {isCreating && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17381f]/45 p-0 sm:items-center sm:p-4"><div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#4d7b3c]">{editingId ? "Редактирование" : "Новый документ"}</p><h2 className="mt-1 text-2xl font-extrabold text-[#244b2d]">Заявка на поставку</h2><p className="mt-1 text-sm text-[#6b7b68]">Менеджер: {user?.displayName || user?.name || user?.email || "Рабочий аккаунт"}. Поля хозяйства и покупателя можно уточнить перед сохранением.</p></div><Button type="button" variant="ghost" onClick={() => setIsCreating(false)} aria-label="Закрыть форму"><X className="h-5 w-5" /></Button></div><div className="mt-6 grid gap-4 md:grid-cols-3"><label className="text-xs font-bold text-[#526f50]">Дата заявки<Input type="date" value={draft.requestDate} onChange={(event) => setDraft((current) => ({ ...current, requestDate: event.target.value }))} className="mt-1" /></label><label className="text-xs font-bold text-[#526f50]">Хозяйство<select value={draft.farmId} onChange={(event) => setFarm(event.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"><option value="">Выберите хозяйство</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label><label className="text-xs font-bold text-[#526f50]">Покупатель<Input value={draft.buyerName} onChange={(event) => setDraft((current) => ({ ...current, buyerName: event.target.value }))} className="mt-1" /></label><label className="text-xs font-bold text-[#526f50]">Сегмент<select value={draft.segment} onChange={(event) => setDraft((current) => ({ ...current, segment: event.target.value as RequestDraft["segment"] }))} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50">{Object.entries(segments).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-bold text-[#526f50]">Условия оплаты<select value={draft.paymentTerms} onChange={(event) => setDraft((current) => ({ ...current, paymentTerms: event.target.value }))} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"><option>30/70%</option><option>50/50%</option><option>100%</option></select></label><label className="text-xs font-bold text-[#526f50]">Срок оплаты до<Input type="date" value={draft.paymentDueDate} onChange={(event) => setDraft((current) => ({ ...current, paymentDueDate: event.target.value }))} className="mt-1" /></label><label className="text-xs font-bold text-[#526f50] md:col-span-2">Документы для поставки<Input value={draft.supplyDocuments} onChange={(event) => setDraft((current) => ({ ...current, supplyDocuments: event.target.value }))} className="mt-1" /></label><label className="text-xs font-bold text-[#526f50]">Срок поставки до<Input type="date" value={draft.deliveryDueDate} onChange={(event) => setDraft((current) => ({ ...current, deliveryDueDate: event.target.value }))} className="mt-1" /></label><label className="text-xs font-bold text-[#526f50]">Работает в ЭДО<select value={draft.edoStatus} onChange={(event) => setDraft((current) => ({ ...current, edoStatus: event.target.value as "yes" | "no" }))} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"><option value="no">Нет</option><option value="yes">Да</option></select></label>{draft.edoStatus === "yes" && <label className="text-xs font-bold text-[#526f50]">Оператор ЭДО<select value={draft.edoProvider} onChange={(event) => setDraft((current) => ({ ...current, edoProvider: event.target.value }))} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"><option value="">Выберите оператора</option><option>Контур.Диадок</option><option>СБИС.Тензор</option><option>Другой</option></select></label>}</div><div className="mt-6"><div className="flex items-center justify-between gap-3"><div><h3 className="font-extrabold text-[#244b2d]">Номенклатура</h3><p className="mt-1 text-xs text-[#6b7b68]">Количество и цена сохраняются как часть заявки.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setDraft((current) => ({ ...current, items: [...current.items, newItem()] }))}><Plus className="mr-2 h-4 w-4" />Строка</Button></div><datalist id="request-products">{productNames.map((name) => <option key={name} value={name} />)}</datalist><div className="mt-3 space-y-2">{draft.items.map((item, index) => <div key={item.id} className="grid gap-2 rounded-2xl border border-[#e4ece1] p-3 md:grid-cols-[minmax(0,1fr)_88px_110px_140px_38px]"><div className="relative"><Input list="request-products" value={item.productName} onChange={(event) => patchItem(item.id, { productName: event.target.value })} placeholder={requestProductPlaceholder} aria-label={`Препарат ${index + 1}`} className="pr-10" /><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f795d]" /></div><select value={item.unit} onChange={(event) => patchItem(item.id, { unit: event.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs"><option>шт.</option><option>л</option><option>кг</option><option>канистра</option><option>уп.</option></select><Input type="number" min="0" step="0.001" value={item.quantity} onChange={(event) => patchItem(item.id, { quantity: event.target.value })} placeholder="Кол-во" /><Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => patchItem(item.id, { unitPrice: event.target.value })} placeholder="Цена, ₽" /><Button type="button" variant="ghost" size="icon" disabled={draft.items.length === 1} onClick={() => setDraft((current) => ({ ...current, items: current.items.filter((candidate) => candidate.id !== item.id) }))} aria-label={`Удалить строку ${index + 1}`}><X className="h-4 w-4" /></Button></div>)}</div><div className="mt-3 text-right text-sm font-extrabold text-[#315d36]">Итого: {formatMoney(requestTotal)}</div></div><label className="mt-5 block text-xs font-bold text-[#526f50]">Примечание<Input value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} className="mt-1" placeholder="Дополнительные условия или комментарий" /></label><div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#edf2ea] pt-5 sm:flex-row sm:items-center sm:justify-between"><Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Отмена</Button><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={saveRequest.isPending} onClick={() => createRequest(false)}><Save className="mr-2 h-4 w-4" />Сохранить заявку</Button><Button type="button" disabled={saveRequest.isPending} onClick={() => createRequest(true)} className="bg-[#315d36] text-white hover:bg-[#244b2d]"><Printer className="mr-2 h-4 w-4" />{saveRequest.isPending ? "Сохраняем…" : "Сохранить и распечатать"}</Button></div></div></div></div>}
  </section>;
}
