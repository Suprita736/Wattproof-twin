
import { useEffect, useState } from "react";
import { getPassports, addPassportReading } from "../api";
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

const READING_SOURCES = [
  { value: "utility_meter", label: "Utility meter" },
  { value: "sub_meter", label: "Sub-meter" },
  { value: "smart_plug", label: "Smart plug" },
  { value: "manual_log", label: "Manual log" },
  { value: "simulated_demo", label: "Simulated (demo only)" },
];

function sourceLabel(value) {
  const match = READING_SOURCES.find((item) => item.value === value);
  return match ? match.label : value;
}

// Today's date in the user's own time zone, as YYYY-MM-DD.
function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function emptyReadingForm() {
  return {
    readingDate: todayISO(),
    observedWeeklyKwh: "",
    source: "smart_plug",
    notes: "",
  };
}

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
  const [passports, setPassports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPassport, setSelectedPassport] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [readingForm, setReadingForm] = useState(emptyReadingForm());
  const [readingError, setReadingError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPassports() {
      try {
        const data = await getPassports();

        if (!cancelled) {
          setPassports(data);
          setLoadError("");
        }
      } catch (error) {
        console.error("Could not load Action Passports:", error);

        if (!cancelled) {
          setLoadError(
            "Could not load Action Passports. Check that the backend is running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPassports();

    return () => {
      cancelled = true;
    };
  }, []);

  function openPassport(passport) {
    setSelectedPassport(passport);
    setVerificationMessage("");
    setReadingError("");
    setReadingForm(emptyReadingForm());
  }

  function updateReadingField(event) {
    const { name, value } = event.target;

    setReadingForm((current) => ({ ...current, [name]: value }));
    setReadingError("");
  }

  async function submitReading(event) {
    event.preventDefault();

    if (!selectedPassport) return;

    const observed = Number(readingForm.observedWeeklyKwh);

    if (
      readingForm.observedWeeklyKwh === "" ||
      !Number.isFinite(observed) ||
      observed < 0
    ) {
      setReadingError(
        "Enter the weekly energy in kWh as a number of 0 or more."
      );
      return;
    }

    if (!readingForm.readingDate) {
      setReadingError("Choose the date of the reading.");
      return;
    }

    setSubmitting(true);

    try {
      const updated = await addPassportReading(selectedPassport.id, {
        readingDate: readingForm.readingDate,
        observedWeeklyKwh: observed,
        source: readingForm.source,
        notes: readingForm.notes,
      });

      setPassports((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setSelectedPassport(updated);
      setVerificationMessage("Reading recorded. The comparison is shown above.");
      setReadingForm((current) => ({
        ...current,
        observedWeeklyKwh: "",
        notes: "",
      }));
      setReadingError("");
    } catch (error) {
      console.error("Could not record reading:", error);
      setReadingError(
        error.message === "Failed to fetch"
          ? "Could not reach the backend. Check that it is running and try again."
          : error.message
      );
    } finally {
      setSubmitting(false);
    }
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

  const belowCount = passports.filter((p) =>
    (p.status || "").toLowerCase().includes("below")
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
            <p className="text-sm text-slate-500">Verified</p>
            <CheckCircle2 className="text-[#2E8B68]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#142D27]">
            {verifiedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {belowCount} below prediction
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

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading Action Passports…
        </div>
      ) : filteredPassports.length === 0 ? (
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
                        {passport.verification && (
                          <p className="mt-2 text-xs text-slate-400">
                            {passport.verification.evidence === "MEASURED"
                              ? "Measured reading"
                              : "Simulated reading"}
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
                          onClick={() => openPassport(passport)}
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
                  PREDICTION: SIMULATED
                </span>
                {selectedPassport.verification && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedPassport.verification.evidence === "MEASURED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                      }`}
                  >
                    {selectedPassport.verification.evidence === "MEASURED"
                      ? "EVIDENCE: MEASURED"
                      : "EVIDENCE: SIMULATED"}
                  </span>
                )}
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
                      After the action is in place, record the energy used
                      over one full operating week (kWh). It is compared with
                      the predicted weekly saving. Choose the source
                      honestly: only meter or smart-plug readings count as
                      measured evidence.
                    </p>
                  </div>
                </div>

                {selectedPassport.verification && (
                  <div className="mt-4 rounded-xl bg-[#F7F8F4] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#142D27]">
                        Latest follow-up (
                        {formatDate(selectedPassport.verification.readingDate)})
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedPassport.verification.evidence === "MEASURED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                          }`}
                      >
                        {selectedPassport.verification.evidence === "MEASURED"
                          ? "MEASURED READING"
                          : "SIMULATED READING"}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-500">
                          Baseline (modelled)
                        </p>
                        <p className="mt-1 font-bold text-[#142D27]">
                          {formatNumber(selectedPassport.verification.baselineKwh)}{" "}
                          kWh/week
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Predicted after action
                        </p>
                        <p className="mt-1 font-bold text-[#142D27]">
                          {formatNumber(selectedPassport.verification.predictedKwh)}{" "}
                          kWh/week
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Observed</p>
                        <p className="mt-1 font-bold text-[#142D27]">
                          {formatNumber(selectedPassport.verification.observedKwh)}{" "}
                          kWh/week
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Predicted saving achieved
                        </p>
                        <p className="mt-1 font-bold text-[#142D27]">
                          {selectedPassport.verification.observedSavedKwh <= 0
                            ? "No saving"
                            : `${formatNumber(
                              selectedPassport.verification.savingsAchievedPercent
                            )}%`}
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

                {selectedPassport.readings?.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <p className="mb-2 text-sm font-semibold text-[#142D27]">
                      Recorded readings
                    </p>
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="py-2 pr-3">Date</th>
                          <th className="py-2 pr-3">kWh/week</th>
                          <th className="py-2 pr-3">Source</th>
                          <th className="py-2 pr-3">Evidence</th>
                          <th className="py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPassport.readings.map((reading) => (
                          <tr key={reading.id}>
                            <td className="py-2 pr-3">
                              {formatDate(reading.readingDate)}
                            </td>
                            <td className="py-2 pr-3">
                              {formatNumber(reading.observedWeeklyKwh)}
                            </td>
                            <td className="py-2 pr-3">
                              {sourceLabel(reading.source)}
                            </td>
                            <td className="py-2 pr-3">
                              {reading.measured ? "Measured" : "Simulated"}
                            </td>
                            <td className="py-2 text-slate-500">
                              {reading.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <form onSubmit={submitReading} className="mt-5 space-y-3">
                  <p className="text-sm font-semibold text-[#142D27]">
                    Record a follow-up reading
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-sm text-slate-600">
                      Reading date
                      <input
                        type="date"
                        name="readingDate"
                        value={readingForm.readingDate}
                        onChange={updateReadingField}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#2E8B68]"
                        required
                      />
                    </label>

                    <label className="text-sm text-slate-600">
                      Energy used in one week (kWh)
                      <input
                        type="number"
                        name="observedWeeklyKwh"
                        min="0"
                        step="any"
                        value={readingForm.observedWeeklyKwh}
                        onChange={updateReadingField}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#2E8B68]"
                        required
                      />
                    </label>

                    <label className="text-sm text-slate-600">
                      Source
                      <select
                        name="source"
                        value={readingForm.source}
                        onChange={updateReadingField}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#2E8B68]"
                      >
                        {READING_SOURCES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block text-sm text-slate-600">
                    Notes (optional)
                    <input
                      type="text"
                      name="notes"
                      maxLength={500}
                      value={readingForm.notes}
                      onChange={updateReadingField}
                      placeholder="e.g. normal week, no exams"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#2E8B68]"
                    />
                  </label>

                  {readingError && (
                    <p
                      role="alert"
                      className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800"
                    >
                      {readingError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2E8B68] px-4 py-3 font-semibold text-white hover:bg-[#246D52] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play size={17} />
                    {submitting ? "Recording…" : "Record reading"}
                  </button>
                </form>
              </section>

              <p className="text-xs leading-5 text-slate-400">
                Predictions come from a simulation using the listed
                assumptions. A passport only shows measured evidence when
                its follow-up reading comes from a meter, sub-meter, smart
                plug or manual log. The baseline is the modelled estimate,
                not a measured baseline week.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
