import AIChatbox from "./components/AIChatbox";
import Equipment from './pages/Equipment.jsx'
import DigitalTwin from './pages/DigitalTwin.jsx'
import AIInsights from "./pages/AIInsights";
import ActionPassports from "./pages/ActionPassports";
import LandingPage from "./pages/LandingPage";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Home } from "lucide-react";
import {
  ENERGY_ASSUMPTIONS
} from "./data/mockData";

import { useState, useEffect } from "react";
import { getEnergySummary } from './api'
import {
  LayoutDashboard,
  Boxes,
  SlidersHorizontal,
  Lightbulb,
  FileCheck2,
  Search,
  Bell,
  Zap,
  IndianRupee,
  Leaf,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react'

const navigation = [
  { name: "Home", icon: Home },
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Equipment', icon: Boxes },
  { name: 'Digital Twin', icon: SlidersHorizontal },
  { name: 'AI Insights', icon: Lightbulb },
  { name: 'Action Passports', icon: FileCheck2 },
]


function buildMetrics(summary, loading) {
  if (loading || !summary) {
    return [
      {
        title: 'Energy Used',
        value: loading ? '…' : '—',
        unit: 'kWh',
        note: 'Estimated weekly consumption',
        icon: Zap,
        color: 'bg-[#B9F3D2] text-[#142D27]',
      },
      {
        title: 'Estimated Cost',
        value: '—',
        unit: '',
        note: 'Weekly estimate',
        icon: IndianRupee,
        color: 'bg-blue-50 text-blue-700',
      },
      {
        title: 'Estimated CO₂',
        value: '—',
        unit: 'kg CO₂e',
        note: 'Weekly estimate',
        icon: Leaf,
        color: 'bg-[#B9F3D2] text-[#142D27]',
      },
      {
        title: 'Potential Savings',
        value: '—',
        unit: 'kWh',
        note: 'Run a Digital Twin simulation',
        icon: TrendingDown,
        color: 'bg-[#B9F3D2] text-[#142D27]',
      },
    ]
  }

  const weeklyEnergy = Number(summary.total_weekly_energy_kwh) || 0
  const tariff = ENERGY_ASSUMPTIONS.tariffINRPerKWh
  const emissionsFactor = ENERGY_ASSUMPTIONS.emissionsFactorKgPerKWh

  return [
    {
      title: 'Energy Used',
      value: weeklyEnergy.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      }),
      unit: 'kWh',
      note: 'Estimated weekly consumption from saved equipment',
      icon: Zap,
      color: 'bg-[#B9F3D2] text-[#142D27]',
    },
    {
      title: 'Estimated Cost',
      value: `₹${(weeklyEnergy * tariff).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      })}`,
      unit: '',
      note: `Weekly estimate at ₹${tariff}/kWh`,
      icon: IndianRupee,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Estimated CO₂',
      value: (weeklyEnergy * emissionsFactor).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      }),
      unit: 'kg CO₂e',
      note: 'Estimated weekly emissions',
      icon: Leaf,
      color: 'bg-[#B9F3D2] text-[#142D27]',
    },
    {
      title: 'Potential Savings',
      value: '—',
      unit: 'kWh',
      note: 'Run a Digital Twin simulation',
      icon: TrendingDown,
      color: 'bg-[#B9F3D2] text-[#142D27]',
    },
  ]
}




