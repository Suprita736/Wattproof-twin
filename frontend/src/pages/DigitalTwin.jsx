import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  CheckCircle2,
  FileCheck2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  EQUIPMENT_PROFILES,
  ENERGY_ASSUMPTIONS,
  calculateEnergyKWh,
  calculateSavings as calculateSharedSavings,
} from '../data/mockData'
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const equipmentOptions = Object.fromEntries(
  EQUIPMENT_PROFILES.map((profile) => [profile.name, profile]),
)

const firstProfile = EQUIPMENT_PROFILES[0]

const initialForm = {
  equipment: firstProfile.name,
  power: String(firstProfile.ratedPowerW),
  units: String(firstProfile.units),
  baselineHours: String(firstProfile.hoursPerDay),
  proposedHours: String(Math.max(0, firstProfile.hoursPerDay - 1)),
  days: String(firstProfile.operatingDaysPerWeek),
  tariff: String(ENERGY_ASSUMPTIONS.tariffINRPerKWh),
  emissionsFactor: String(ENERGY_ASSUMPTIONS.emissionsFactorKgPerKWh),
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-[#DDE5DD] bg-white px-3 py-2.5 text-sm text-[#142D27] outline-none focus:border-[#2E8B68] focus:ring-2 focus:ring-[#2E8B68]/15'

function calculateScenario(form) {
  const ratedPowerW = Number(form.power)
  const units = Number(form.units)
  const baselineHours = Number(form.baselineHours)
  const proposedHours = Number(form.proposedHours)
  const operatingDaysPerWeek = Number(form.days)
  const tariffINRPerKWh = Number(form.tariff)
  const emissionsFactorKgPerKWh = Number(form.emissionsFactor)

  const baselineEnergy = calculateEnergyKWh({
    ratedPowerW,
    units,
    hoursPerDay: baselineHours,
    operatingDaysPerWeek,
  })

  const proposedEnergy = calculateEnergyKWh({
    ratedPowerW,
    units,
    hoursPerDay: proposedHours,
    operatingDaysPerWeek,
  })

  const savings = calculateSharedSavings({
    ratedPowerW,
    units,
    baselineHours,
    proposedHours,
    operatingDaysPerWeek,
    tariffINRPerKWh,
    emissionsFactorKgPerKWh,
  })

  return {
    baselineEnergy,
    proposedEnergy,
    energySaved: savings.energySavedKWh,
    baselineCost: baselineEnergy * tariffINRPerKWh,
    proposedCost: proposedEnergy * tariffINRPerKWh,
    costSaved: savings.costSavedINR,
    baselineEmissions: baselineEnergy * emissionsFactorKgPerKWh,
    proposedEmissions: proposedEnergy * emissionsFactorKgPerKWh,
    emissionsSaved: savings.emissionsSavedKgCO2e,
    reduction:
      baselineEnergy > 0
        ? (savings.energySavedKWh / baselineEnergy) * 100
        : null,
  }
}

function ResultCard({ title, value, unit, description, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-[#E2E8E0] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#64748B]">{title}</p>
        <div className="rounded-xl bg-[#B9F3D2]/60 p-2.5 text-[#142D27]">
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight text-[#142D27]">
        {value}
        <span className="ml-1.5 text-sm font-medium text-[#64748B]">
          {unit}
        </span>
      </p>

      <p className="mt-2 text-xs leading-5 text-[#64748B]">{description}</p>
    </article>
  )
}

function ComparisonChart({ results }) {
  const data = [
    {
      name: 'Energy',
      Baseline: Number(results.baselineEnergy.toFixed(2)),
      Proposed: Number(results.proposedEnergy.toFixed(2)),
      unit: 'kWh/week',
    },
    {
      name: 'Cost',
      Baseline: Number(results.baselineCost.toFixed(2)),
      Proposed: Number(results.proposedCost.toFixed(2)),
      unit: '₹/week',
    },
    {
      name: 'Emissions',
      Baseline: Number(results.baselineEmissions.toFixed(2)),
      Proposed: Number(results.proposedEmissions.toFixed(2)),
      unit: 'kg CO₂e/week',
    },
  ]

  return (
    <section className="rounded-2xl border border-[#E2E8E0] bg-white p-5 sm:p-6">
      <div>
        <h3 className="font-semibold text-[#142D27]">
          Baseline vs. proposed
        </h3>
        <p className="mt-1 text-sm text-[#64748B]">
          Weekly comparison using your configured assumptions
        </p>
      </div>

      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
          >
            <CartesianGrid stroke="#E2E8E0" strokeDasharray="4 4" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={{ stroke: '#DDE5DD' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              formatter={(value, name, props) => [
                `${value} ${props.payload.unit}`,
                name,
              ]}
              contentStyle={{
                borderRadius: 12,
                borderColor: '#DDE5DD',
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="Baseline"
              fill="#142D27"
              radius={[5, 5, 0, 0]}
            />
            <Bar
              dataKey="Proposed"
              fill="#2E8B68"
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#64748B]">
        The three measures use different units and scales. Hover over a bar
        to view its value and unit.
      </p>
    </section>
  )
}

export default function DigitalTwin({ onSavePassport }) {
  const [form, setForm] = useState(initialForm)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wattproof-selected-simulation')

      if (!saved) return

      const selected = JSON.parse(saved)

      setForm((current) => ({
        ...current,
        equipment: equipmentOptions[selected.equipment]
          ? selected.equipment
          : current.equipment,
        power: String(selected.ratedPower ?? current.power),
        units: String(selected.units ?? current.units),
        baselineHours: String(selected.baselineHours ?? current.baselineHours),
        proposedHours: String(selected.proposedHours ?? current.proposedHours),
        days: String(selected.operatingDays ?? current.days),
        tariff: String(selected.tariff ?? current.tariff),
        emissionsFactor: String(
          selected.emissionsFactor ?? current.emissionsFactor
        ),
      }))

      setResults(null)
      setError('')
      setNotice('Recommendation loaded. Run the simulation to calculate its impact.')

      localStorage.removeItem('wattproof-selected-simulation')
    } catch (error) {
      console.error('Could not load selected recommendation:', error)
      setError('Could not load the selected recommendation.')
    }
  }, [])


  function updateField(event) {
    const { name, value } = event.target

    if (name === 'equipment') {
      const profile = equipmentOptions[value]

      setForm((current) => ({
        ...current,
        equipment: value,
        power: String(profile.ratedPowerW),
        units: String(profile.units),
        baselineHours: String(profile.hoursPerDay),
        proposedHours: String(Math.max(0, profile.hoursPerDay - 1)),
        days: String(profile.operatingDaysPerWeek),
      }))
    } else {
      setForm((current) => ({ ...current, [name]: value }))
    }

    setResults(null)
    setError('')
    setNotice('')
  }

  function runSimulation(event) {
    event.preventDefault()

    const values = [
      Number(form.power),
      Number(form.units),
      Number(form.baselineHours),
      Number(form.proposedHours),
      Number(form.days),
      Number(form.tariff),
      Number(form.emissionsFactor),
    ]

    if (!values.every(Number.isFinite)) {
      setError('Please enter valid numbers in all fields.')
      return
    }

    const [
      power,
      units,
      baselineHours,
      proposedHours,
      days,
      tariff,
      emissionsFactor,
    ] = values

    if (
      power < 0 ||
      units < 1 ||
      !Number.isInteger(units) ||
      baselineHours < 0 ||
      baselineHours > 24 ||
      proposedHours < 0 ||
      proposedHours > 24 ||
      days < 1 ||
      days > 7 ||
      !Number.isInteger(days) ||
      tariff < 0 ||
      emissionsFactor < 0
    ) {
      setError(
        'Power, tariff and emissions factor must be non-negative. Units must be at least 1, hours must be 0–24, and days must be 1–7.',
      )
      return
    }

    setResults(calculateScenario(form))
    setError('')
    setNotice('Simulation completed using your configured assumptions.')
  }

  function applyPreset(preset) {
    if (preset === 'reduce') {
      setForm((current) => ({
        ...current,
        proposedHours: String(
          Math.max(0, Number(current.baselineHours) - 1),
        ),
      }))
    } else if (preset === 'idle') {
      setForm((current) => ({
        ...current,
        proposedHours: String(
          Math.max(0, Number(current.baselineHours) - 2),
        ),
      }))
    } else {
      setForm((current) => ({
        ...current,
        proposedHours: current.baselineHours,
      }))
    }

    setResults(null)
    setError('')
    setNotice('')
  }

  function resetForm() {
    setForm(initialForm)
    setResults(null)
    setError('')
    setNotice('')
  }

  function savePassport() {
    if (!results) {
      setError('Run a simulation before saving an Action Passport.')
      return
    }

    const passport = {
      id: `AP-${Date.now()}`,
      equipment: form.equipment,
      action: `Change operating time from ${form.baselineHours} to ${form.proposedHours} hours per day`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      assumptions: {
        powerW: Number(form.power),
        units: Number(form.units),
        baselineHours: Number(form.baselineHours),
        proposedHours: Number(form.proposedHours),
        daysPerWeek: Number(form.days),
        tariffINRPerKWh: Number(form.tariff),
        emissionsFactorKgPerKWh: Number(form.emissionsFactor),
      },
      prediction: results,
      dataMode: 'SIMULATED',
    }

    try {
      const existing = JSON.parse(
        localStorage.getItem('wattproof-action-passports') || '[]',
      )

      if (!Array.isArray(existing)) {
        throw new Error('Invalid saved passport data.')
      }

      localStorage.setItem(
        'wattproof-action-passports',
        JSON.stringify([passport, ...existing]),
      )

      setError('')
      setNotice('Action Passport draft saved on this browser.')

      if (onSavePassport) {
        onSavePassport()
      }
    } catch {
      setError(
        'Could not save the draft in this browser. Check browser storage settings and try again.',
      )
    }
  }

  const estimatedResults = results
  const saved = estimatedResults?.energySaved ?? 0
  const savingsArePositive = saved >= 0

  return (
    <div>
      <div className="mb-7">
        <p className="text-sm font-medium text-[#2E8B68]">
          Simulate before you act
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#142D27] sm:text-3xl">
          Digital Twin
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">
          Adjust an equipment schedule and compare the estimated weekly energy,
          cost and emissions before applying the proposed change.
        </p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#B9F3D2] bg-[#B9F3D2]/40 px-3 py-1.5 text-xs font-semibold text-[#142D27]">
          <span className="h-2 w-2 rounded-full bg-[#2E8B68]" />
          SIMULATED SCENARIO
        </span>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-5 flex items-center gap-2 rounded-xl border border-[#B9F3D2] bg-[#B9F3D2]/30 px-4 py-3 text-sm text-[#142D27]"
        >
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-[#E2E8E0] bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#B9F3D2]/60 p-3 text-[#142D27]">
              <SlidersHorizontal size={21} />
            </div>
            <div>
              <h3 className="font-semibold text-[#142D27]">
                Scenario controls
              </h3>
              <p className="mt-1 text-xs text-[#64748B]">
                All fields are editable assumptions.
              </p>
            </div>
          </div>

          <form onSubmit={runSimulation} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="equipment"
                className="text-sm font-medium text-[#142D27]"
              >
                Select equipment
              </label>
              <select
                id="equipment"
                name="equipment"
                value={form.equipment}
                onChange={updateField}
                className={inputClass}
              >
                {Object.keys(equipmentOptions).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="power"
                  className="text-sm font-medium text-[#142D27]"
                >
                  Rated power (W)
                </label>
                <input
                  id="power"
                  name="power"
                  type="number"
                  min="0"
                  step="any"
                  value={form.power}
                  onChange={updateField}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="units"
                  className="text-sm font-medium text-[#142D27]"
                >
                  Number of units
                </label>
                <input
                  id="units"
                  name="units"
                  type="number"
                  min="1"
                  step="1"
                  value={form.units}
                  onChange={updateField}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8E0] p-4">
              <p className="text-sm font-semibold text-[#142D27]">
                Operating schedule
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="baselineHours"
                    className="text-sm text-[#64748B]"
                  >
                    Baseline hours/day
                  </label>
                  <input
                    id="baselineHours"
                    name="baselineHours"
                    type="number"
                    min="0"
                    max="24"
                    step="any"
                    value={form.baselineHours}
                    onChange={updateField}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="proposedHours"
                    className="text-sm text-[#64748B]"
                  >
                    Proposed hours/day
                  </label>
                  <input
                    id="proposedHours"
                    name="proposedHours"
                    type="number"
                    min="0"
                    max="24"
                    step="any"
                    value={form.proposedHours}
                    onChange={updateField}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="days"
                  className="text-sm text-[#64748B]"
                >
                  Operating days per week
                </label>
                <input
                  id="days"
                  name="days"
                  type="number"
                  min="1"
                  max="7"
                  step="1"
                  value={form.days}
                  onChange={updateField}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#142D27]">
                Calculation assumptions
              </p>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="tariff"
                    className="text-sm text-[#64748B]"
                  >
                    Tariff (₹/kWh)
                  </label>
                  <input
                    id="tariff"
                    name="tariff"
                    type="number"
                    min="0"
                    step="any"
                    value={form.tariff}
                    onChange={updateField}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="emissionsFactor"
                    className="text-sm text-[#64748B]"
                  >
                    Emissions factor
                  </label>
                  <input
                    id="emissionsFactor"
                    name="emissionsFactor"
                    type="number"
                    min="0"
                    step="any"
                    value={form.emissionsFactor}
                    onChange={updateField}
                    className={inputClass}
                    required
                  />
                  <p className="mt-1 text-xs text-[#64748B]">
                    kg CO₂e/kWh
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[#142D27]">
                Quick presets
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('reduce')}
                  className="rounded-lg border border-[#DDE5DD] px-3 py-2 text-xs font-medium text-[#142D27] hover:bg-[#F7F8F4]"
                >
                  Reduce by 1 hour
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('idle')}
                  className="rounded-lg border border-[#DDE5DD] px-3 py-2 text-xs font-medium text-[#142D27] hover:bg-[#F7F8F4]"
                >
                  Reduce by 2 hours
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('compare')}
                  className="rounded-lg border border-[#DDE5DD] px-3 py-2 text-xs font-medium text-[#142D27] hover:bg-[#F7F8F4]"
                >
                  Compare same hours
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-800"
              >
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2E8B68] px-4 py-3 text-sm font-semibold text-white hover:bg-[#246F53]"
              >
                <Activity size={18} />
                Run simulation
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DDE5DD] px-4 py-3 text-sm font-semibold text-[#142D27] hover:bg-[#F7F8F4]"
              >
                <RotateCcw size={17} />
                Reset
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-6">
          {!results ? (
            <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-[#B7C9BD] bg-white p-8 text-center">
              <div className="rounded-2xl bg-[#B9F3D2]/60 p-4 text-[#142D27]">
                <Sparkles size={28} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#142D27]">
                Ready to simulate?
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#64748B]">
                Configure your equipment assumptions and run a simulation to
                see estimated energy, cost and emissions savings.
              </p>
              <p className="mt-4 text-xs text-[#64748B]">
                Results are estimates, not measured or guaranteed savings.
              </p>
            </section>
          ) : (
            <>
              <section className="rounded-2xl border border-[#B9F3D2] bg-[#B9F3D2]/25 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-3 text-[#2E8B68]">
                    {savingsArePositive ? (
                      <ArrowDownRight size={22} />
                    ) : (
                      <Zap size={22} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#142D27]">
                      {savingsArePositive
                        ? 'Estimated weekly energy savings'
                        : 'Estimated increase in energy use'}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#142D27]">
                      {Math.abs(saved).toFixed(2)} kWh
                    </p>
                    <p className="mt-2 text-sm text-[#142D27]/80">
                      {results.reduction === null
                        ? 'Savings percentage unavailable because baseline energy is zero.'
                        : `${results.reduction.toFixed(1)}% change relative to baseline energy.`}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ResultCard
                  title="Baseline energy"
                  value={results.baselineEnergy.toFixed(2)}
                  unit="kWh/week"
                  description="Estimated before the proposed change"
                  icon={Zap}
                />
                <ResultCard
                  title="Proposed energy"
                  value={results.proposedEnergy.toFixed(2)}
                  unit="kWh/week"
                  description="Estimated after the proposed change"
                  icon={Activity}
                />
                <ResultCard
                  title="Estimated cost saved"
                  value={`₹${Math.abs(results.costSaved).toFixed(2)}`}
                  unit="/week"
                  description={
                    results.costSaved >= 0
                      ? 'Potential reduction in electricity cost'
                      : 'Potential increase in electricity cost'
                  }
                  icon={CheckCircle2}
                />
                <ResultCard
                  title="Emissions avoided"
                  value={Math.abs(results.emissionsSaved).toFixed(2)}
                  unit="kg CO₂e/week"
                  description={
                    results.emissionsSaved >= 0
                      ? 'Estimated reduction in emissions'
                      : 'Estimated increase in emissions'
                  }
                  icon={Sparkles}
                />
              </div>

              <ComparisonChart results={results} />

              <section className="rounded-2xl border border-[#E2E8E0] bg-white p-5 sm:p-6">
                <h3 className="font-semibold text-[#142D27]">
                  Calculation assumptions
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    ['Equipment', form.equipment],
                    ['Rated power', `${form.power} W per unit`],
                    ['Units', form.units],
                    [
                      'Operating schedule',
                      `${form.days} days/week`,
                    ],
                    ['Electricity tariff', `₹${form.tariff}/kWh`],
                    [
                      'Emissions factor',
                      `${form.emissionsFactor} kg CO₂e/kWh`,
                    ],
                    [
                      'Comparison period',
                      'One week, using the same operating days',
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-wrap justify-between gap-2 border-b border-[#E2E8E0] pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-[#64748B]">{label}</span>
                      <span className="text-right font-medium text-[#142D27]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 rounded-xl bg-[#F7F8F4] p-3 text-xs leading-5 text-[#64748B]">
                  Energy = power × units × hours per day × operating days ÷
                  1,000. Cost = energy × tariff. Estimated emissions = energy
                  × emissions factor. Actual results may differ due to
                  equipment efficiency, occupancy, weather and usage.
                </p>

                <button
                  onClick={savePassport}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#142D27] px-4 py-3 text-sm font-semibold text-white hover:bg-[#21483C]"
                >
                  <FileCheck2 size={18} />
                  Save as Action Passport
                </button>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}