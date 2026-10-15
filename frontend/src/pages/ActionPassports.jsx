
import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Search,
  CalendarDays,
  Zap,
  IndianRupee,
  Leaf,
  Eye,
  Play,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";

const STORAGE_KEY = "wattproof-action-passports";

const demoPassports = [
  {
    id: "AP-DEMO-001",
    equipment: "Classroom AC",
    action: "Reduce daily operating time from 5 hours to 4 hours",
    status: "Draft",
    createdAt: "2026-10-14T10:00:00.000Z",
    dataMode: "SIMULATED",
    assumptions: {
      ratedPower: 1800,
      units: 2,
      baselineHours: 5,
      proposedHours: 4,
      operatingDays: 5,
      tariff: 8,
      emissionsFactor: 0.7,
    },
    prediction: {
      energySaved: 18,
      costSaved: 144,
      emissionsSaved: 12.6,
    },
  },
  {
    id: "AP-DEMO-002",
    equipment: "Computer Lab",
    action: "Switch off unused computers after lab sessions",
    status: "Awaiting follow-up",
    createdAt: "2026-10-13T09:30:00.000Z",
    dataMode: "SIMULATED",
    assumptions: {
      ratedPower: 200,
      units: 10,
      baselineHours: 6,
      proposedHours: 5,
      operatingDays: 6,
      tariff: 8,
      emissionsFactor: 0.7,
    },
    prediction: {
      energySaved: 12,
      costSaved: 96,
      emissionsSaved: 8.4,
    },
  },
];

