import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CROP_OPTIONS } from "@/data/agropom";
import { PROTECTION_SCHEMES } from "@/data/protectionSchemes";
import {
  categoriesForStep,
  productsForCategory,
  TREATMENT_CATEGORIES,
  type CatalogProduct,
  type TreatmentCategory,
} from "@/data/schemeProductCatalog";
import { PAYMENT_TERMS, SPK_URAL_PRICE_SOURCE, type PaymentTerm } from "@/data/spkUralPrice";
import { addProductToScheme, applyRateOverrides, buildProposalTitle, calculateSchemePricing, getSchemeForProposal, parseProposalContext, type ManualRateOverrides } from "@/lib/proposal";
import { trpc } from "@/lib/trpc";
import { downloadProposalWorkbook, printProposalAsPdf, type ProposalSource } from "@/lib/workspaceTransfer";
import { ArrowLeft, CheckCircle2, CircleDollarSign, FileDown, FileText, Layers3, Plus, Printer, Save, Sprout } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const formatMoney = (value: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value || 0);
const formatMoneyRange = (min: number, max: number) => min === max ? formatMoney(min) : `${formatMoney(min)}–${formatMoney(max)}`;
const MANAGER_ADDED_NOTE = "Добавлено менеджером";

export default function ProposalBuilder() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const initialContext = parseProposalContext(window.location.search);
  const initialCrop = CROP_OPTIONS.find((crop) => crop.id === initialContext.cropId) ?? CROP_OPTIONS[0];
  const initialTechnology = initialCrop.technologies.includes(initialContext.technology ?? "") ? initialContext.technology! : initialCrop.technologies[0];
  const farmsQuery = trpc.farms.list.useQuery();
  const farms = farmsQuery.data ?? [];

  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(() => initialContext.farmId);
  const [cropId, setCropId] = useState(initialCrop.id);
  const [technology, setTechnology] = useState(initialTechnology);
  const [area, setArea] = useState(initialContext.area ? String(initialContext.area) : "");
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerm>("deferred");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [seedTons, setSeedTons] = useState("");
  const [excludedLineKeys, setExcludedLineKeys] = useState<string[]>([]);
  const [manualPriceOverrides, setManualPriceOverrides] = useState<Record<string, number>>({});
  const [manualRateOverrides, setManualRateOverrides] = useState<ManualRateOverrides>({});
  const [addedProductsByStep, setAddedProductsByStep] = useState<Record<number, CatalogProduct[]>>({});
  const [categoryByStep, setCategoryByStep] = useState<Record<number, TreatmentCategory>>({});
  const [productByStep, setProductByStep] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState("");
  const [savedProposalId, setSavedProposalId] = useState<number | null>(null);
  const [printNotice, setPrintNotice] = useState("");

  const selectedFarm = farms.find((farm) => farm.id === selectedFarmId) ?? null;
  const selectedCrop = CROP_OPTIONS.find((crop) => crop.id === cropId) ?? CROP_OPTIONS[0];
  const baseScheme = useMemo(() => getSchemeForProposal(PROTECTION_SCHEMES, cropId, technology), [cropId, technology]);
  const editableScheme = useMemo(() => {
    if (!baseScheme) return null;
    const schemeWithAddedProducts = Object.entries(addedProductsByStep).reduce((currentScheme, [stepIndex, products]) => (
      products.reduce((nextScheme, product) => addProductToScheme(nextScheme, Number(stepIndex), product), currentScheme)
    ), baseScheme);
    return applyRateOverrides(schemeWithAddedProducts, manualRateOverrides);
  }, [baseScheme, addedProductsByStep, manualRateOverrides]);

  const numericArea = Number(area || 0);
  const hasSeedTreatment = Boolean(editableScheme?.steps.some((step) => step.products.some((product) => /(л|кг)\s*\/\s*т/i.test(product.rate))));
  const numericSeedTons = Number(seedTons);
  const validSeedTonnage = !hasSeedTreatment || (Number.isFinite(numericSeedTons) && numericSeedTons > 0);
  const pricing = useMemo(
    () => editableScheme ? calculateSchemePricing(editableScheme, numericArea, paymentTerm, discountPercent, excludedLineKeys, manualPriceOverrides, hasSeedTreatment && validSeedTonnage ? numericSeedTons : undefined) : null,
    [editableScheme, numericArea, paymentTerm, discountPercent, excludedLineKeys, manualPriceOverrides, hasSeedTreatment, validSeedTonnage, numericSeedTons],
  );
  const proposalsQuery = trpc.proposals.list.useQuery(selectedFarmId ? { farmId: selectedFarmId } : undefined);

  useEffect(() => {
    if (farms.length && !selectedFarm) {
      const firstFarm = farms[0];
      setSelectedFarmId(firstFarm.id);
      setArea((currentArea) => currentArea || String(firstFarm.totalArea ?? ""));
    }
  }, [farms, selectedFarm]);

  useEffect(() => {
    if (selectedFarm && !area) setArea(String(selectedFarm.totalArea ?? ""));
  }, [selectedFarm, area]);

  const createProposal = trpc.proposals.create.useMutation({
    onSuccess: async (proposal) => {
      if (proposal) setSavedProposalId(proposal.id);
      await utils.proposals.list.invalidate();
      toast.success("Коммерческое предложение сохранено в карточке хозяйства");
    },
    onError: (error) => toast.error(error.message),
  });

  const canSaveProposal = Boolean(editableScheme && selectedFarm && pricing?.complete && validSeedTonnage && !createProposal.isPending);
  const saveButtonLabel = createProposal.isPending
    ? "Сохраняем КП…"
    : !selectedFarm
      ? "Выберите хозяйство для сохранения КП"
      : !validSeedTonnage
        ? "Укажите тоннаж семян для протравливания"
      : !pricing?.complete
        ? "Не все позиции имеют цену"
        : pricing.lines.some((line) => line.isManualPrice)
          ? "Сохранить КП с ручными ценами"
          : "Сохранить КП";

  const resetSchemeEdits = () => {
    setExcludedLineKeys([]);
    setManualPriceOverrides({});
    setManualRateOverrides({});
    setAddedProductsByStep({});
    setCategoryByStep({});
    setProductByStep({});
    setSavedProposalId(null);
  };

  const chooseFarm = (farmId: number) => {
    const farm = farms.find((item) => item.id === farmId);
    setSelectedFarmId(farmId);
    setArea(String(farm?.totalArea ?? ""));
    setSavedProposalId(null);
  };

  const chooseCrop = (newCropId: string) => {
    const crop = CROP_OPTIONS.find((item) => item.id === newCropId) ?? CROP_OPTIONS[0];
    setCropId(crop.id);
    setTechnology(crop.technologies[0]);
    setSeedTons("");
    resetSchemeEdits();
  };

  const toggleLine = (key: string) => {
    setExcludedLineKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    setSavedProposalId(null);
  };

  const setManualPrice = (key: string, rawValue: string) => {
    const normalized = rawValue.trim().replace(",", ".");
    if (!normalized) {
      setManualPriceOverrides((current) => {
        const { [key]: _removed, ...remaining } = current;
        return remaining;
      });
      setSavedProposalId(null);
      return;
    }
    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0) return;
    setManualPriceOverrides((current) => ({ ...current, [key]: value }));
    setSavedProposalId(null);
  };

  const resetManualPrice = (key: string) => {
    setManualPriceOverrides((current) => {
      const { [key]: _removed, ...remaining } = current;
      return remaining;
    });
    setSavedProposalId(null);
  };

  const setManualRate = (key: string, rawValue: string) => {
    const normalized = rawValue.trim().replace(",", ".");
    setManualRateOverrides((current) => {
      if (!normalized) {
        const { [key]: _removed, ...remaining } = current;
        return remaining;
      }
      return { ...current, [key]: rawValue };
    });
    setSavedProposalId(null);
  };

  const resetManualRate = (key: string) => {
    setManualRateOverrides((current) => {
      const { [key]: _removed, ...remaining } = current;
      return remaining;
    });
    setSavedProposalId(null);
  };

  const selectCategoryForStep = (stepIndex: number, category: TreatmentCategory) => {
    const firstProduct = productsForCategory(category)[0];
    setCategoryByStep((current) => ({ ...current, [stepIndex]: category }));
    if (firstProduct) setProductByStep((current) => ({ ...current, [stepIndex]: firstProduct.id }));
  };

  const addProductToStep = (stepIndex: number) => {
    if (!editableScheme) return;
    const step = editableScheme.steps[stepIndex];
    const categories = categoriesForStep(step?.stage ?? "", step?.task ?? "");
    const category = categoryByStep[stepIndex] ?? categories[0];
    const products = category ? productsForCategory(category) : [];
    const selectedProduct = products.find((product) => product.id === (productByStep[stepIndex] ?? products[0]?.id));
    if (!selectedProduct) return;
    if (step?.products.some((product) => product.name === selectedProduct.name)) {
      toast.error("Этот препарат уже добавлен в этап схемы");
      return;
    }
    setAddedProductsByStep((current) => ({ ...current, [stepIndex]: [...(current[stepIndex] ?? []), selectedProduct] }));
    setSavedProposalId(null);
    toast.success(`${selectedProduct.name} добавлен в схему`);
  };

  const saveProposal = () => {
    if (!selectedFarm) return toast.error("Сначала выберите хозяйство");
    if (!editableScheme) return toast.error("Для выбранной культуры нет готовой схемы");
    if (numericArea <= 0) return toast.error("Укажите площадь обработки больше нуля");
    if (!validSeedTonnage) return toast.error("Укажите фактический тоннаж семян для расчёта протравителей");
    if (!pricing?.complete) return toast.error("В схеме есть позиции без подтверждённой цены из актуального прайса");
    createProposal.mutate({
      farmId: selectedFarm.id,
      title: buildProposalTitle(editableScheme, selectedFarm.name),
      crop: selectedCrop.name,
      technology,
      area: numericArea,
      costPerHectare: pricing.maxPerHectare,
      totalCost: pricing.maxTotal,
      schemeJson: JSON.stringify({
        scheme: editableScheme,
        selectedCrop,
        area: numericArea,
        seedTons: hasSeedTreatment && validSeedTonnage ? numericSeedTons : null,
        paymentTerm,
        discountPercent,
        excludedLineKeys,
        manualPriceOverrides,
        manualRateOverrides,
        addedProductsByStep,
        pricing,
        priceSource: pricing.lines.some((line) => line.isManualPrice) ? { ...SPK_URAL_PRICE_SOURCE, hasManualOverrides: true } : SPK_URAL_PRICE_SOURCE,
      }),
      notes: notes || null,
    });
  };

  const buildCurrentExportProposal = (): ProposalSource | null => {
    if (!editableScheme || !pricing || numericArea <= 0) return null;
    return {
      id: savedProposalId ?? 0,
      title: buildProposalTitle(editableScheme, selectedFarm?.name ?? "Предварительный расчёт"),
      crop: selectedCrop.name,
      technology,
      area: String(numericArea),
      costPerHectare: String(pricing.maxPerHectare),
      totalCost: String(pricing.maxTotal),
      status: "draft",
      schemeJson: JSON.stringify({
        scheme: editableScheme,
        selectedCrop,
        area: numericArea,
        seedTons: hasSeedTreatment && validSeedTonnage ? numericSeedTons : null,
        paymentTerm,
        discountPercent,
        excludedLineKeys,
        manualPriceOverrides,
        manualRateOverrides,
        addedProductsByStep,
        pricing,
        priceSource: pricing.lines.some((line) => line.isManualPrice) ? { ...SPK_URAL_PRICE_SOURCE, hasManualOverrides: true } : SPK_URAL_PRICE_SOURCE,
      }),
      notes: notes || null,
    };
  };

  const exportCurrentProposal = () => {
    const proposal = buildCurrentExportProposal();
    if (!proposal) return toast.error("Выберите схему и укажите площадь для выгрузки КП");
    void downloadProposalWorkbook(proposal, selectedFarm).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Не удалось сформировать Excel-файл"));
  };

  const printCurrentProposal = () => {
    const proposal = buildCurrentExportProposal();
    if (!proposal) return toast.error("Выберите схему и укажите площадь для выгрузки КП");
    try {
      flushSync(() => setPrintNotice("Печатный макет открыт. В системном окне выберите «Сохранить как PDF»."));
      printProposalAsPdf(proposal, selectedFarm);
      toast.success("Печатный макет открыт. В системном окне выберите «Сохранить как PDF».");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось подготовить печатный макет");
    }
  };

  return (
    <div className="proposal-workspace min-h-screen bg-[#f4f7f1] text-[#15211c]">
      <header className="sticky top-0 z-30 border-b border-[#dde5dc] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="shrink-0"><DoctorFarmerLogo className="h-9 w-auto" clickable={false} /></Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/farms")}><ArrowLeft className="mr-1.5 h-4 w-4" />К хозяйствам</Button>
            <Link href="/agro-helper" className="hidden sm:block"><Button variant="outline" size="sm">АгроПомощник</Button></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
        <section className="proposal-workspace-hero mb-7 overflow-hidden rounded-3xl border border-[#dce8dc] bg-[#173f30] p-6 text-white shadow-[0_18px_60px_rgba(19,53,42,0.16)] lg:flex lg:items-end lg:justify-between lg:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.13em] text-emerald-100"><FileText className="h-3.5 w-3.5" />Рабочее КП</div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Коммерческое предложение из схемы</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/80">Стоимость рассчитывается по нормам из схемы и площади. Цену каждой позиции можно скорректировать вручную с прозрачной отметкой в расчёте.</p>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 lg:mt-0">
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-100/70">Бюджет по КП</span>
            <strong className="mt-1 block text-2xl">{pricing ? formatMoneyRange(pricing.minTotal, pricing.maxTotal) : "—"}</strong>
            <span className="text-xs text-emerald-100/75">{numericArea || 0} га · {pricing ? formatMoneyRange(pricing.minPerHectare, pricing.maxPerHectare) : "—"}/га</span>
          </div>
        </section>

        {!farmsQuery.isLoading && farms.length === 0 && <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><div><strong className="block">Расчёт доступен без карточки хозяйства.</strong><span>Выберите культуру и площадь, чтобы просмотреть состав и потребность. Для сохранения КП добавьте хозяйство.</span></div><Button size="sm" className="shrink-0 bg-[#194f38] text-white hover:bg-[#12352a]" onClick={() => setLocation("/farms")}><Plus className="mr-1.5 h-4 w-4" />Добавить хозяйство</Button></div>}

        <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <section className="space-y-5 rounded-2xl border border-[#dde5dc] bg-white p-5 shadow-sm sm:p-6">
            <div><p className="text-xs font-bold uppercase tracking-wide text-[#2e7d52]">01 · Контекст хозяйства</p><h2 className="mt-1 text-xl font-extrabold text-[#12352a]">Параметры предложения</h2></div>
            {farms.length > 0 ? <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Хозяйство</span><select value={selectedFarmId ?? ""} onChange={(event) => chooseFarm(Number(event.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]">{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}{farm.district ? ` · ${farm.district}` : ""}</option>)}</select></label> : <div className="rounded-xl border border-dashed border-[#b9cbb9] bg-[#f5f8f4] p-3 text-xs leading-relaxed text-[#486656]"><strong className="block text-[#194f38]">Предварительный расчёт</strong>После выбора хозяйства это КП можно сохранить в его историю.</div>}
            <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Культура</span><select value={cropId} onChange={(event) => chooseCrop(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]">{CROP_OPTIONS.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select></label>
            <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Технология</span><select value={technology} onChange={(event) => { setTechnology(event.target.value); resetSchemeEdits(); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]">{selectedCrop.technologies.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Площадь, га *</span><Input type="number" min="0" value={area} onChange={(event) => { setArea(event.target.value); setSavedProposalId(null); }} /></label>
              <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Условие оплаты</span><select value={paymentTerm} onChange={(event) => { setPaymentTerm(event.target.value as PaymentTerm); setSavedProposalId(null); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]">{Object.entries(PAYMENT_TERMS).map(([value, term]) => <option key={value} value={value}>{term.label}</option>)}</select></label>
              <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Скидка менеджера</span><select value={discountPercent} onChange={(event) => { setDiscountPercent(Number(event.target.value)); setSavedProposalId(null); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]"><option value={0}>Без скидки</option><option value={1}>1%</option><option value={2}>2%</option><option value={3}>3%</option></select></label>
            </div>
            {hasSeedTreatment && <div className="rounded-xl border border-[#b9d7bd] bg-[#eef7ee] p-3"><label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Фактический тоннаж семян для протравливания, т *</span><Input type="number" min="0.01" step="0.01" value={seedTons} onChange={(event) => { setSeedTons(event.target.value); setSavedProposalId(null); }} aria-describedby="seed-tonnage-help" placeholder="Например, 110" /></label><p id="seed-tonnage-help" className="mt-2 text-xs leading-relaxed text-[#285238]">Запросите значение у хозяйства. Оно умножается на норму применения каждого протравителя в л/т или кг/т.</p></div>}
            <div className="rounded-xl border border-[#b9d7bd] bg-[#eef7ee] p-3 text-xs leading-relaxed text-[#285238]"><strong>{hasSeedTreatment ? "Протравители: тоннаж семян × л/т или кг/т." : "Расчёт по норме, фасовке и площади."}</strong> {PAYMENT_TERMS[paymentTerm].description}. Для каждой позиции можно задать ручную цену и норму применения; скидка ограничена 3%.</div>
            <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Примечание для КП</span><Textarea value={notes} onChange={(event) => { setNotes(event.target.value); setSavedProposalId(null); }} rows={4} placeholder="Условия, договорённости, срок действия предложения" /></label>
            <div className="rounded-xl bg-[#f5f8f4] p-4">
              <div className="flex items-center gap-2 text-[#194f38]"><CircleDollarSign className="h-5 w-5 text-[#2e7d52]" /><span className="text-xs font-bold uppercase tracking-wide">Итог по КП</span></div>
              <strong className="mt-2 block text-3xl text-[#12352a]">{pricing ? formatMoneyRange(pricing.minTotal, pricing.maxTotal) : "—"}</strong>
              <p className="mt-1 text-xs text-[#6f7a73]">{pricing ? `${formatMoneyRange(pricing.minPerHectare, pricing.maxPerHectare)} на гектар · ${PAYMENT_TERMS[paymentTerm].label}` : "Укажите площадь для расчёта"}</p>
              {pricing && pricing.managerExcludedProducts.length > 0 && <p className="mt-2 text-xs font-semibold text-amber-700">Менеджер исключил из КП: {pricing.managerExcludedProducts.join(", ")}.</p>}
              {pricing && pricing.discountPercent > 0 && <p className="mt-2 text-xs text-[#486656]">До скидки: {formatMoneyRange(pricing.grossMinTotal, pricing.grossMaxTotal)} · скидка: −{formatMoneyRange(pricing.minDiscount, pricing.maxDiscount)}</p>}
              {pricing && pricing.maxPallets > 0 && <p className="mt-2 text-xs font-semibold text-[#194f38]">Логистика: {pricing.minPallets === pricing.maxPallets ? pricing.maxPallets : `${pricing.minPallets}–${pricing.maxPallets}`} палл. только по позициям с подтверждённой загрузкой.</p>}
              {pricing && pricing.unconfirmedLogisticsProducts.length > 0 && <p className="mt-2 text-xs font-semibold text-amber-700">Фасовка или паллетная загрузка требует уточнения: {pricing.unconfirmedLogisticsProducts.join(", ")}.</p>}
              {pricing && pricing.excludedProducts.length > 0 && <p className="mt-2 text-xs font-semibold text-amber-700">В итог временно не включено: {pricing.excludedProducts.join(", ")}.</p>}
              {pricing && !pricing.complete && <p className="mt-2 text-xs font-semibold text-amber-700">Нужна цена для: {pricing.missingProducts.join(", ")}</p>}
            </div>
            <Button className={`w-full font-bold transition-colors disabled:pointer-events-none disabled:opacity-100 ${canSaveProposal ? "bg-[#194f38] text-white hover:bg-[#12352a]" : "border border-[#c5d2c5] bg-[#e8ede8] text-[#526257] shadow-none"}`} onClick={saveProposal} disabled={!canSaveProposal}><Save className="mr-1.5 h-4 w-4" />{saveButtonLabel}</Button>
            {savedProposalId && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" />КП №{savedProposalId} сохранено</div>}
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#dde5dc] bg-white shadow-sm">
            <div className="border-b border-[#e7eee5] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#2e7d52]"><Layers3 className="h-4 w-4" />Рабочая схема</div><h2 className="text-2xl font-extrabold tracking-tight text-[#12352a]">{editableScheme?.title ?? "Схема не найдена"}</h2><p className="mt-1 text-sm text-[#6f7a73]">{selectedFarm?.name ?? "Выберите хозяйство"} · {selectedCrop.name} · {technology}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" className="border-[#2e7d52] text-[#194f38]" onClick={exportCurrentProposal}><FileDown className="mr-1.5 h-4 w-4" />Excel</Button><Button variant="outline" size="sm" onClick={printCurrentProposal}><Printer className="mr-1.5 h-4 w-4" />PDF / печать</Button></div></div>
              {printNotice && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">{printNotice}</p>}
              {editableScheme && <p className="mt-4 rounded-xl bg-[#f5f8f4] p-3 text-sm leading-relaxed text-[#486656]">{editableScheme.description}</p>}
            </div>
            {!editableScheme && <div className="p-10 text-center"><Sprout className="mx-auto mb-3 h-10 w-10 text-[#8cac91]" /><p className="font-semibold text-[#194f38]">Для этой комбинации пока нет готовой схемы</p><p className="mt-1 text-sm text-[#6f7a73]">Выберите другую культуру или дополните схемы в АгроПомощнике.</p></div>}
            {editableScheme && <div className="space-y-4 p-5 sm:p-6">
              {editableScheme.steps.map((step, stepIndex) => {
                const availableCategories = categoriesForStep(step.stage, step.task);
                const selectedCategory = categoryByStep[stepIndex] ?? availableCategories[0];
                const categoryProducts = selectedCategory ? productsForCategory(selectedCategory) : [];
                const selectedProductId = productByStep[stepIndex] ?? categoryProducts[0]?.id;

                return <article key={`${step.stage}-${stepIndex}`} className="rounded-xl border border-[#dde5dc] bg-[#fcfdfb]">
                  <div className="border-b border-[#e7eee5] px-4 py-3"><span className="text-[10px] font-bold uppercase tracking-wide text-[#2e7d52]">Этап {stepIndex + 1} · {step.stage}</span><h3 className="mt-1 font-bold text-[#12352a]">{step.task}</h3></div>
                  <div className="divide-y divide-[#e7eee5]">
                    {step.products.map((product, productIndex) => {
                      const priceLine = pricing?.lines.find((line) => line.key === `${stepIndex}-${productIndex}`);
                      const isCatalogExcluded = pricing?.excludedProducts.includes(product.name);
                      const isManagerExcluded = priceLine?.excludedByManager;
                      const isManagerAdded = product.note === MANAGER_ADDED_NOTE;
                      const packageSummary = priceLine && priceLine.minPackages !== null && priceLine.maxPackages !== null ? `${priceLine.minPackages === priceLine.maxPackages ? priceLine.maxPackages : `${priceLine.minPackages}–${priceLine.maxPackages}`} уп.${priceLine.logistics?.unitsPerPallet ? ` · до ${priceLine.maxPallets} палл.` : ""}` : null;
                      return <div key={`${step.stage}-${product.name}-${productIndex}`} className={`grid gap-2 px-4 py-3 sm:grid-cols-[minmax(9rem,1.15fr)_minmax(4rem,0.5fr)_minmax(6.5rem,0.75fr)_minmax(6rem,0.9fr)_minmax(8rem,1fr)] ${isManagerExcluded ? "bg-stone-50 opacity-75" : ""}`}>
                        <div><p className="font-bold text-[#12352a]">{product.name} {isManagerAdded && <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">добавлено</span>}</p><p className="mt-0.5 text-xs leading-relaxed text-[#6f7a73]">{product.dv}</p></div>
                        <p className="text-xs font-medium text-[#486656]">{product.group}</p>
                        <div><label className="block text-[10px] font-bold uppercase tracking-wide text-[#567260]">Норма применения</label><Input type="text" value={manualRateOverrides[`${stepIndex}-${productIndex}`] ?? product.rate} onChange={(event) => setManualRate(`${stepIndex}-${productIndex}`, event.target.value)} className="mt-1 h-8 border-[#b8cfb8] bg-white px-1.5 text-xs font-bold text-[#194f38]" aria-label={`Норма применения ${product.name}`} />{manualRateOverrides[`${stepIndex}-${productIndex}`] ? <button type="button" className="mt-1 text-[10px] font-bold text-[#194f38] underline underline-offset-2" onClick={() => resetManualRate(`${stepIndex}-${productIndex}`)}>Вернуть базовую</button> : <span className="mt-1 block text-[10px] font-medium text-[#6f7a73]">Расчётная норма</span>}</div>
                        <div className="rounded-lg bg-[#e8f1e7] px-2 py-1 text-xs font-bold text-[#194f38]"><span className="block">{priceLine?.requirement.label ?? "Укажите площадь"}</span>{packageSummary && !isManagerExcluded && <span className="mt-0.5 block font-medium">К отгрузке: {packageSummary}</span>}{priceLine?.price && !priceLine.logistics && !isManagerExcluded && <span className="mt-0.5 block font-medium text-amber-700">Фасовка не подтверждена</span>}<Button type="button" variant="outline" size="sm" className="mt-2 h-7 w-full bg-white text-[11px]" onClick={() => priceLine && toggleLine(priceLine.key)}>{isManagerExcluded ? "Вернуть в КП" : "Исключить из КП"}</Button></div>
                        <div className={`rounded-lg px-2 py-1 text-xs font-bold ${priceLine?.pricePerUnit !== null && !isManagerExcluded ? "bg-[#eef7ee] text-[#194f38]" : "bg-amber-50 text-amber-800"}`}>{isManagerExcluded ? "Исключено менеджером" : <><label className="block text-[10px] uppercase tracking-wide text-[#567260]">Цена за {priceLine?.logistics?.unit ?? priceLine?.requirement.unit ?? "ед."}</label><Input type="number" min="0" step="0.01" value={priceLine?.isManualPrice ? String(priceLine.pricePerUnit ?? "") : ""} placeholder={priceLine?.catalogPricePerUnit !== null && priceLine?.catalogPricePerUnit !== undefined ? String(priceLine.catalogPricePerUnit) : "Укажите цену"} disabled={!priceLine} onChange={(event) => priceLine && setManualPrice(priceLine.key, event.target.value)} className="mt-1 h-7 border-[#b8cfb8] bg-white px-1.5 text-xs font-bold text-[#194f38]" aria-label={`Ручная цена ${product.name}`} />{priceLine?.isManualPrice ? <button type="button" className="mt-1 text-[10px] font-bold underline underline-offset-2" onClick={() => resetManualPrice(priceLine?.key ?? "")}>Вернуть расчётную цену</button> : <span className="mt-1 block text-[10px] font-medium">{priceLine?.catalogPricePerUnit !== null && priceLine?.catalogPricePerUnit !== undefined ? "Расчётная цена" : "Укажите цену вручную"}</span>}<span className="mt-1 block">{priceLine && priceLine.minTotal !== null && priceLine.maxTotal !== null ? formatMoneyRange(priceLine.minTotal, priceLine.maxTotal) : "Укажите площадь"}</span>{isCatalogExcluded && !priceLine?.isManualPrice && <span className="mt-1 block text-[10px] font-medium text-amber-800">Требуется ручная цена</span>}</>}</div>
                      </div>;
                    })}
                  </div>
                  {availableCategories.length > 0 && <div className="border-t border-dashed border-[#cddccc] bg-[#f4f8f3] p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#315443]"><Plus className="h-3.5 w-3.5" />Добавить препарат в этап</div>
                    <div className="grid gap-2 sm:grid-cols-[0.75fr_1.45fr_auto]">
                      <select value={selectedCategory ?? ""} onChange={(event) => selectCategoryForStep(stepIndex, event.target.value as TreatmentCategory)} className="h-9 rounded-md border border-[#c8d6c8] bg-white px-2 text-xs font-semibold text-[#194f38]">{availableCategories.map((category) => <option key={category} value={category}>{TREATMENT_CATEGORIES[category].label}</option>)}</select>
                      <select value={selectedProductId ?? ""} onChange={(event) => setProductByStep((current) => ({ ...current, [stepIndex]: Number(event.target.value) }))} className="h-9 rounded-md border border-[#c8d6c8] bg-white px-2 text-xs text-[#194f38]">{categoryProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.rate}</option>)}</select>
                      <Button type="button" size="sm" className="bg-[#194f38] text-white hover:bg-[#12352a]" onClick={() => addProductToStep(stepIndex)}><Plus className="mr-1 h-3.5 w-3.5" />Добавить</Button>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-[#66766b]">Для добавленной позиции без расчётной цены укажите ручную цену в строке схемы — итог КП пересчитается автоматически.</p>
                  </div>}
                </article>;
              })}
            </div>}
            {notes && <div className="mx-5 mb-5 rounded-xl border border-[#dce8dc] bg-[#f5f8f4] p-4 text-sm text-[#486656] sm:mx-6 sm:mb-6"><strong className="block text-[#194f38]">Примечание</strong><span className="mt-1 block whitespace-pre-line">{notes}</span></div>}
          </section>
        </div>

        {selectedFarmId && proposalsQuery.data && proposalsQuery.data.length > 0 && <section className="mt-6 rounded-2xl border border-[#dde5dc] bg-white p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-center gap-2"><FileDown className="h-5 w-5 text-[#2e7d52]" /><h2 className="font-bold text-[#12352a]">Сохранённые КП по хозяйству</h2></div><div className="grid gap-3 md:grid-cols-2">{proposalsQuery.data.map((proposal) => <div key={proposal.id} className="rounded-xl border border-[#e0eadf] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-[#12352a]">{proposal.title}</p><p className="mt-1 text-xs text-[#6f7a73]">{proposal.crop} · {proposal.area} га · {formatMoney(Number(proposal.totalCost))}</p></div><span className="rounded-full bg-[#e8efe5] px-2.5 py-1 text-[10px] font-bold text-[#194f38]">{proposal.status === "draft" ? "Черновик" : proposal.status}</span></div><div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" className="border-[#2e7d52] text-[#194f38]" onClick={() => void downloadProposalWorkbook(proposal, selectedFarm).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Не удалось сформировать Excel-фাইল"))}><FileDown className="mr-1.5 h-4 w-4" />Excel</Button><Button type="button" size="sm" variant="outline" onClick={() => { try { flushSync(() => setPrintNotice("Печатный макет открыт. В системном окне выберите «Сохранить как PDF».")); printProposalAsPdf(proposal, selectedFarm); toast.success("Печатный макет открыт. В системном окне выберите «Сохранить как PDF»."); } catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось подготовить печатный макет"); } }}><Printer className="mr-1.5 h-4 w-4" />PDF</Button></div></div>)}</div></section>}
      </main>
    </div>
  );
}
