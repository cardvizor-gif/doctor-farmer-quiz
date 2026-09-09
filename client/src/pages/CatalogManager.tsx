import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Download, FileSpreadsheet, RefreshCw, Upload, ShieldCheck } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const headers = [
  "ID препарата", "Наименование препарата", "Препаративная форма", "Категория", "Группа", "Действующее вещество", "Концентрация / состав", "Культуры", "Вредные объекты", "Фаза и время обработки", "Норма от", "Норма до", "Единица нормы", "Норма для отображения", "Расход рабочей жидкости", "Условия применения", "Ограничения и требования", "Срок ожидания, дней", "Кратность обработок", "Фасовка", "Единица продажи", "Минимальная партия", "Цена: 100% предоплата", "Цена: 50/50", "Цена: 70/30", "Цена: 100% отсрочка", "Валюта", "Статус препарата", "Регистрационный статус", "Источник / ссылка", "Дата начала действия", "Дата окончания действия", "Комментарий",
] as const;

type RawRow = Record<string, unknown>;
type ImportRow = {
  catalogId: string;
  name: string;
  preparativeForm?: string | null;
  category?: string | null;
  productGroup?: string | null;
  active?: number | null;
  registrationStatus?: string | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  pricePrepayment?: number | null;
  price5050?: number | null;
  price7030?: number | null;
  priceDeferred?: number | null;
  fullData: RawRow;
};