function getPrediction(passport) {
  const data = passport.prediction || passport.results || {};

  const energy = Number(
    data.energySaved ??
      data.energySavedKwh ??
      data.energySavedKWh ??
      data.kwhSaved ??
      data.weeklyEnergySaved ??
      data.energySavings ??
      0
  );

  const cost = Number(
    data.costSaved ??
      data.costSavedRupees ??
      data.weeklyCostSaved ??
      data.costSavings ??
      0
  );

  const emissions = Number(
    data.emissionsSaved ??
      data.emissionsSavedKg ??
      data.co2Saved ??
      data.weeklyEmissionsSaved ??
      0
  );

  return {
    energy: Number.isFinite(energy) ? energy : 0,
    cost: Number.isFinite(cost) ? cost : 0,
    emissions: Number.isFinite(emissions) ? emissions : 0,
  };
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function statusStyle(status) {
  const value = (status || "").toLowerCase();

  if (value.includes("verified")) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (value.includes("below")) {
    return "bg-amber-100 text-amber-800";
  }

  if (value.includes("insufficient")) {
    return "bg-rose-100 text-rose-800";
  }

  if (value.includes("awaiting")) {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-slate-100 text-slate-700";
}

function Metric({ icon: Icon, label, value, unit }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
        <Icon size={17} />
        <span>{label}</span>
      </div>
      <p className="text-xl font-bold text-[#142D27]">
        {formatNumber(value)}
        <span className="ml-1 text-sm font-medium text-slate-500">
          {unit}
        </span>
      </p>
    </div>
  );
}

export default function ActionPassports() {
  const [passports, setPassports] = useState(demoPassports);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPassport, setSelectedPassport] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setPassports(parsed);
        }
      }
    } catch (error) {
      console.error("Could not load Action Passports:", error);
    }
  }, []);

  function savePassports(updated) {
    setPassports(updated);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Could not save Action Passports:", error);
      setVerificationMessage(
        "The update is visible for this session, but could not be saved in this browser."
      );
    }
  }

  function runSimulatedFollowUp(passport) {
    const predicted = getPrediction(passport).energy;

    if (predicted <= 0) {
      const updated = passports.map((item) =>
        item.id === passport.id
          ? {
              ...item,
              status: "Insufficient data",
              verification: {
                mode: "SIMULATED",
                message:
                  "A valid predicted energy saving was not found, so a comparison could not be performed.",
              },
            }
          : item
      );

      savePassports(updated);
      setSelectedPassport(
        updated.find((item) => item.id === passport.id)
      );
      setVerificationMessage(
        "Insufficient data: no valid predicted energy saving was found."
      );
      return;
    }

    // Demonstration only: observed savings are simulated, not measured.
    const observed = Math.round(predicted * 0.85 * 100) / 100;
    const difference = Math.round((predicted - observed) * 100) / 100;
    const newStatus =
      observed >= predicted ? "Verified in simulation" : "Below prediction";

    const updated = passports.map((item) =>
      item.id === passport.id
        ? {
            ...item,
            status: newStatus,
            verification: {
              mode: "SIMULATED",
              baselinePeriod: "Illustrative baseline week",
              followUpPeriod: "Illustrative follow-up week",
              predictedKwh: predicted,
              observedKwh: observed,
              differenceKwh: difference,
              message:
                "Illustrative follow-up values were generated for this demo. No real meter readings were collected.",
              checkedAt: new Date().toISOString(),
            },
          }
        : item
    );

    savePassports(updated);

    const refreshed = updated.find((item) => item.id === passport.id);
    setSelectedPassport(refreshed);
    setVerificationMessage(
      `Simulated follow-up complete. Predicted: ${formatNumber(
        predicted
      )} kWh/week; simulated observed: ${formatNumber(observed)} kWh/week.`
    );
  }

  const filteredPassports = passports.filter((passport) => {
    const query = searchTerm.toLowerCase();

    return (
      (passport.id || "").toLowerCase().includes(query) ||
      (passport.equipment || "").toLowerCase().includes(query) ||
      (passport.action || "").toLowerCase().includes(query) ||
      (passport.status || "").toLowerCase().includes(query)
    );
  });

  const draftCount = passports.filter((p) =>
    (p.status || "").toLowerCase().includes("draft")
  ).length;

  const verifiedCount = passports.filter((p) =>
    (p.status || "").toLowerCase().includes("verified")
  ).length;

  const awaitingCount = passports.filter((p) =>
    (p.status || "").toLowerCase().includes("awaiting")
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#2E8B68]">
          Act → Verify
        </p>
        <h1 className="text-3xl font-bold text-[#142D27]">
          Action Passports
        </h1>
        <p className="mt-2 max-w-3xl text-slate-500">
          Track recommended energy-saving actions, their predicted impact,
          and follow-up verification. Demo records and simulated readings
          are clearly labelled.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total passports</p>
            <ClipboardCheck className="text-[#2E8B68]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#142D27]">
            {passports.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Drafts</p>
            <Clock className="text-amber-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#142D27]">
            {draftCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Verified in simulation</p>
            <CheckCircle2 className="text-[#2E8B68]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#142D27]">
            {verifiedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {awaitingCount} awaiting follow-up
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by ID, equipment, action or status..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-[#2E8B68]"
          />
        </div>
      </div>

      {filteredPassports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <ClipboardCheck
            size={36}
            className="mx-auto mb-3 text-slate-400"
          />
          <h2 className="font-semibold text-[#142D27]">
            No matching passports
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Try another search, or create a passport from the Digital Twin page.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#F7F8F4] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Passport / Equipment</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Predicted savings</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPassports.map((passport) => {
                  const prediction = getPrediction(passport);

                  return (
                    <tr key={passport.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#142D27]">
                          {passport.id}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {passport.equipment || "Equipment not specified"}
                        </p>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                        {passport.action || "Action not specified"}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#142D27]">
                          {formatNumber(prediction.energy)} kWh
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatNumber(prediction.cost)} ₹
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                            passport.status
                          )}`}
                        >
                          {passport.status || "Draft"}
                        </span>
                        {passport.verification?.mode === "SIMULATED" && (
                          <p className="mt-2 text-xs text-slate-400">
                            Simulated result
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                          <CalendarDays size={15} />
                          {formatDate(passport.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => {
                            setSelectedPassport(passport);
                            setVerificationMessage("");
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#142D27] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2E8B68]"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedPassport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
          <div className="my-auto w-full max-w-3xl rounded-2xl bg-[#F7F8F4] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5 sm:p-6">
              <div>
                <p className="text-sm font-semibold text-[#2E8B68]">
                  ACTION PASSPORT DETAILS
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#142D27]">
                  {selectedPassport.id}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedPassport.equipment}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPassport(null);
                  setVerificationMessage("");
                }}
                aria-label="Close details"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                    selectedPassport.status
                  )}`}
                >
                  {selectedPassport.status || "Draft"}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  SIMULATED DATA
                </span>
              </div>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-[#142D27]">
                  Proposed action
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedPassport.action || "No action description provided."}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  Created {formatDate(selectedPassport.createdAt)}
                </p>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-[#142D27]">
                  Predicted impact
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric
                    icon={Zap}
                    label="Energy saved"
                    value={getPrediction(selectedPassport).energy}
                    unit="kWh/week"
                  />
                  <Metric
                    icon={IndianRupee}
                    label="Cost saved"
                    value={getPrediction(selectedPassport).cost}
                    unit="₹/week"
                  />
                  <Metric
                    icon={Leaf}
                    label="Emissions saved"
                    value={getPrediction(selectedPassport).emissions}
                    unit="kg CO₂e/week"
                  />
                </div>
              </section>

              {selectedPassport.assumptions && (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="font-semibold text-[#142D27]">
                    Simulation assumptions
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    {Object.entries(selectedPassport.assumptions).map(
                      ([key, value]) => (
                        <div key={key} className="rounded-lg bg-[#F7F8F4] p-3">
                          <p className="text-xs text-slate-500">
                            {key.replace(/([A-Z])/g, " $1")}
                          </p>
                          <p className="mt-1 font-semibold text-[#142D27]">
                            {String(value)}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className="mt-0.5 shrink-0 text-amber-600"
                    size={20}
                  />
                  <div>
                    <h3 className="font-semibold text-[#142D27]">
                      Follow-up verification
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Run a demo follow-up to compare the predicted energy
                      savings with an illustrative observed value. This does
                      not read real meters or prove actual savings.
                    </p>
                  </div>
                </div>

                {selectedPassport.verification && (
                  <div className="mt-4 rounded-xl bg-[#F7F8F4] p-4">
                    <p className="text-sm font-semibold text-[#142D27]">
                      Latest follow-up — simulated
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-500">Predicted</p>
                        <p className="mt-1 font-bold text-[#142D27]">
                          {formatNumber(
                            selectedPassport.verification.predictedKwh
                          )}{" "}
                          kWh/week
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Simulated observed
                        </p>
                        <p className="mt-1 font-bold text-[#142D27]">
                          {formatNumber(
                            selectedPassport.verification.observedKwh
                          )}{" "}
                          kWh/week
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Difference below prediction
                        </p>
                        <p className="mt-1 font-bold text-[#142D27]">
                          {formatNumber(
                            selectedPassport.verification.differenceKwh
                          )}{" "}
                          kWh/week
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {selectedPassport.verification.message}
                    </p>
                  </div>
                )}

                {verificationMessage && (
                  <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                    {verificationMessage}
                  </p>
                )}

                <button
                  onClick={() => runSimulatedFollowUp(selectedPassport)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2E8B68] px-4 py-3 font-semibold text-white hover:bg-[#246D52]"
                >
                  <Play size={17} />
                  Run simulated follow-up
                </button>
              </section>

              <p className="text-xs leading-5 text-slate-400">
                WattProof Twin demo: all sample passports and generated
                follow-up readings are illustrative. Real verification
                requires comparable baseline and follow-up energy readings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