function Sidebar({ activePage, setActivePage, open, close }) {
  return (
    <>
      {open && (
        <button
          aria-label="Close navigation overlay"
          onClick={close}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[#142D27] transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B9F3D2] text-[#142D27]">
              <Zap size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                WattProof
              </h1>
              <p className="text-xs text-white/65">
                Twin · Energy intelligence
              </p>
            </div>
          </div>

          <button
            onClick={close}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-white/50">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => {
                  setActivePage(name)
                  close()
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${activePage === name
                  ? 'bg-[#B9F3D2] text-[#142D27]'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <Icon size={19} />
                <span>{name}</span>

                {activePage === name && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-[#2E8B68]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-[#B9F3D2]">
              <Leaf size={18} />
              <span className="text-sm font-semibold">Energy awareness</span>
            </div>

            <p className="text-xs leading-5 text-white/75">
              Small operational changes can create meaningful savings.
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-white/45">
            WattProof Twin · Hackathon MVP
          </p>
        </div>
      </aside>
    </>
  )
}

function MetricCard({ metric }) {
  const Icon = metric.icon

  return (
    <article className="rounded-2xl border border-[#E2E8E0] bg-white p-5 shadow-sm shadow-[#142D27]/5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#64748B]">
          {metric.title}
        </p>

        <span className={`rounded-xl p-2.5 ${metric.color}`}>
          <Icon size={20} />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-[#142D27]">
          <AnimatedMetric
            value={metric.value}
            prefix={metric.title === "Estimated Cost" ? "₹" : ""}
            suffix=""
            decimals={metric.title === "Estimated CO₂" ? 1 : 0}
          />
        </span>

        {metric.unit && (
          <span className="text-sm text-[#64748B]">{metric.unit}</span>
        )}
      </div>

      <p className="mt-2 text-xs leading-5 text-[#64748B]">
        {metric.note}
      </p>
    </article>
  )
}


function EnergyTrendChart({ summary }) {
  const weeklyEnergy = Number(summary?.total_weekly_energy_kwh) || 0
  const dailyAverage = weeklyEnergy / 7

  return (
    <section className="rounded-2xl border border-[#E2E8E0] bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-semibold text-[#142D27]">
        Energy consumption
      </h3>
      <p className="mt-1 text-sm text-[#64748B]">
        Estimated usage from saved equipment
      </p>

      <div className="mt-6 rounded-xl bg-[#F7F8F4] p-5">
        <p className="text-sm text-[#64748B]">
          Estimated weekly energy
        </p>
        <p className="mt-2 text-3xl font-bold text-[#142D27]">
          {weeklyEnergy.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
          })} kWh
        </p>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E2E8E0]">
          <div
            className="h-full rounded-full bg-[#2E8B68]"
            style={{ width: weeklyEnergy > 0 ? '100%' : '0%' }}
          />
        </div>

        <p className="mt-4 text-sm text-[#64748B]">
          Average per calendar day: {dailyAverage.toFixed(2)} kWh
        </p>
      </div>

      <p className="mt-4 text-xs leading-5 text-[#64748B]">
        These are estimates based on rated power and operating schedules,
        not daily meter readings.
      </p>
    </section>
  )
}



function EquipmentUsageChart({ summary }) {
  const items = summary?.equipment_breakdown || []
  const maxEnergy = Math.max(
    0,
    ...items.map((item) => Number(item.weekly_energy_kwh) || 0)
  )

  return (
    <section className="rounded-2xl border border-[#E2E8E0] bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-semibold text-[#142D27]">
        Usage by equipment
      </h3>
      <p className="mt-1 text-sm text-[#64748B]">
        Estimated weekly consumption from your inventory
      </p>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No saved equipment is available yet.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {items.map((item) => {
            const energy = Number(item.weekly_energy_kwh) || 0
            const percentage =
              maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0

            return (
              <div key={item.appliance_id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-[#142D27]">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-[#64748B]">
                    {energy.toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                    })} kWh
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF1ED]">
                  <div
                    className="h-full rounded-full bg-[#2E8B68]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-6 border-t border-[#E2E8E0] pt-4 text-xs leading-5 text-[#64748B]">
        Estimates use the saved equipment inventory and configured
        operating schedules.
      </p>
    </section>
  )
}



function Overview({ setActivePage }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      setLoading(true)
      setApiError('')

      try {
        const data = await getEnergySummary()

        if (!cancelled) {
          setSummary(data)
        }
      } catch (error) {
        console.error('Could not load energy summary:', error)

        if (!cancelled) {
          setApiError(
            'Could not load live inventory estimates. Check that the backend is running.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSummary()

    return () => {
      cancelled = true
    }
  }, [])

  const metrics = buildMetrics(summary, loading)

  return (
    <>
      {apiError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} metric={metric} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {summary && (
          <>
            <EnergyTrendChart summary={summary} />
            <EquipmentUsageChart summary={summary} />
          </>
        )}

        {loading && (
          <p className="text-sm text-slate-500">
            Loading energy estimates from your saved equipment…
          </p>
        )}
      </div>

      {/* Keep your existing Opportunity detected section here */}


      <section className="mt-6 overflow-hidden rounded-2xl border border-[#B9F3D2] bg-white">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#B9F3D2]/60 p-3 text-[#142D27]">
              <Lightbulb size={23} />
            </div>

            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-[#142D27]">
                  Opportunity detected
                </h3>

                <span className="rounded-full bg-[#B9F3D2]/60 px-2.5 py-1 text-xs font-medium text-[#142D27]">
                  Example
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Explore whether reducing the configured air-conditioning
                schedule could lower energy use. The potential benefit must
                be calculated from the selected equipment and operating hours.
              </p>

              <p className="mt-2 text-xs text-[#64748B]">
                Simulated scenario · Not a measured or guaranteed saving
              </p>
            </div>
          </div>

          <button
            onClick={() => setActivePage('Digital Twin')}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2E8B68] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#246F53]"
          >
            Explore Digital Twin <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[#E2E8E0] bg-white p-5 shadow-sm shadow-[#142D27]/5 sm:p-6">
        <h3 className="font-semibold text-[#142D27]">Recent activity</h3>

        <div className="mt-4 divide-y divide-[#E2E8E0]">
          {[
            {
              title: 'Demo dashboard loaded',
              detail: 'Illustrative energy metrics',
              status: 'Simulated',
            },
            {
              title: 'Equipment usage overview',
              detail: 'Example equipment profiles',
              status: 'Demo data',
            },
            {
              title: 'Action Passport workflow',
              detail: 'Ready for the next implementation step',
              status: 'Not verified',
            },
          ].map((activity) => (
            <div
              key={activity.title}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-[#142D27]">
                  {activity.title}
                </p>
                <p className="mt-1 text-xs text-[#64748B]">
                  {activity.detail}
                </p>
              </div>

              <span className="w-fit rounded-full bg-[#F7F8F4] px-3 py-1 text-xs text-[#64748B]">
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function PagePlaceholder({ page }) {
  const descriptions = {
    Equipment:
      'Review equipment profiles, add appliances, and prepare the image detection workflow.',
    'Digital Twin':
      'Compare baseline and proposed operating schedules to estimate energy, cost, and emissions savings.',
    'AI Insights':
      'Review explainable recommendations based on configured data and calculated metrics.',
    'Action Passports':
      'Track proposed interventions and compare predictions with clearly labeled simulated follow-up readings.',
  }

  return (
    <section className="rounded-2xl border border-[#E2E8E0] bg-white p-8 sm:p-12">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B9F3D2] text-[#142D27]">
          <Zap size={27} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-[#142D27]">{page}</h2>

        <p className="mt-3 text-sm leading-6 text-[#64748B]">
          {descriptions[page]}
        </p>

        <p className="mt-4 text-xs text-[#64748B]">
          This page is a placeholder. Its functionality will be implemented
          next.
        </p>
      </div>
    </section>
  )
}

function AnimatedMetric({ value, prefix = "", suffix = "", decimals = 0 }) {
  const numericValue = Number(
    String(value).replace(/[₹,\s]/g, "").replace(/[^0-9.-]/g, "")
  );

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    latest.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(count, numericValue, {
      duration: 1.4,
      ease: "easeOut",
    });

    const unsubscribe = rounded.on("change", setDisplayValue);

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, numericValue, rounded]);

  return (
    <span>
      {prefix}{displayValue}{suffix}
    </span>
  );
}


export default function App() {
  const [activePage, setActivePage] = useState("Landing");
  const [menuOpen, setMenuOpen] = useState(false)
  if (activePage === "Landing" || activePage === "Home") {
    return (
      <LandingPage
        onEnter={() => setActivePage("Overview")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F4] text-[#142D27]">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        open={menuOpen}
        close={() => setMenuOpen(false)}
      />

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[#E2E8E0] bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-[#64748B] hover:bg-[#F7F8F4] lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-xs text-[#64748B]">
                Workspace / {activePage}
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#142D27]">
                {activePage}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-2 rounded-full border border-[#B9F3D2] bg-[#B9F3D2]/40 px-3 py-2 text-xs font-semibold text-[#142D27] sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-[#2E8B68]" />
              SIMULATED DATA
            </span>

            <button
              aria-label="Search is not available yet"
              title="Search will be implemented later"
              className="rounded-xl p-2.5 text-[#64748B] hover:bg-[#F7F8F4]"
            >
              <Search size={19} />
            </button>

            <button
              aria-label="Notifications are not available yet"
              title="Notifications will be implemented later"
              className="rounded-xl p-2.5 text-[#64748B] hover:bg-[#F7F8F4]"
            >
              <Bell size={19} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#2E8B68]">
                Energy Savings That Prove Themselves
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#142D27] sm:text-3xl">
                {activePage === 'Overview' ? 'Energy overview' : activePage}
              </h1>

              <p className="mt-2 text-sm text-[#64748B]">
                Monitor, explore and simulate energy-saving opportunities.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E2E8E0] bg-white px-3 py-2.5 text-sm text-[#64748B]">
              <ArrowUpRight size={17} className="text-[#2E8B68]" />
              Demo workspace
            </span>
          </div>



          {activePage === 'Home' ? (
            <LandingPage onEnter={() => setActivePage('Overview')} />
          ) : activePage === 'Overview' ? (
            <Overview setActivePage={setActivePage} />
          ) : activePage === 'Equipment' ? (
            <Equipment />
          ) : activePage === 'Digital Twin' ? (
            <DigitalTwin onSavePassport={() => setActivePage('Action Passports')} />
          ) : activePage === 'AI Insights' ? (
            <AIInsights setActivePage={setActivePage} />
          ) : activePage === 'Action Passports' ? (
            <ActionPassports />
          ) : (
            <PagePlaceholder page={activePage} />
          )}
          WattProof Twin · Demonstration interface · Values are estimates unless marked as measured
        </main>
      </div>
      <AIChatbox />
    </div>
  )


}