const text = (value: unknown) => String(value ?? "").trim();
const numberOrNull = (value: unknown) => {
  const normalized = text(value).replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
const dateOrNull = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw.split(".").reverse().join("-"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

function mapRow(row: RawRow, rowNumber: number): ImportRow {
  const catalogId = text(row["ID препарата"]);
  const name = text(row["Наименование препарата"]);
  if (!catalogId || !name) throw new Error(`Строка ${rowNumber}: обязательны «ID препарата» и «Наименование препарата»`);
  const status = text(row["Статус препарата"]).toLowerCase();
  return {
    catalogId,
    name,
    preparativeForm: text(row["Препаративная форма"]) || null,
    category: text(row["Категория"]) || null,
    productGroup: text(row["Группа"]) || null,
    active: status === "архив" ? 0 : 1,
    registrationStatus: text(row["Регистрационный статус"]) || null,
    effectiveFrom: dateOrNull(row["Дата начала действия"]),
    effectiveTo: dateOrNull(row["Дата окончания действия"]),
    pricePrepayment: numberOrNull(row["Цена: 100% предоплата"]),
    price5050: numberOrNull(row["Цена: 50/50"]),
    price7030: numberOrNull(row["Цена: 70/30"]),
    priceDeferred: numberOrNull(row["Цена: 100% отсрочка"]),
    fullData: row,
  };
}

function exportRows(products: Array<Record<string, unknown>>) {
  return products.map((product) => {
    let fullData: RawRow = {};
    try { fullData = JSON.parse(String(product.fullDataJson ?? "{}")); } catch { fullData = {}; }
    return {
      ...fullData,
      "ID препарата": product.catalogId,
      "Наименование препарата": product.name,
      "Препаративная форма": product.preparativeForm ?? fullData["Препаративная форма"] ?? "",
      "Категория": product.category ?? fullData["Категория"] ?? "",
      "Группа": product.productGroup ?? fullData["Группа"] ?? "",
      "Цена: 100% предоплата": product.pricePrepayment ?? "",
      "Цена: 50/50": product.price5050 ?? "",
      "Цена: 70/30": product.price7030 ?? "",
      "Цена: 100% отсрочка": product.priceDeferred ?? "",
      "Статус препарата": Number(product.active) === 1 ? "Активен" : "Архив",
      "Регистрационный статус": product.registrationStatus ?? fullData["Регистрационный статус"] ?? "",
    };
  });
}

export default function CatalogManager() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingRows, setPendingRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const productsQuery = trpc.catalog.list.useQuery(undefined, { retry: false });
  const historyQuery = trpc.catalog.history.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const importMutation = trpc.catalog.import.useMutation({
    onSuccess: async (result) => {
      setPendingRows([]);
      setFileName("");
      await Promise.all([utils.catalog.list.invalidate(), utils.catalog.history.invalidate()]);
      toast.success(`Импорт применён: ${result.imported} строк`);
    },
    onError: (error) => toast.error(error.message),
  });
  const currentProducts = productsQuery.data ?? [];
  const currentById = useMemo(() => new Map(currentProducts.map((product) => [product.catalogId, product])), [currentProducts]);
  const newCount = pendingRows.filter((row) => !currentById.has(row.catalogId)).length;
  const updateCount = pendingRows.length - newCount;

  const readFile = async (file: File) => {
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("В файле нет первого листа с номенклатурой");
      const rawRows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", range: 3 });
      if (!rawRows.length) throw new Error("На листе нет строк для импорта");
      const rows = rawRows.map((row, index) => mapRow(row, index + 5));
      const duplicateIds = rows.map((row) => row.catalogId).filter((id, index, ids) => ids.indexOf(id) !== index);
      if (duplicateIds.length) throw new Error(`Повторяющиеся ID препаратов: ${Array.from(new Set(duplicateIds)).join(", ")}`);
      setPendingRows(rows);
      setFileName(file.name);
      toast.success(`Файл прочитан: ${rows.length} строк. Проверьте предпросмотр.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось прочитать Excel-файл");
      setPendingRows([]);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadExport = () => {
    const rows = exportRows(currentProducts as Array<Record<string, unknown>>);
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [Object.fromEntries(headers.map((header) => [header, ""]))], { header: [...headers] });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Номенклатура");
    XLSX.writeFile(workbook, `АгроПомощник_DF_Номенклатура_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-3 py-4 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-[#174c3c] p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c6ef59]">Управление справочником</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Номенклатура препаратов</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#dcebdd]">Загрузите обновлённый Excel без кодинга. До подтверждения действующая номенклатура не меняется.</p>
          </div>
          <ShieldCheck className="h-10 w-10 text-[#c6ef59]" aria-hidden="true" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <Card className="border-[#dce9d8] shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-[#174c3c]"><FileSpreadsheet className="h-5 w-5" />Файл обновления</CardTitle></CardHeader><CardContent className="space-y-3">
          <Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readFile(file); }} />
          <p className="text-xs leading-5 text-[#64776b]">Используйте шаблон с листом «Номенклатура». Обязательны ID и наименование препарата.</p>
          <Button type="button" variant="outline" className="w-full" onClick={downloadExport}><Download className="mr-2 h-4 w-4" />Скачать текущую номенклатуру</Button>
          <Button type="button" className="w-full bg-[#174c3c] text-white hover:bg-[#10382c]" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Выбрать Excel для загрузки</Button>
        </CardContent></Card>

        <Card className="border-[#dce9d8] shadow-sm"><CardHeader><CardTitle className="flex items-center justify-between text-base text-[#174c3c]">Предпросмотр <span className="text-xs font-normal text-[#718477]">текущих позиций: {currentProducts.length}</span></CardTitle></CardHeader><CardContent>
          {!pendingRows.length ? <div className="rounded-2xl bg-[#f4f8f1] p-5 text-sm leading-6 text-[#64776b]">Выберите заполненный Excel-файл. Здесь появятся количество новых и изменяемых позиций до применения.</div> : <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3"><div className="rounded-2xl bg-[#eef6e8] p-3"><span className="block text-xs text-[#607568]">Файл</span><strong className="block truncate text-sm text-[#174c3c]">{fileName}</strong></div><div className="rounded-2xl bg-[#eef6e8] p-3"><span className="block text-xs text-[#607568]">Новых</span><strong className="text-xl text-[#174c3c]">{newCount}</strong></div><div className="rounded-2xl bg-[#fff2df] p-3"><span className="block text-xs text-[#8b5a20]">К обновлению</span><strong className="text-xl text-[#8b5a20]">{updateCount}</strong></div></div>
            <div className="max-h-52 overflow-auto rounded-2xl border border-[#e1eadd]"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-[#f4f8f1] text-[#607568]"><tr><th className="p-3">ID</th><th className="p-3">Препарат</th><th className="p-3">Группа</th><th className="p-3">Отсрочка</th></tr></thead><tbody className="divide-y divide-[#edf2eb]">{pendingRows.slice(0, 50).map((row) => <tr key={row.catalogId}><td className="p-3">{row.catalogId}</td><td className="p-3 font-semibold text-[#174c3c]">{row.name}</td><td className="p-3">{row.productGroup || "—"}</td><td className="p-3">{row.priceDeferred ?? "—"}</td></tr>)}</tbody></table></div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => { setPendingRows([]); setFileName(""); }}>Отменить</Button><Button type="button" disabled={importMutation.isPending} className="bg-[#174c3c] text-white hover:bg-[#10382c]" onClick={() => importMutation.mutate({ fileName, rows: pendingRows })}>{importMutation.isPending ? "Применяем…" : "Применить обновление"}</Button></div>
          </div>}
        </CardContent></Card>
      </section>

      <section className="rounded-3xl border border-[#dce9d8] bg-white p-4 shadow-sm sm:p-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold text-[#174c3c]">История загрузок</h2><Button type="button" variant="ghost" size="sm" onClick={() => void historyQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Обновить</Button></div>{!historyQuery.data?.length ? <p className="text-sm text-[#718477]">Загрузок пока не было.</p> : <div className="space-y-2">{historyQuery.data.map((batch) => <div key={batch.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f4f8f1] px-3 py-2 text-xs"><span className="font-semibold text-[#174c3c]">{batch.fileName}</span><span className="text-[#64776b]">{batch.rowCount} строк · {batch.status === "applied" ? "применено" : batch.status}</span></div>)}</div>}</section>
    </main>
  );
}
