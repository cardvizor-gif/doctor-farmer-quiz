import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CROP_OPTIONS } from "@/data/agropom";
import { PROTECTION_SCHEMES } from "@/data/protectionSchemes";
import { PAYMENT_TERMS, SPK_URAL_PRICE_SOURCE, type PaymentTerm } from "@/data/spkUralPrice";
import { buildProposalTitle, calculateSchemePricing, getSchemeForProposal, parseProposalContext } from "@/lib/proposal";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Building2, CheckCircle2, ChevronRight, CircleDollarSign, FileDown, FileText, Layers3, Plus, Printer, Save, Sprout } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const formatMoney = (value: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value || 0);
const formatMoneyRange = (min: number, max: number) => min === max ? formatMoney(min) : `${formatMoney(min)}–${formatMoney(max)}`;

export default function ProposalBuilder() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const initialContext = parseProposalContext(window.location.search);
  const initialCrop = CROP_OPTIONS.find(crop => crop.id === initialContext.cropId) ?? CROP_OPTIONS[0];
  const initialTechnology = initialCrop.technologies.includes(initialContext.technology ?? "") ? initialContext.technology! : initialCrop.technologies[0];
  const farmsQuery = trpc.farms.list.useQuery();
  const farms = farmsQuery.data ?? [];
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(() => {
    return initialContext.farmId;
  });
  const [cropId, setCropId] = useState(initialCrop.id);
  const [technology, setTechnology] = useState(initialTechnology);
  const [area, setArea] = useState(initialContext.area ? String(initialContext.area) : "");
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerm>("deferred");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [savedProposalId, setSavedProposalId] = useState<number | null>(null);
  const selectedFarm = farms.find(farm => farm.id === selectedFarmId) ?? null;
  const selectedCrop = CROP_OPTIONS.find(crop => crop.id === cropId) ?? CROP_OPTIONS[0];
  const scheme = useMemo(() => getSchemeForProposal(PROTECTION_SCHEMES, cropId, technology), [cropId, technology]);
  const numericArea = Number(area || 0);
  const pricing = useMemo(() => scheme ? calculateSchemePricing(scheme, numericArea, paymentTerm, discountPercent) : null, [scheme, numericArea, paymentTerm, discountPercent]);
  const proposalsQuery = trpc.proposals.list.useQuery(selectedFarmId ? { farmId: selectedFarmId } : undefined);

  useEffect(() => {
    if (farms.length && !selectedFarm) {
      const firstFarm = farms[0];
      setSelectedFarmId(firstFarm.id);
      setArea(currentArea => currentArea || String(firstFarm.totalArea ?? ""));
    }
  }, [farms, selectedFarm]);

  useEffect(() => {
    if (selectedFarm && !area) setArea(String(selectedFarm.totalArea ?? ""));
  }, [selectedFarm, area]);

  const createProposal = trpc.proposals.create.useMutation({
    onSuccess: async proposal => {
      if (proposal) setSavedProposalId(proposal.id);
      await utils.proposals.list.invalidate();
      toast.success("Коммерческое предложение сохранено в карточке хозяйства");
    },
    onError: error => toast.error(error.message),
  });

  const chooseFarm = (farmId: number) => {
    const farm = farms.find(item => item.id === farmId);
    setSelectedFarmId(farmId);
    setArea(String(farm?.totalArea ?? ""));
    setSavedProposalId(null);
  };

  const chooseCrop = (newCropId: string) => {
    const crop = CROP_OPTIONS.find(item => item.id === newCropId) ?? CROP_OPTIONS[0];
    setCropId(crop.id);
    setTechnology(crop.technologies[0]);
    setSavedProposalId(null);
  };

  const saveProposal = () => {
    if (!selectedFarm) return toast.error("Сначала выберите хозяйство");
    if (!scheme) return toast.error("Для выбранной культуры нет готовой схемы");
    if (numericArea <= 0) return toast.error("Укажите площадь обработки больше нуля");
    if (!pricing?.complete) return toast.error("В схеме есть позиции без подтверждённой цены из прайса СПК «Урал»");
    createProposal.mutate({
      farmId: selectedFarm.id,
      title: buildProposalTitle(scheme, selectedFarm.name),
      crop: selectedCrop.name,
      technology,
      area: numericArea,
      costPerHectare: pricing.maxPerHectare,
      totalCost: pricing.maxTotal,
      schemeJson: JSON.stringify({ scheme, selectedCrop, area: numericArea, paymentTerm, discountPercent, pricing, priceSource: SPK_URAL_PRICE_SOURCE }),
      notes: notes || null,
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f7f1] text-[#15211c]">
      <header className="sticky top-0 z-30 border-b border-[#dde5dc] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="shrink-0"><DoctorFarmerLogo className="h-9 w-auto" clickable={false} /></Link>
          <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setLocation(selectedFarm ? `/farms` : "/farms")}><ArrowLeft className="mr-1.5 h-4 w-4" />К хозяйствам</Button><Link href="/agro-helper" className="hidden sm:block"><Button variant="outline" size="sm">АгроПомощник</Button></Link></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
        <section className="mb-7 overflow-hidden rounded-3xl border border-[#dce8dc] bg-[#173f30] p-6 text-white shadow-[0_18px_60px_rgba(19,53,42,0.16)] lg:flex lg:items-end lg:justify-between lg:p-8">
          <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.13em] text-emerald-100"><FileText className="h-3.5 w-3.5" />Рабочее КП</div><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Коммерческое предложение из схемы</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/80">Стоимость рассчитывается автоматически по прайсу СПК «Урал», нормам из схемы и площади. Ручного ввода бюджета нет.</p></div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 lg:mt-0"><span className="text-[10px] font-bold uppercase tracking-wide text-emerald-100/70">Бюджет по КП</span><strong className="mt-1 block text-2xl">{pricing ? formatMoneyRange(pricing.minTotal, pricing.maxTotal) : "—"}</strong><span className="text-xs text-emerald-100/75">{numericArea || 0} га · {pricing ? formatMoneyRange(pricing.minPerHectare, pricing.maxPerHectare) : "—"}/га</span></div>
        </section>

        {!farmsQuery.isLoading && farms.length === 0 && <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><div><strong className="block">Расчёт доступен без карточки хозяйства.</strong><span>Выберите культуру и площадь, чтобы просмотреть состав и потребность. Для сохранения КП добавьте хозяйство.</span></div><Button size="sm" className="shrink-0 bg-[#194f38] hover:bg-[#12352a]" onClick={() => setLocation("/farms")}><Plus className="mr-1.5 h-4 w-4" />Добавить хозяйство</Button></div>}

        <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <section className="space-y-5 rounded-2xl border border-[#dde5dc] bg-white p-5 shadow-sm sm:p-6">
            <div><p className="text-xs font-bold uppercase tracking-wide text-[#2e7d52]">01 · Контекст хозяйства</p><h2 className="mt-1 text-xl font-extrabold text-[#12352a]">Параметры предложения</h2></div>
            {farms.length > 0 ? <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Хозяйство</span><select value={selectedFarmId ?? ""} onChange={event => chooseFarm(Number(event.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]">{farms.map(farm => <option key={farm.id} value={farm.id}>{farm.name}{farm.district ? ` · ${farm.district}` : ""}</option>)}</select></label> : <div className="rounded-xl border border-dashed border-[#b9cbb9] bg-[#f5f8f4] p-3 text-xs leading-relaxed text-[#486656]"><strong className="block text-[#194f38]">Предварительный расчёт</strong>После выбора хозяйства это КП можно сохранить в его историю.</div>}
            <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Культура</span><select value={cropId} onChange={event => chooseCrop(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]">{CROP_OPTIONS.map(crop => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select></label>
            <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Технология</span><select value={technology} onChange={event => { setTechnology(event.target.value); setSavedProposalId(null); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]">{selectedCrop.technologies.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
            <div className="grid gap-3 sm:grid-cols-3"><label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Площадь, га *</span><Input type="number" min="0" value={area} onChange={event => { setArea(event.target.value); setSavedProposalId(null); }} /></label><label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Условие оплаты</span><select value={paymentTerm} onChange={event => { setPaymentTerm(event.target.value as PaymentTerm); setSavedProposalId(null); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]">{Object.entries(PAYMENT_TERMS).map(([value, term]) => <option key={value} value={value}>{term.label}</option>)}</select></label><label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Скидка менеджера</span><select value={discountPercent} onChange={event => { setDiscountPercent(Number(event.target.value)); setSavedProposalId(null); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]"><option value={0}>Без скидки</option><option value={1}>1%</option><option value={2}>2%</option><option value={3}>3%</option></select></label></div>
            <div className="rounded-xl border border-[#b9d7bd] bg-[#eef7ee] p-3 text-xs leading-relaxed text-[#285238]"><strong>Основание цены: {SPK_URAL_PRICE_SOURCE.title}.</strong> {PAYMENT_TERMS[paymentTerm].description}. Стоимость считается по норме, фасовке и площади; скидка ограничена 3%.</div>
            <label className="block space-y-1.5"><span className="text-xs font-bold text-[#194f38]">Примечание для КП</span><Textarea value={notes} onChange={event => { setNotes(event.target.value); setSavedProposalId(null); }} rows={4} placeholder="Условия, договорённости, срок действия предложения" /></label>
            <div className="rounded-xl bg-[#f5f8f4] p-4"><div className="flex items-center gap-2 text-[#194f38]"><CircleDollarSign className="h-5 w-5 text-[#2e7d52]" /><span className="text-xs font-bold uppercase tracking-wide">Итог по прайсу</span></div><strong className="mt-2 block text-3xl text-[#12352a]">{pricing ? formatMoneyRange(pricing.minTotal, pricing.maxTotal) : "—"}</strong><p className="mt-1 text-xs text-[#6f7a73]">{pricing ? `${formatMoneyRange(pricing.minPerHectare, pricing.maxPerHectare)} на гектар · ${PAYMENT_TERMS[paymentTerm].label}` : "Укажите площадь для расчёта"}</p>{pricing && pricing.discountPercent > 0 && <p className="mt-2 text-xs text-[#486656]">До скидки: {formatMoneyRange(pricing.grossMinTotal, pricing.grossMaxTotal)} · скидка: −{formatMoneyRange(pricing.minDiscount, pricing.maxDiscount)}</p>}{pricing && pricing.maxPallets > 0 && <p className="mt-2 text-xs font-semibold text-[#194f38]">Логистика: {pricing.minPallets === pricing.maxPallets ? pricing.maxPallets : `${pricing.minPallets}–${pricing.maxPallets}`} палл. только по позициям с подтверждённой загрузкой.</p>}{pricing && pricing.unconfirmedLogisticsProducts.length > 0 && <p className="mt-2 text-xs font-semibold text-amber-700">Фасовка или паллетная загрузка требует уточнения: {pricing.unconfirmedLogisticsProducts.join(", ")}.</p>}{pricing && pricing.excludedProducts.length > 0 && <p className="mt-2 text-xs font-semibold text-amber-700">В итог временно не включено: {pricing.excludedProducts.join(", ")}.</p>}{pricing && !pricing.complete && <p className="mt-2 text-xs font-semibold text-amber-700">Нужна цена для: {pricing.missingProducts.join(", ")}</p>}</div>
            <Button className="w-full bg-[#194f38] hover:bg-[#12352a]" onClick={saveProposal} disabled={createProposal.isPending || !scheme || !selectedFarm || !pricing?.complete}><Save className="mr-1.5 h-4 w-4" />{!selectedFarm ? "Выберите хозяйство для сохранения КП" : !pricing?.complete ? "Не все позиции имеют цену" : "Сохранить КП по прайсу"}</Button>
            {savedProposalId && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" />КП №{savedProposalId} сохранено</div>}
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#dde5dc] bg-white shadow-sm">
            <div className="border-b border-[#e7eee5] p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#2e7d52]"><Layers3 className="h-4 w-4" />Готовая схема</div><h2 className="text-2xl font-extrabold tracking-tight text-[#12352a]">{scheme?.title ?? "Схема не найдена"}</h2><p className="mt-1 text-sm text-[#6f7a73]">{selectedFarm?.name ?? "Выберите хозяйство"} · {selectedCrop.name} · {technology}</p></div><Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" />PDF / печать</Button></div>{scheme && <p className="mt-4 rounded-xl bg-[#f5f8f4] p-3 text-sm leading-relaxed text-[#486656]">{scheme.description}</p>}</div>
            {!scheme && <div className="p-10 text-center"><Sprout className="mx-auto mb-3 h-10 w-10 text-[#8cac91]" /><p className="font-semibold text-[#194f38]">Для этой комбинации пока нет готовой схемы</p><p className="mt-1 text-sm text-[#6f7a73]">Выберите другую культуру или дополните схемы в АгроПомощнике.</p></div>}
            {scheme && <div className="space-y-4 p-5 sm:p-6">{scheme.steps.map((step, stepIndex) => <article key={`${step.stage}-${stepIndex}`} className="rounded-xl border border-[#dde5dc] bg-[#fcfdfb]"><div className="border-b border-[#e7eee5] px-4 py-3"><span className="text-[10px] font-bold uppercase tracking-wide text-[#2e7d52]">Этап {stepIndex + 1} · {step.stage}</span><h3 className="mt-1 font-bold text-[#12352a]">{step.task}</h3></div><div className="divide-y divide-[#e7eee5]">{step.products.map((product, productIndex) => { const priceLine = pricing?.lines.find(line => line.key === `${stepIndex}-${productIndex}`); const isExcluded = pricing?.excludedProducts.includes(product.name); const packageSummary = priceLine && priceLine.minPackages !== null && priceLine.maxPackages !== null ? `${priceLine.minPackages === priceLine.maxPackages ? priceLine.maxPackages : `${priceLine.minPackages}–${priceLine.maxPackages}`} уп.${priceLine.logistics?.unitsPerPallet ? ` · до ${priceLine.maxPallets} палл.` : ""}` : null; return <div key={`${step.stage}-${product.name}`} className="grid gap-2 px-4 py-3 sm:grid-cols-[1.15fr_0.5fr_0.6fr_0.9fr_1fr]"><div><p className="font-bold text-[#12352a]">{product.name}</p><p className="mt-0.5 text-xs leading-relaxed text-[#6f7a73]">{product.dv}</p></div><p className="text-xs font-medium text-[#486656]">{product.group}</p><p className="text-sm font-bold text-[#194f38]">{product.rate}</p><div className="rounded-lg bg-[#e8f1e7] px-2 py-1 text-xs font-bold text-[#194f38]"><span className="block">{priceLine?.requirement.label ?? "Укажите площадь"}</span>{packageSummary && <span className="mt-0.5 block font-medium">К отгрузке: {packageSummary}</span>}{priceLine?.price && !priceLine.logistics && <span className="mt-0.5 block font-medium text-amber-700">Фасовка не подтверждена</span>}</div><div className={`rounded-lg px-2 py-1 text-xs font-bold ${priceLine?.price && !isExcluded ? "bg-[#eef7ee] text-[#194f38]" : "bg-amber-50 text-amber-800"}`}>{isExcluded ? "Исключено до получения цены" : priceLine?.price ? <><span className="block">{formatMoney(priceLine.pricePerUnit ?? 0)} / {priceLine.logistics?.unit ?? priceLine.requirement.unit ?? "ед."}</span><span className="block font-medium">{priceLine.minTotal !== null && priceLine.maxTotal !== null ? formatMoneyRange(priceLine.minTotal, priceLine.maxTotal) : "Укажите площадь"}</span></> : "Нет цены в прайсе"}</div></div>; })}</div></article>)}</div>}
            {notes && <div className="mx-5 mb-5 rounded-xl border border-[#dce8dc] bg-[#f5f8f4] p-4 text-sm text-[#486656] sm:mx-6 sm:mb-6"><strong className="block text-[#194f38]">Примечание</strong><span className="mt-1 block whitespace-pre-line">{notes}</span></div>}
          </section>
        </div>

        {selectedFarmId && proposalsQuery.data && proposalsQuery.data.length > 0 && <section className="mt-6 rounded-2xl border border-[#dde5dc] bg-white p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-center gap-2"><FileDown className="h-5 w-5 text-[#2e7d52]" /><h2 className="font-bold text-[#12352a]">Сохранённые КП по хозяйству</h2></div><div className="grid gap-3 md:grid-cols-2">{proposalsQuery.data.map(proposal => <div key={proposal.id} className="rounded-xl border border-[#e0eadf] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-[#12352a]">{proposal.title}</p><p className="mt-1 text-xs text-[#6f7a73]">{proposal.crop} · {proposal.area} га · {formatMoney(Number(proposal.totalCost))}</p></div><span className="rounded-full bg-[#e8efe5] px-2.5 py-1 text-[10px] font-bold text-[#194f38]">{proposal.status === "draft" ? "Черновик" : proposal.status}</span></div></div>)}</div></section>}
      </main>
    </div>
  );
}
