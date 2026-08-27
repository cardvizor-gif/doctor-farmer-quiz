export type SeedingRate = {
  cropId: string;
  tonsPerHectare: number;
  rangeLabel: string;
};

export const SEEDING_RATES: SeedingRate[] = [
  { cropId: "wheat_winter", tonsPerHectare: 0.22, rangeLabel: "0,16–0,25 т/га" },
  { cropId: "wheat_spring", tonsPerHectare: 0.22, rangeLabel: "0,16–0,27 т/га" },
  { cropId: "barley", tonsPerHectare: 0.2, rangeLabel: "0,16–0,22 т/га" },
  { cropId: "oats", tonsPerHectare: 0.18, rangeLabel: "0,15–0,22 т/га" },
  { cropId: "peas", tonsPerHectare: 0.25, rangeLabel: "0,22–0,33 т/га" },
  { cropId: "flax_classic", tonsPerHectare: 0.06, rangeLabel: "0,055–0,065 т/га" },
];

export function getSeedingRate(cropId: string) {
  return SEEDING_RATES.find((rate) => rate.cropId === cropId) ?? null;
}
