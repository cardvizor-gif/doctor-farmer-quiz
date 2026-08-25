import { FARM_IMPORT_COLUMNS, FARM_IMPORT_MAX_ROWS, getMissingFarmImportColumns, previewFarmImportRows, type FarmImportPreviewRow } from "@shared/farmImport";
import type { Farm, Proposal } from "../../../drizzle/schema";

type XlsxModule = typeof import("xlsx");

type ImportFilePreview = {
  fileName: string;
  headerErrors: string[];
  rows: FarmImportPreviewRow[];
};

type ProposalSource = Pick<Proposal, "id" | "title" | "crop" | "technology" | "area" | "costPerHectare" | "totalCost" | "status" | "schemeJson" | "notes">;

type StoredScheme = {
  scheme?: {
    title?: string;
    description?: string;
    steps?: Array<{ stage?: string; task?: string; products?: Array<{ name?: string; group?: string; dv?: string; rate?: string }> }>;
  };
  paymentTerm?: string;
  discountPercent?: number;
  priceSource?: { title?: string };
  pricing?: {
    lines?: Array<{
      key?: string;
      pricePerUnit?: number | null;
      minTotal?: number | null;
      maxTotal?: number | null;
      minPackages?: number | null;
      maxPackages?: number | null;
      maxPallets?: number;
      excludedByManager?: boolean;
      requirement?: { label?: string };
    }>;
    unconfirmedLogisticsProducts?: string[];
    excludedProducts?: string[];
  };
};

const money = (value: number | string | null | undefined) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(value ?? 0));
const dateText = (value: Date | null | undefined) => value ? new Intl.DateTimeFormat("ru-RU").format(new Date(value)) : "";

async function loadXlsx(): Promise<XlsxModule> {
  return import("xlsx");
}

function downloadWorkbook(XLSX: XlsxModule, workbook: import("xlsx").WorkBook, fileName: string) {
  XLSX.writeFile(workbook, fileName, { compression: true });
}

function setSheetLayout(sheet: import("xlsx").WorkSheet, widths: number[]) {
  sheet["!cols"] = widths.map((width) => ({ wch: width }));
  sheet["!autofilter"] = { ref: sheet["!ref"] ?? "A1" };
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
}

export async function downloadFarmImportTemplate() {
  const XLSX = await loadXlsx();
  const template = XLSX.utils.aoa_to_sheet([[...FARM_IMPORT_COLUMNS], Array(FARM_IMPORT_COLUMNS.length).fill("")]);
  setSheetLayout(template, [32, 20, 20, 24, 20, 18, 28, 14, 42, 20, 18, 18, 34, 22, 48]);
  const guide = XLSX.utils.aoa_to_sheet([
    ["Шаблон импорта хозяйств Doctor Farmer"],
    ["Заполните первую вкладку «Хозяйства» и загрузите её в рабочем кабинете."],
    ["Обязательная колонка", "Название хозяйства *"],
    ["Поддерживаемые статусы", "Новый контакт; Диагностика; КП готовится; Согласование; Клиент"],
    ["Ограничение", `До ${FARM_IMPORT_MAX_ROWS} строк за один импорт`],
    ["Проверка", "Перед сохранением кабинет покажет все строки и ошибки. Ничего не записывается без подтверждения."],
  ]);
  guide["!cols"] = [{ wch: 28 }, { wch: 96 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, template, "Хозяйства");
  XLSX.utils.book_append_sheet(workbook, guide, "Как заполнить");
  downloadWorkbook(XLSX, workbook, "Doctor-Farmer-шаблон-импорта-хозяйств.xlsx");
}

export async function readFarmImportFile(file: File): Promise<ImportFilePreview> {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error("Загрузите файл Excel (.xlsx, .xls) или CSV.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Размер файла превышает 5 МБ. Разделите импорт на несколько файлов.");
  const XLSX = await loadXlsx();
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
  if (!sheet) throw new Error("В файле не найден лист с данными.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false, dateNF: "yyyy-mm-dd" });
  if (rows.length === 0) throw new Error("В файле нет строк для импорта.");
  if (rows.length > FARM_IMPORT_MAX_ROWS) throw new Error(`В одном файле допускается не более ${FARM_IMPORT_MAX_ROWS} строк.`);
  const headers = Object.keys(rows[0] ?? {});
  const headerErrors = getMissingFarmImportColumns(headers).map((column) => `Не найдена обязательная колонка «${column}». Скачайте и используйте шаблон.`);
  return { fileName: file.name, headerErrors, rows: headerErrors.length ? [] : previewFarmImportRows(rows) };
}

export async function downloadFarmsWorkbook(farms: Farm[]) {
  const XLSX = await loadXlsx();
  const rows = farms.map((farm) => ({
    "Название хозяйства": farm.name,
    "Район": farm.district ?? "",
    "Населённый пункт": farm.settlement ?? "",
    "Контактное лицо": farm.contactName ?? "",
    "Должность": farm.contactRole ?? "",
    "Телефон": farm.phone ?? "",
    "E-mail": farm.email ?? "",
    "Площадь, га": Number(farm.totalArea),
    "Культуры и площадь по ним": farm.crops ?? "",
    "Технология": farm.technology ?? "",
    "Статус работы": farm.salesStage,
    "Потенциал, ₽": Number(farm.potentialValue),
    "Следующее действие": farm.nextAction ?? "",
    "Дата следующего действия": dateText(farm.nextActionAt),
    "Рабочие заметки": farm.notes ?? "",
  }));
  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "Название хозяйства": "Нет сохранённых хозяйств" }]);
  setSheetLayout(sheet, [32, 20, 20, 24, 20, 18, 28, 14, 42, 20, 18, 18, 34, 22, 48]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Хозяйства");
  downloadWorkbook(XLSX, workbook, "Doctor-Farmer-реестр-хозяйств.xlsx");
}

