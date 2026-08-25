import { DRUGS } from "@/data/drugs";

export type TreatmentCategory = "seedTreatment" | "herbicide" | "fungicide" | "insecticide";

export type CatalogProduct = {
  id: number;
  category: TreatmentCategory;
  name: string;
  rate: string;
  dv: string;
  group: string;
  crops: string;
};

export const TREATMENT_CATEGORIES: Record<TreatmentCategory, { label: string; sourceGroup: string }> = {
  seedTreatment: { label: "Протравители", sourceGroup: "Протравитель" },
  herbicide: { label: "Гербициды", sourceGroup: "Гербицид" },
  fungicide: { label: "Фунгициды", sourceGroup: "Фунгицид" },
  insecticide: { label: "Инсектициды", sourceGroup: "Инсектицид" },
};

function categoryFromGroup(group: string): TreatmentCategory | null {
  if (group === "Протравитель") return "seedTreatment";
  if (group.startsWith("Гербицид")) return "herbicide";
  if (group === "Фунгицид") return "fungicide";
  if (group === "Инсектицид") return "insecticide";
  return null;
}

export const SCHEME_PRODUCT_CATALOG: CatalogProduct[] = DRUGS.flatMap((drug) => {
  const category = categoryFromGroup(drug.group);
  if (!category) return [];
  return [{
    id: drug.n,
    category,
    name: drug.name,
    rate: drug.norma,
    dv: drug.dv,
    group: drug.group,
    crops: drug.cult,
  }];
});

export function categoriesForStep(stage: string, task: string): TreatmentCategory[] {
  const context = `${stage} ${task}`.toLocaleLowerCase("ru-RU");
  const categories: TreatmentCategory[] = [];
  if (context.includes("протрав")) categories.push("seedTreatment");
  if (context.includes("гербиц") || context.includes("сорняк")) categories.push("herbicide");
  if (context.includes("фунгиц") || context.includes("болезн")) categories.push("fungicide");
  if (context.includes("инсектиц")) categories.push("insecticide");
  return categories;
}

export function productsForCategory(category: TreatmentCategory): CatalogProduct[] {
  return SCHEME_PRODUCT_CATALOG.filter((product) => product.category === category);
}
