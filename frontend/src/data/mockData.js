
/*
  WattProof Twin — Centralized demonstration data.
  All values are illustrative, not real building measurements.
*/

export const DATA_MODE = "SIMULATED";

export const ENERGY_ASSUMPTIONS = {
  tariffINRPerKWh: 8,
  emissionsFactorKgPerKWh: 0.7,
  comparisonPeriod: "One week",
};

export const EQUIPMENT_PROFILES = [
  {
    id: "ac-classroom",
    name: "Classroom AC",
    category: "Cooling",
    ratedPowerW: 1800,
    units: 2,
    hoursPerDay: 5,
    operatingDaysPerWeek: 5,
    status: "Confirmed",
    dataMode: DATA_MODE,
  },
  {
    id: "lights-classroom",
    name: "Classroom lights",
    category: "Lighting",
    ratedPowerW: 400,
    units: 1,
    hoursPerDay: 6,
    operatingDaysPerWeek: 6,
    status: "Confirmed",
    dataMode: DATA_MODE,
  },
  {
    id: "fans-classroom",
    name: "Classroom fans",
    category: "Ventilation",
    ratedPowerW: 300,
    units: 1,
    hoursPerDay: 7,
    operatingDaysPerWeek: 6,
    status: "Confirmed",
    dataMode: DATA_MODE,
  },
  {
    id: "pcs-lab",
    name: "Computer Lab",
    category: "Computing",
    ratedPowerW: 200,
    units: 10,
    hoursPerDay: 6,
    operatingDaysPerWeek: 6,
    status: "Needs review",
    dataMode: DATA_MODE,
  },
];

export const DAILY_ENERGY_READINGS = [
  { day: "Mon", energyKWh: 42, dataMode: DATA_MODE },
  { day: "Tue", energyKWh: 39, dataMode: DATA_MODE },
  { day: "Wed", energyKWh: 45, dataMode: DATA_MODE },
  { day: "Thu", energyKWh: 41, dataMode: DATA_MODE },
  { day: "Fri", energyKWh: 37, dataMode: DATA_MODE },
  { day: "Sat", energyKWh: 29, dataMode: DATA_MODE },
  { day: "Sun", energyKWh: 18, dataMode: DATA_MODE },
];

export const SUMMARY_METRICS = {
  energyUsedKWh: 251,
  estimatedCostINR: 2008,
  estimatedEmissionsKgCO2e: 175.7,
  potentialSavingsKWhPerWeek: 18,
  dataMode: DATA_MODE,
};

export const RECOMMENDATIONS = [
  {
    id: "rec-ac-runtime",
    equipment: "Classroom AC",
    priority: "High",
    issue: "Extended operating hours",
    evidence:
      "The illustrative schedule uses 5 hours per day. Review whether one hour can be reduced.",
    action: "Reduce operating time from 5 hours to 4 hours per day.",
    baselineHours: 5,
    proposedHours: 4,
    ratedPowerW: 1800,
    units: 2,
    operatingDaysPerWeek: 5,
    tariffINRPerKWh: 8,
    emissionsFactorKgPerKWh: 0.7,
    dataMode: DATA_MODE,
  },
  {
    id: "rec-pc-idle",
    equipment: "Computer Lab",
    priority: "Medium",
    issue: "Potential idle-time energy waste",
    evidence:
      "The illustrative schedule uses 6 hours per day. Review whether unused computers can be shut down earlier.",
    action: "Reduce operating time from 6 hours to 5 hours per day.",
    baselineHours: 6,
    proposedHours: 5,
    ratedPowerW: 200,
    units: 10,
    operatingDaysPerWeek: 6,
    tariffINRPerKWh: 8,
    emissionsFactorKgPerKWh: 0.7,
    dataMode: DATA_MODE,
  },
];

export const SAMPLE_ACTION_PASSPORTS = [
  {
    id: "AP-DEMO-001",
    equipment: "Classroom AC",
    action: "Reduce operating time from 5 hours to 4 hours per day",
    status: "Draft",
    createdAt: "2026-10-14T10:00:00.000Z",
    prediction: {
      energySaved: 18,
      costSaved: 144,
      emissionsSaved: 12.6,
    },
    dataMode: DATA_MODE,
  },
  {
    id: "AP-DEMO-002",
    equipment: "Computer Lab",
    action: "Reduce operating time from 6 hours to 5 hours per day",
    status: "Awaiting follow-up",
    createdAt: "2026-10-13T09:30:00.000Z",
    prediction: {
      energySaved: 12,
      costSaved: 96,
      emissionsSaved: 8.4,
    },
    dataMode: DATA_MODE,
  },
];

export const SIMULATED_FOLLOW_UP = {
  dataMode: DATA_MODE,
  baselinePeriod: "Illustrative baseline week",
  followUpPeriod: "Illustrative follow-up week",
  comparable: true,
  predictedSavingsKWh: 18,
  observedSavingsKWh: 17,
  note:
    "Illustrative values only. No real meter readings were collected.",
};

export function calculateEnergyKWh({
  ratedPowerW,
  units = 1,
  hoursPerDay,
  operatingDaysPerWeek,
}) {
  return (
    (Number(ratedPowerW) *
      Number(units) *
      Number(hoursPerDay) *
      Number(operatingDaysPerWeek)) /
    1000
  );
}

export function calculateSavings({
  ratedPowerW,
  units = 1,
  baselineHours,
  proposedHours,
  operatingDaysPerWeek,
  tariffINRPerKWh = ENERGY_ASSUMPTIONS.tariffINRPerKWh,
  emissionsFactorKgPerKWh =
    ENERGY_ASSUMPTIONS.emissionsFactorKgPerKWh,
}) {
  const baselineEnergy = calculateEnergyKWh({
    ratedPowerW,
    units,
    hoursPerDay: baselineHours,
    operatingDaysPerWeek,
  });

  const proposedEnergy = calculateEnergyKWh({
    ratedPowerW,
    units,
    hoursPerDay: proposedHours,
    operatingDaysPerWeek,
  });

  const energySaved = baselineEnergy - proposedEnergy;

  return {
    baselineEnergyKWh: baselineEnergy,
    proposedEnergyKWh: proposedEnergy,
    energySavedKWh: energySaved,
    costSavedINR: energySaved * tariffINRPerKWh,
    emissionsSavedKgCO2e:
      energySaved * emissionsFactorKgPerKWh,
  };
}
