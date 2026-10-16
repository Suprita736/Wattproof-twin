import { useEffect, useRef, useState } from 'react'
import {
  detectEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipment,
} from '../api'

import {
  Search,
  Plus,
  Upload,
  X,
  Boxes,
  Fan,
  Snowflake,
  Lightbulb,
  CheckCircle2,
  Clock3,
  Pencil,
  Trash2,
  ImagePlus,
  Zap,
} from 'lucide-react'

const categories = [
  'Air Conditioning',
  'Lighting',
  'Fans',
  'Computers',
  'Other',
]

const emptyForm = {
  name: '',
  category: 'Air Conditioning',
  power: '100',
  hours: '4',
  units: '1',
  days: '5',
}

function estimateWeeklyEnergy(item) {
  return (
    (Number(item.power) *
      Number(item.hours) *
      Number(item.units) *
      Number(item.days)) /
    1000
  )
}

function EquipmentIcon({ category }) {
  if (category === 'Air Conditioning') return <Snowflake size={20} />
  if (category === 'Fans') return <Fan size={20} />
  if (category === 'Lighting') return <Lightbulb size={20} />
  if (category === 'Computers') return <Zap size={20} />
  return <Boxes size={20} />
}

function StatusBadge({ status }) {
  const confirmed = status === 'Confirmed'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${confirmed
        ? 'bg-[#B9F3D2]/60 text-[#142D27]'
        : 'bg-amber-50 text-amber-800'
        }`}
    >
      {confirmed ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
      {status}
    </span>
  )
}

function EquipmentForm({ initialValues, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(initialValues || {}),
  }))
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...(initialValues || {}),
    })
    setError('')
  }, [initialValues])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Please enter an equipment name.')
      return
    }

    if (!form.category) {
      setError('Please select a category.')
      return
    }

    const power = Number(form.power)
    const hours = Number(form.hours)
    const units = Number(form.units)
    const days = Number(form.days)

    if (
      !Number.isFinite(power) ||
      !Number.isFinite(hours) ||
      !Number.isFinite(units) ||
      !Number.isFinite(days) ||
      power <= 0 ||
      hours < 0 ||
      hours > 24 ||
      units < 1 ||
      !Number.isInteger(units) ||
      days < 1 ||
      days > 7 ||
      !Number.isInteger(days)
    ) {
      setError(
        'Enter valid values: power > 0, hours 0–24, units ≥ 1, and operating days 1–7.'
      )
      return
    }

    onSave({
      ...form,
      name: form.name.trim(),
      power,
      hours,
      units,
      days,
    })
  }

  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-[#DDE5DD] bg-white px-3 py-2.5 text-sm text-[#142D27] outline-none focus:border-[#2E8B68] focus:ring-2 focus:ring-[#2E8B68]/15'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#142D27]/50 p-4">
      <div className="my-auto w-full max-w-lg rounded-2xl bg-[#F7F8F4] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#142D27]">
              {initialValues ? 'Edit equipment' : 'Add equipment'}
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Enter the equipment's configured power and usage assumptions.
            </p>
          </div>

          <button
            onClick={onCancel}
            aria-label="Close form"
            className="rounded-lg p-2 text-[#64748B] hover:bg-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-[#142D27]">
              Equipment name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="e.g. Meeting room AC"
              className={fieldClass}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#142D27]">
              Category *
            </label>
            <select
              name="category"
              value={form.category}
              onChange={updateField}
              className={fieldClass}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#142D27]">
                Rated power (W)
              </label>
              <input
                name="power"
                type="number"
                min="0.1"
                step="any"
                value={form.power}
                onChange={updateField}
                className={fieldClass}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#142D27]">
                Hours per day
              </label>
              <input
                name="hours"
                type="number"
                min="0"
                max="24"
                step="any"
                value={form.hours}
                onChange={updateField}
                className={fieldClass}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#142D27]">
                Number of units
              </label>
              <input
                name="units"
                type="number"
                min="1"
                step="1"
                value={form.units}
                onChange={updateField}
                className={fieldClass}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#142D27]">
                Days per week
              </label>
              <input
                name="days"
                type="number"
                min="1"
                max="7"
                step="1"
                value={form.days}
                onChange={updateField}
                className={fieldClass}
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#B9F3D2] bg-[#B9F3D2]/30 p-3">
            <p className="text-xs leading-5 text-[#142D27]">
              <strong>Estimated weekly energy:</strong>{' '}
              {(
                (Number(form.power) *
                  Number(form.hours) *
                  Number(form.units) *
                  Number(form.days)) /
                1000
              ).toFixed(2)}{' '}
              kWh. This is calculated from your inputs, not measured electricity.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-[#DDE5DD] bg-white px-4 py-2.5 text-sm font-medium text-[#142D27] hover:bg-[#F7F8F4]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#2E8B68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#246F53]"
            >
              Save equipment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PhotoDetection({ onClose, onAddDetection }) {
  const fileInput = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function chooseFile(event) {
    const selected = event.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('Please choose an image smaller than 5 MB.')
      return
    }

    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setDetections([])
    setError('')
  }

  function removeImage() {
    setFile(null)
    setPreview('')
    setDetections([])
    setError('')
    if (fileInput.current) fileInput.current.value = ''
  }

  async function runDetection() {
    if (!file) {
      setError('Please select an image first.')
      return
    }

    setLoading(true)
    setError('')
    setDetections([])

    try {
      const result = await detectEquipment(file)

      // Only keep detections the CV service could map to a known appliance
      // type. Raw labels such as "backpack" or "traffic light" are ignored.
      const found = (Array.isArray(result?.detections) ? result.detections : [])
        .filter((item) => Boolean(item.appliance_type))

      setDetections(found)

      if (found.length === 0) {
        setError(
          result?.detection_count > 0
            ? 'Objects were detected, but none are supported electrical equipment. Try a clearer photo, or add the equipment manually.'
            : result?.message || 'No equipment was detected. Try another image.',
        )
      }
    } catch (err) {
      setError(
        err?.message ||
        'Could not connect to the computer-vision service. Check that the CV API is running on port 8001.'
      )
    } finally {
      setLoading(false)
    }
  }

  function getDetectionName(item) {
    return item.appliance_type || item.label || item.class_name || 'Equipment'
  }

  function getDetectionPower(item) {
    const value = item.suggested_power_watts ?? item.power_watts
    return Number.isFinite(Number(value)) && value !== null ? Number(value) : 100
  }

  function getCategory(item) {
    const name = getDetectionName(item).toLowerCase()
    if (name.includes('air conditioner') || name === 'ac' || name.includes('cooling')) return 'Air Conditioning'
    if (name.includes('fan')) return 'Fans'
    if (name.includes('light') || name.includes('lamp')) return 'Lighting'
    if (name.includes('computer') || name.includes('laptop') || name.includes('television') || name.includes('tv')) return 'Computers'
    return 'Other'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#142D27]/50 p-4">
      <div className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#142D27]">
              Detect equipment from a photo
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Upload a photo and review the computer-vision results.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close photo upload"
            className="rounded-lg p-2 text-[#64748B] hover:bg-[#F7F8F4]"
          >
            <X size={20} />
          </button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={chooseFile}
          className="hidden"
        />

        {!preview ? (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="mt-6 flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#B7C9BD] bg-[#F7F8F4] p-6 text-center hover:border-[#2E8B68]"
          >
            <div className="rounded-xl bg-[#B9F3D2] p-3 text-[#142D27]">
              <ImagePlus size={27} />
            </div>
            <span className="mt-4 font-semibold text-[#142D27]">
              Choose an equipment photo
            </span>
            <span className="mt-1 text-xs text-[#64748B]">
              JPEG, PNG or WebP · up to 5 MB
            </span>
            <span className="mt-4 rounded-lg bg-[#2E8B68] px-4 py-2 text-sm font-medium text-white">
              Browse files
            </span>
          </button>
        ) : (
          <div className="mt-6">
            <div className="overflow-hidden rounded-2xl border border-[#E2E8E0] bg-[#F7F8F4]">
              <img
                src={preview}
                alt={`Selected equipment: ${file?.name || 'image preview'}`}
                className="max-h-72 w-full object-contain"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-xs truncate text-sm text-[#64748B]">{file?.name}</p>
              <button
                type="button"
                onClick={removeImage}
                className="text-sm font-medium text-[#2E8B68] hover:underline"
              >
                Remove image
              </button>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="rounded-xl border border-[#DDE5DD] px-4 py-2.5 text-sm font-medium text-[#142D27] hover:bg-[#F7F8F4]"
              >
                Replace photo
              </button>
              <button
                type="button"
                onClick={runDetection}
                disabled={loading || !file}
                className="rounded-xl bg-[#2E8B68] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#246F53] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Detecting...' : 'Detect equipment'}
              </button>
            </div>

            {loading && (
              <p role="status" className="mt-4 text-sm text-[#64748B]">
                Sending image to the computer-vision service…
              </p>
            )}

            {detections.length > 0 && (
              <div className="mt-5 space-y-3">
                <h3 className="font-semibold text-[#142D27]">
                  Detected equipment — review before saving
                </h3>
                {detections.map((item, index) => {
                  const confidence = Number(item.confidence)
                  const power = getDetectionPower(item)
                  const name = getDetectionName(item)

                  return (
                    <div
                      key={`${name}-${index}`}
                      className="rounded-xl border border-[#DDE5DD] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#142D27]">{name}</p>
                          <p className="mt-1 text-sm text-[#64748B]">
                            {Number.isFinite(confidence)
                              ? `Confidence: ${(confidence <= 1 ? confidence * 100 : confidence).toFixed(1)}%`
                              : 'Confidence not provided'}
                          </p>
                          <p className="mt-1 text-sm text-[#64748B]">
                            Suggested power: {power} W
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onAddDetection({
                              name,
                              category: getCategory(item),
                              power: String(power),
                              hours: '4',
                              units: '1',
                              days: '5',
                              data_source: 'image_detection',
                            })
                          }
                          className="rounded-xl bg-[#2E8B68] px-3 py-2 text-sm font-semibold text-white hover:bg-[#246F53]"
                        >
                          Review and add
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <p className="mt-5 text-xs leading-5 text-[#64748B]">
          A photo can identify visible objects but cannot measure their actual electricity
          consumption. Confirm the suggested power and usage assumptions before saving.
        </p>
      </div>
    </div>
  )
}

export default function Equipment() {
  const [equipment, setEquipment] = useState([])
  const [loadingEquipment, setLoadingEquipment] = useState(true)
  const [apiError, setApiError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [pendingSource, setPendingSource] = useState('manual')
  const [detectedFormValues, setDetectedFormValues] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadEquipment() {
      setLoadingEquipment(true)
      try {
        const records = await getEquipment()
        if (cancelled) return

        const list = Array.isArray(records) ? records : []
        setEquipment(
          list.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category || 'Other',
            power: Number(item.power_watts ?? 0),
            hours: Number(item.hours_per_day ?? 0),
            units: Number(item.units ?? 1),
            days: Number(item.operating_days_per_week ?? 5),
            status: 'Confirmed',
            data_source: item.data_source || 'manual',
          }))
        )
        setApiError('')
      } catch (err) {
        if (!cancelled) {
          setApiError(
            `Could not load equipment from the backend: ${err?.message || 'Unknown error'}. Check that the backend is running on port 8000.`
          )
        }
      } finally {
        if (!cancelled) setLoadingEquipment(false)
      }
    }

    loadEquipment()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = `${item.name} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesCategory =
      categoryFilter === 'All categories' ||
      item.category === categoryFilter

    const matchesStatus =
      statusFilter === 'All statuses' || item.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalWeeklyEnergy = equipment.reduce(
    (sum, item) => sum + estimateWeeklyEnergy(item),
    0,
  )



  async function saveEquipment(values) {
    setApiError('')
    setNotice('')

    try {
      const payload = {
        name: values.name.trim(),
        category: values.category,
        power_watts: Number(values.power),
        hours_per_day: Number(values.hours),
        units: Number(values.units),
        operating_days_per_week: Number(values.days),
        data_source:
          values.data_source ||
          editingItem?.data_source ||
          pendingSource ||
          'manual',
      }

      // Update an existing appliance, or create a new one
      const saved = editingItem
        ? await updateEquipment(editingItem.id, payload)
        : await createEquipment(payload)

      const newItem = {
        id: saved.id,
        name: saved.name,
        category: saved.category || payload.category,
        power: Number(saved.power_watts),
        hours: Number(saved.hours_per_day),
        units: Number(saved.units),
        days: Number(saved.operating_days_per_week),
        status: 'Confirmed',
        data_source: saved.data_source || payload.data_source,
      }

      // Replace the edited item, or add the new item
      setEquipment((current) =>
        editingItem
          ? current.map((item) =>
            item.id === saved.id ? newItem : item
          )
          : [...current, newItem]
      )

      setNotice(
        editingItem
          ? `"${saved.name}" updated successfully.`
          : `"${saved.name}" saved successfully.`
      )

      setFormOpen(false)
      setEditingItem(null)
      setPendingSource('manual')
      setDetectedFormValues(null)
    } catch (err) {
      console.error('Save equipment failed:', err)

      setApiError(
        err?.message ||
        'Could not save equipment. Check the backend terminal for details.'
      )
    }
  }



  function editEquipment(item) {
    setEditingItem({
      ...item,
      power: String(item.power),
      hours: String(item.hours),
      units: String(item.units),
      days: String(item.days),
    })
    setFormOpen(true)
  }

  async function handleDeleteEquipment(item) {
    if (!window.confirm(`Permanently delete "${item.name}"?`)) return

    setApiError('')
    setNotice('')

    try {
      await deleteEquipment(item.id)

      setEquipment((current) =>
        current.filter((entry) => entry.id !== item.id)
      )

      setNotice(`"${item.name}" deleted successfully.`)
    } catch (err) {
      setApiError(err?.message || 'Could not delete equipment.')
    }
  }

  function confirmEquipment(id) {
    setEquipment((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: 'Confirmed' } : item,
      ),
    )
    setNotice('Equipment marked as confirmed.')
  }

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#2E8B68]">
            Equipment management
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#142D27] sm:text-3xl">
            Equipment inventory
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            Review equipment and configure the assumptions used by energy
            estimates and simulations.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => setPhotoOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DDE5DD] bg-white px-4 py-3 text-sm font-semibold text-[#142D27] hover:bg-[#B9F3D2]/30"
          >
            <Upload size={18} />
            Upload photo
          </button>

          <button
            onClick={() => {
              setEditingItem(null)
              setPendingSource('manual')
              setDetectedFormValues(null)
              setFormOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E8B68] px-4 py-3 text-sm font-semibold text-white hover:bg-[#246F53]"
          >
            <Plus size={18} />
            Add equipment
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#B9F3D2] bg-[#B9F3D2]/30 px-4 py-3 text-sm text-[#142D27]"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={17} />
            {notice}
          </span>
          <button
            onClick={() => setNotice('')}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {apiError && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {apiError}
        </div>
      )}

      {loadingEquipment && (
        <p role="status" className="mb-4 text-sm text-[#64748B]">
          Loading equipment from the backend…
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8E0] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#64748B]">Total equipment</span>
            <Boxes size={20} className="text-[#2E8B68]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#142D27]">
            {equipment.length}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            Saved equipment records
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8E0] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#64748B]">Confirmed</span>
            <CheckCircle2 size={20} className="text-[#2E8B68]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#142D27]">
            {equipment.filter((item) => item.status === 'Confirmed').length}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            Saved equipment marked as confirmed
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8E0] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#64748B]">
              Estimated weekly energy
            </span>
            <Zap size={20} className="text-[#2E8B68]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#142D27]">
            {totalWeeklyEnergy.toFixed(1)}
            <span className="ml-2 text-sm font-medium text-[#64748B]">
              kWh
            </span>
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            Calculated from configured assumptions
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#E2E8E0] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#E2E8E0] p-5 sm:p-6">
          <div>
            <h3 className="font-semibold text-[#142D27]">
              Equipment profiles
            </h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Search, filter, review or edit your equipment.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search equipment..."
                aria-label="Search equipment"
                className="w-full rounded-xl border border-[#DDE5DD] py-2.5 pl-10 pr-3 text-sm text-[#142D27] outline-none focus:border-[#2E8B68] focus:ring-2 focus:ring-[#2E8B68]/15"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
              className="rounded-xl border border-[#DDE5DD] bg-white px-3 py-2.5 text-sm text-[#142D27] outline-none focus:border-[#2E8B68]"
            >
              <option>All categories</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by review status"
              className="rounded-xl border border-[#DDE5DD] bg-white px-3 py-2.5 text-sm text-[#142D27] outline-none focus:border-[#2E8B68]"
            >
              <option>All statuses</option>
              <option>Confirmed</option>
              <option>Needs review</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#F7F8F4]">
              <tr className="text-xs uppercase tracking-wide text-[#64748B]">
                <th className="px-5 py-4 font-semibold">Equipment</th>
                <th className="px-4 py-4 font-semibold">Rated power</th>
                <th className="px-4 py-4 font-semibold">Hours/day</th>
                <th className="px-4 py-4 font-semibold">Units</th>
                <th className="px-4 py-4 font-semibold">Est. energy/week</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E2E8E0]">
              {filteredEquipment.map((item) => (
                <tr key={item.id} className="hover:bg-[#F7F8F4]/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B9F3D2]/50 text-[#142D27]">
                        <EquipmentIcon category={item.category} />
                      </div>
                      <div>
                        <p className="font-medium text-[#142D27]">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          {item.category} · {item.days} days/week
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-[#142D27]">
                    {Number(item.power).toLocaleString()} W
                  </td>
                  <td className="px-4 py-4 text-sm text-[#142D27]">
                    {item.hours} h
                  </td>
                  <td className="px-4 py-4 text-sm text-[#142D27]">
                    {item.units}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-[#142D27]">
                    {estimateWeeklyEnergy(item).toFixed(2)} kWh
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      {item.status === 'Needs review' && (
                        <button
                          onClick={() => confirmEquipment(item.id)}
                          title="Confirm equipment"
                          aria-label={`Confirm ${item.name}`}
                          className="rounded-lg p-2 text-[#2E8B68] hover:bg-[#B9F3D2]/40"
                        >
                          <CheckCircle2 size={17} />
                        </button>
                      )}

                      <button
                        onClick={() => editEquipment(item)}
                        title="Edit equipment"
                        aria-label={`Edit ${item.name}`}
                        className="rounded-lg p-2 text-[#64748B] hover:bg-[#F7F8F4] hover:text-[#142D27]"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        onClick={() => handleDeleteEquipment(item)}
                        title="Remove equipment"
                        aria-label={`Remove ${item.name}`}
                        className="rounded-lg p-2 text-[#64748B] hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEquipment.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Boxes
                      size={28}
                      className="mx-auto text-[#64748B]"
                    />
                    <p className="mt-3 font-medium text-[#142D27]">
                      No equipment found
                    </p>
                    <p className="mt-1 text-sm text-[#64748B]">
                      Try changing the search or filters, or add equipment.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#E2E8E0] bg-[#F7F8F4]/70 px-5 py-4">
          <p className="text-xs leading-5 text-[#64748B]">
            Demo data only. Energy is estimated using rated power × operating
            hours × units × operating days. Actual consumption may differ.
          </p>
        </div>
      </section>

      {formOpen && (
        <EquipmentForm
          initialValues={editingItem || detectedFormValues}
          onSave={saveEquipment}
          onCancel={() => {
            setFormOpen(false)
            setEditingItem(null)
          }}
        />
      )}

      {photoOpen && (
        <PhotoDetection
          onClose={() => setPhotoOpen(false)}
          onAddDetection={(detected) => {
            setEditingItem(null)
            setPendingSource('image_detection')
            setPhotoOpen(false)
            setFormOpen(true)
            setDetectedFormValues({
              ...detected,
              data_source: 'image_detection',
            })
          }}
        />
      )}
    </div>
  )
}