function parseStoredScheme(value: string): StoredScheme {
  try {
    const parsed = JSON.parse(value) as StoredScheme;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function proposalRows(proposal: ProposalSource) {
  const stored = parseStoredScheme(proposal.schemeJson);
  return (stored.scheme?.steps ?? []).flatMap((step, stepIndex) => (step.products ?? []).map((product, productIndex) => {
    const line = stored.pricing?.lines?.find((item) => item.key === `${stepIndex}-${productIndex}`);
    const packages = line?.minPackages === null || line?.minPackages === undefined ? "" : line.minPackages === line.maxPackages ? `${line.maxPackages} уп.` : `${line.minPackages}–${line.maxPackages} уп.`;
    return {
      "Этап": step.stage ?? `Этап ${stepIndex + 1}`,
      "Задача": step.task ?? "",
      "Препарат": product.name ?? "",
      "Группа": product.group ?? "",
      "Действующее вещество": product.dv ?? "",
      "Норма": product.rate ?? "",
      "Потребность": line?.requirement?.label ?? "",
      "К отгрузке": packages,
      "Паллеты": line?.maxPallets ?? "",
      "Цена за единицу, ₽": line?.pricePerUnit ?? "",
      "Сумма, ₽": line?.maxTotal ?? "",
      "Статус": line?.excludedByManager ? "Исключено менеджером" : "В расчёте",
    };
  }));
}

export async function downloadProposalWorkbook(proposal: ProposalSource, farm?: Farm | null) {
  const XLSX = await loadXlsx();
  const stored = parseStoredScheme(proposal.schemeJson);
  const overview = XLSX.utils.aoa_to_sheet([
    ["Коммерческое предложение Doctor Farmer"],
    ["Хозяйство", farm?.name ?? "Не указано"],
    ["Название КП", proposal.title],
    ["Культура", proposal.crop],
    ["Технология", proposal.technology ?? ""],
    ["Площадь, га", Number(proposal.area)],
    ["Условие оплаты", stored.paymentTerm ?? ""],
    ["Скидка, %", stored.discountPercent ?? 0],
    ["Стоимость на гектар, ₽", Number(proposal.costPerHectare)],
    ["Итоговая стоимость, ₽", Number(proposal.totalCost)],
    ["Основание цены", stored.priceSource?.title ?? "Актуальный прайс Doctor Farmer"],
    ["Примечание", proposal.notes ?? ""],
    ["Логистика требует уточнения", stored.pricing?.unconfirmedLogisticsProducts?.join(", ") ?? ""],
    ["Временно не включено", stored.pricing?.excludedProducts?.join(", ") ?? ""],
  ]);
  overview["!cols"] = [{ wch: 32 }, { wch: 72 }];
  const productRows = proposalRows(proposal);
  const products = XLSX.utils.json_to_sheet(productRows.length ? productRows : [{ "Этап": "Состав схемы не сохранён" }]);
  setSheetLayout(products, [28, 28, 24, 20, 28, 14, 20, 16, 12, 18, 18, 24]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, overview, "КП");
  XLSX.utils.book_append_sheet(workbook, products, "Состав и расчёт");
  downloadWorkbook(XLSX, workbook, `Doctor-Farmer-КП-${proposal.id || "черновик"}.xlsx`);
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function printProposalAsPdf(proposal: ProposalSource, farm?: Farm | null) {
  const stored = parseStoredScheme(proposal.schemeJson);
  const rows = proposalRows(proposal);
  const printWindow = window.open("", "_blank");
  if (!printWindow) throw new Error("Браузер заблокировал окно печати. Разрешите всплывающие окна для этого сайта.");
  const productTable = rows.length
    ? rows.map((row) => `<tr><td>${escapeHtml(row["Этап"])}</td><td>${escapeHtml(row["Препарат"])}</td><td>${escapeHtml(row["Норма"])}</td><td>${escapeHtml(row["Потребность"])}</td><td>${escapeHtml(row["К отгрузке"])}</td><td>${escapeHtml(row["Сумма, ₽"] ? `${money(row["Сумма, ₽"])} ₽` : "")}</td></tr>`).join("")
    : "<tr><td colspan=6>Состав схемы не сохранён</td></tr>";
  printWindow.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"/><title>${escapeHtml(proposal.title)}</title><style>body{font-family:Arial,sans-serif;color:#15211c;margin:28px;font-size:12px}h1{color:#194f38;font-size:24px;margin:0 0 8px}.label{color:#527060;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:bold}.summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:18px 0}.item{background:#f4f8f3;border:1px solid #dce8dc;border-radius:8px;padding:9px}.value{font-weight:bold;font-size:14px;margin-top:3px}table{width:100%;border-collapse:collapse;margin-top:14px}th{background:#194f38;color:white;text-align:left;font-size:10px;padding:8px}td{border-bottom:1px solid #dce8dc;padding:8px;vertical-align:top}.note{margin-top:18px;padding:10px;background:#f5f8f4;white-space:pre-line}@media print{body{margin:12mm}.no-print{display:none}}</style></head><body><p class="label">Doctor Farmer · коммерческое предложение</p><h1>${escapeHtml(proposal.title)}</h1><div class="summary"><div class="item"><span class="label">Хозяйство</span><div class="value">${escapeHtml(farm?.name ?? "Не указано")}</div></div><div class="item"><span class="label">Культура и технология</span><div class="value">${escapeHtml(`${proposal.crop} · ${proposal.technology ?? "—"}`)}</div></div><div class="item"><span class="label">Площадь</span><div class="value">${escapeHtml(proposal.area)} га</div></div><div class="item"><span class="label">Итог по актуальному прайсу</span><div class="value">${money(proposal.totalCost)} ₽</div></div><div class="item"><span class="label">Условие оплаты</span><div class="value">${escapeHtml(stored.paymentTerm ?? "Не указано")}</div></div><div class="item"><span class="label">Скидка</span><div class="value">${escapeHtml(stored.discountPercent ?? 0)}%</div></div></div><h2>Состав схемы и расчёт</h2><table><thead><tr><th>Этап</th><th>Препарат</th><th>Норма</th><th>Потребность</th><th>К отгрузке</th><th>Сумма</th></tr></thead><tbody>${productTable}</tbody></table>${proposal.notes ? `<div class="note"><strong>Примечание</strong><br/>${escapeHtml(proposal.notes)}</div>` : ""}<p class="no-print" style="margin-top:24px;color:#527060">В диалоге печати выберите «Сохранить как PDF».</p><script>window.onload=()=>window.print()</script></body></html>`);
  printWindow.document.close();
}

export type { ImportFilePreview, ProposalSource };
