"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bus,
  Building2,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  GitBranch,
  Lock,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Search,
  TicketIcon,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Field, Input, Select } from "@/components/ui/Field";
import { SeatLayoutBuilder } from "./SeatLayoutBuilder";
import { cn, formatDate, formatFCFA, isTripExpired } from "@/lib/utils";
import type { Store } from "@/lib/store";
import type { Agency, BusTemplate, City, DropOff, Route, Schedule, SeatLayout, SeatClass, Trip } from "@/lib/types";

type Persist = (next: Store) => void;

/* ---------- Overview ---------- */

function fmtFcfaCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export function Overview({ store }: { store: Store }) {
  // Revenue = sum of valid bookings (cancelled/used excluded from "live" revenue;
  // we show used as "completed" elsewhere)
  const validBookings = store.bookings.filter((b) => b.status !== "cancelled");
  const totalRevenue = validBookings.reduce((acc, b) => acc + b.amount, 0);

  // Last 7 days bookings, for sparkline
  const today = new Date();
  const sparkData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const dayBookings = store.bookings.filter(
      (b) => (b.createdAt ?? "").slice(0, 10) === iso && b.status !== "cancelled"
    );
    return {
      iso,
      count: dayBookings.length,
      revenue: dayBookings.reduce((a, b) => a + b.amount, 0),
    };
  });
  const peak = Math.max(1, ...sparkData.map((d) => d.revenue));

  const stats = [
    {
      label: "Cities",
      value: store.cities.filter((c) => c.active).length,
      icon: MapPin,
    },
    { label: "Agencies", value: store.agencies.length, icon: Building2 },
    { label: "Routes", value: store.routes.length, icon: GitBranch },
    { label: "Trips", value: store.trips.length, icon: TicketIcon },
    { label: "Templates", value: store.busTemplates.length, icon: Bus },
    { label: "Schedules", value: store.schedules.length, icon: CalendarRange },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-ink-400 font-semibold">
          Dashboard
        </p>
        <h2 className="text-2xl font-bold text-ink-900 mt-1">
          Welcome back, Operator
        </h2>
        <p className="text-ink-500 text-sm mt-1">
          Network-wide performance and quick stats.
        </p>
      </header>

      {/* Hero: revenue + bookings cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {/* Revenue card */}
        <div className="card p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-white" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-400 font-semibold">
                Total revenue
              </p>
              <p className="mt-2 text-3xl font-bold text-ink-900 tracking-tight font-mono">
                {fmtFcfaCompact(totalRevenue)}
              </p>
              <p className="text-[11px] text-ink-500 mt-0.5">
                {formatFCFA(totalRevenue)} · {validBookings.length} bookings
              </p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shadow-glow">
              <TicketIcon className="h-4 w-4" />
            </div>
          </div>

          {/* Sparkline */}
          <div className="mt-5">
            <div className="flex items-end gap-1 h-12">
              {sparkData.map((d, i) => {
                const h = Math.max(4, (d.revenue / peak) * 48);
                const isToday = i === sparkData.length - 1;
                return (
                  <div
                    key={d.iso}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`${d.iso}: ${d.count} bookings · ${formatFCFA(d.revenue)}`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-md transition-colors",
                        isToday ? "bg-brand-600" : "bg-brand-200"
                      )}
                      style={{ height: `${h}px` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-ink-400 font-medium">
              <span>7d ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Bookings card */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-400 font-semibold">
                Bookings
              </p>
              <p className="mt-2 text-3xl font-bold text-ink-900 tracking-tight">
                {validBookings.length}
              </p>
              <p className="text-[11px] text-ink-500 mt-0.5">
                {sparkData[sparkData.length - 1].count} today ·{" "}
                {sparkData.reduce((a, d) => a + d.count, 0)} this week
              </p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
          </div>

          {/* Recent bookings preview */}
          <div className="mt-5 space-y-1.5">
            {store.bookings.slice(-4).reverse().map((b) => (
              <div
                key={b.consignment}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-mono text-ink-700 truncate">
                  {b.consignment}
                </span>
                <span className="font-semibold text-ink-900 font-mono">
                  {formatFCFA(b.amount)}
                </span>
              </div>
            ))}
            {store.bookings.length === 0 && (
              <p className="text-xs text-ink-400 italic">
                No bookings yet — once a passenger pays, they'll show here.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Network stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-4 flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-ink-500">{s.label}</p>
                <p className="text-xl font-bold text-ink-900 leading-tight">
                  {s.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Cities ---------- */

export function CitiesSection({
  store,
  persist,
}: {
  store: Store;
  persist: Persist;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<City | null>(null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      store.cities.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase())
      ),
    [store.cities, query]
  );

  const inUse = (cityId: string) =>
    store.routes.some((r) => r.fromCityId === cityId || r.toCityId === cityId);

  const save = (data: Partial<City>) => {
    if (data.code) {
      const code = data.code.toUpperCase();
      const dup = store.cities.find(
        (c) => c.code === code && c.id !== editing?.id
      );
      if (dup) {
        toast.error(`City code ${code} already exists`);
        return;
      }
    }

    if (editing) {
      persist({
        ...store,
        cities: store.cities.map((c) =>
          c.id === editing.id
            ? {
                ...c,
                ...data,
                code: data.code?.toUpperCase() ?? c.code,
                dropOffs: data.dropOffs ?? c.dropOffs ?? [],
              }
            : c
        ),
      });
      toast.success("City updated");
    } else {
      const id = `c-${Date.now()}`;
      persist({
        ...store,
        cities: [
          ...store.cities,
          {
            id,
            name: data.name!,
            code: data.code!.toUpperCase(),
            active: true,
            dropOffs: data.dropOffs ?? [],
          },
        ],
      });
      toast.success("City added");
    }
    setEditing(null);
    setAdding(false);
  };

  const toggle = (c: City) => {
    persist({
      ...store,
      cities: store.cities.map((x) =>
        x.id === c.id ? { ...x, active: !x.active } : x
      ),
    });
  };

  const removeCity = (c: City) => {
    if (inUse(c.id)) {
      toast.error("City is in use by a route. Deactivate it instead.");
      return;
    }
    persist({
      ...store,
      cities: store.cities.filter((x) => x.id !== c.id),
    });
    toast.info("City removed");
  };

  return (
    <SectionWrap
      title="Cities"
      subtitle="Cities served across the network."
      action={
        <button
          onClick={() => {
            setEditing(null);
            setAdding(true);
          }}
          className="btn-primary text-sm h-9 px-3"
        >
          <Plus className="h-4 w-4" /> Add city
        </button>
      }
    >
      <div className="card overflow-hidden">
        <div className="p-3 border-b border-ink-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cities…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-ink-200 text-sm outline-none focus:border-brand-400"
            />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-ink-50/60 text-ink-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">City</th>
              <th className="text-left px-4 py-2.5 font-medium">Code</th>
              <th className="text-left px-4 py-2.5 font-medium">Drop-offs</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-right px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-ink-100 hover:bg-ink-50/40">
                <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-600">{c.code}</td>
                <td className="px-4 py-3 text-xs text-ink-600">
                  {c.dropOffs && c.dropOffs.length > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="font-semibold text-ink-700">
                        {c.dropOffs.length}
                      </span>
                      <span className="text-ink-400">·</span>
                      <span className="truncate max-w-[180px]">
                        {c.dropOffs.map((d) => d.name).join(", ")}
                      </span>
                    </span>
                  ) : (
                    <span className="text-ink-400 italic">City center</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggle(c)}
                    className={cn(
                      "badge border",
                      c.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-ink-200 bg-ink-50 text-ink-500"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        c.active ? "bg-emerald-500" : "bg-ink-400"
                      )}
                    />
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => {
                        setAdding(false);
                        setEditing(c);
                      }}
                      className="p-1.5 text-ink-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeCity(c)}
                      className={cn(
                        "p-1.5 rounded-lg",
                        inUse(c.id)
                          ? "text-ink-300 cursor-not-allowed"
                          : "text-ink-500 hover:text-rose-600 hover:bg-rose-50"
                      )}
                      disabled={inUse(c.id)}
                      title={inUse(c.id) ? "City is in use" : "Delete"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={adding || !!editing}
        title={editing ? "Edit city" : "Add city"}
        onClose={() => {
          setEditing(null);
          setAdding(false);
        }}
      >
        <CityForm
          initial={editing ?? undefined}
          onSubmit={save}
          onCancel={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
      </Drawer>
    </SectionWrap>
  );
}

function CityForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: City;
  onSubmit: (d: Partial<City>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [dropOffs, setDropOffs] = useState<DropOff[]>(initial?.dropOffs ?? []);
  const [newDropOff, setNewDropOff] = useState("");
  const [err, setErr] = useState<{ name?: string; code?: string }>({});

  const addDropOff = () => {
    const trimmed = newDropOff.trim();
    if (trimmed.length < 2) return;
    if (dropOffs.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) return;
    setDropOffs([
      ...dropOffs,
      { id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: trimmed },
    ]);
    setNewDropOff("");
  };

  const removeDropOff = (id: string) => {
    setDropOffs(dropOffs.filter((d) => d.id !== id));
  };

  const submit = () => {
    const e: typeof err = {};
    if (name.trim().length < 2) e.name = "Too short";
    if (!/^[A-Za-z]{3}$/.test(code)) e.code = "Use 3 letters";
    setErr(e);
    if (Object.keys(e).length) return;
    onSubmit({ name: name.trim(), code, dropOffs });
  };

  return (
    <div className="space-y-4">
      <Field label="Name" error={err.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} invalid={!!err.name} placeholder="Limbe" />
      </Field>
      <Field label="3-letter code" error={err.code}>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={3}
          invalid={!!err.code}
          placeholder="LBE"
          className="font-mono uppercase"
        />
      </Field>

      <div>
        <label className="text-xs font-semibold text-ink-700">Drop-off locations</label>
        <p className="text-[11px] text-ink-500 mt-0.5">
          Optional. If none, the city center is used as the default drop-off.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {dropOffs.length === 0 && (
            <span className="text-[11px] text-ink-400 italic">No drop-offs yet</span>
          )}
          {dropOffs.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 pl-2.5 pr-1 py-1 text-xs text-ink-700"
            >
              <MapPin className="h-3 w-3 text-brand-500" />
              {d.name}
              <button
                type="button"
                onClick={() => removeDropOff(d.id)}
                className="ml-0.5 p-0.5 rounded-full text-ink-400 hover:text-rose-600 hover:bg-rose-50"
                aria-label={`Remove ${d.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            value={newDropOff}
            onChange={(e) => setNewDropOff(e.target.value)}
            placeholder="e.g. Bambui, Mile 4"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDropOff();
              }
            }}
          />
          <button
            type="button"
            onClick={addDropOff}
            className="btn-secondary text-xs h-9 px-3 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary text-sm">
          Cancel
        </button>
        <button onClick={submit} className="btn-primary text-sm">
          {initial ? "Save" : "Add city"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Agencies ---------- */

const AGENCY_GRADIENTS: { label: string; value: string }[] = [
  { label: "Indigo → Violet", value: "from-indigo-500 to-violet-500" },
  { label: "Amber → Orange", value: "from-amber-500 to-orange-500" },
  { label: "Rose → Pink", value: "from-rose-500 to-pink-500" },
  { label: "Emerald → Teal", value: "from-emerald-500 to-teal-500" },
  { label: "Sky → Blue", value: "from-sky-500 to-blue-500" },
  { label: "Fuchsia → Purple", value: "from-fuchsia-500 to-purple-500" },
  { label: "Lime → Green", value: "from-lime-500 to-green-500" },
  { label: "Slate → Ink", value: "from-slate-600 to-ink-700" },
];

export function AgenciesSection({
  store,
  persist,
}: {
  store: Store;
  persist: Persist;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<Agency | null>(null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      store.agencies.filter((a) =>
        a.name.toLowerCase().includes(query.toLowerCase())
      ),
    [store.agencies, query]
  );

  const tripCountFor = (agencyId: string) =>
    store.trips.filter((t) => t.agencyId === agencyId).length;

  const uploadImageIfDataUrl = async (
    agencyId: string,
    image?: string
  ): Promise<string | undefined> => {
    if (!image) return undefined;
    if (!image.startsWith("data:")) return image; // already a remote URL
    try {
      const res = await fetch("/api/agencies/upload-image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agencyId, dataUrl: image }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Upload failed");
      return j.publicUrl as string;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image upload failed");
      return undefined;
    }
  };

  const save = async (data: Partial<Agency>) => {
    const name = data.name?.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    const dup = store.agencies.find(
      (a) =>
        a.name.toLowerCase() === name.toLowerCase() && a.id !== editing?.id
    );
    if (dup) {
      toast.error(`An agency named "${name}" already exists`);
      return;
    }

    if (editing) {
      const imageUrl = await uploadImageIfDataUrl(editing.id, data.imageUrl);
      persist({
        ...store,
        agencies: store.agencies.map((a) =>
          a.id === editing.id
            ? {
                ...a,
                name,
                logoColor: data.logoColor ?? a.logoColor,
                imageUrl: imageUrl ?? a.imageUrl,
              }
            : a
        ),
      });
      toast.success("Agency updated");
    } else {
      const id = `a-${Date.now()}`;
      const imageUrl = await uploadImageIfDataUrl(id, data.imageUrl);
      persist({
        ...store,
        agencies: [
          ...store.agencies,
          {
            id,
            name,
            logoColor: data.logoColor ?? AGENCY_GRADIENTS[0].value,
            imageUrl,
          },
        ],
      });
      toast.success("Agency added");
    }
    setEditing(null);
    setAdding(false);
  };

  const removeAgency = (a: Agency) => {
    if (tripCountFor(a.id) > 0) {
      toast.error("Agency is used by trips. Reassign or delete trips first.");
      return;
    }
    persist({ ...store, agencies: store.agencies.filter((x) => x.id !== a.id) });
    toast.info("Agency removed");
  };

  return (
    <SectionWrap
      title="Agencies"
      subtitle="Travel agencies that operate trips on the network."
      action={
        <button
          onClick={() => {
            setEditing(null);
            setAdding(true);
          }}
          className="btn-primary text-sm h-9 px-3"
        >
          <Plus className="h-4 w-4" /> Add agency
        </button>
      }
    >
      <div className="card overflow-hidden">
        <div className="p-3 border-b border-ink-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agencies…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-ink-200 text-sm outline-none focus:border-brand-400"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-ink-600 font-medium">No agencies found</p>
            <p className="text-ink-400 text-sm">
              Add an agency to assign it to trips.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink-50/60 text-ink-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Agency</th>
                <th className="text-left px-4 py-2.5 font-medium">Brand</th>
                <th className="text-right px-4 py-2.5 font-medium">Trips</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const trips = tripCountFor(a.id);
                return (
                  <tr
                    key={a.id}
                    className="border-t border-ink-100 hover:bg-ink-50/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-xl overflow-hidden text-white text-xs font-bold flex items-center justify-center shadow-soft",
                            !a.imageUrl && "bg-gradient-to-br",
                            !a.imageUrl && a.logoColor
                          )}
                        >
                          {a.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.imageUrl}
                              alt={a.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            a.name
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()
                          )}
                        </div>
                        <span className="font-medium text-ink-900">
                          {a.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500 font-mono truncate max-w-[220px]">
                      {a.logoColor}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {trips > 0 ? (
                        <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                          {trips}
                        </span>
                      ) : (
                        <span className="text-ink-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setAdding(false);
                            setEditing(a);
                          }}
                          className="p-1.5 text-ink-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                          aria-label="Edit agency"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeAgency(a)}
                          disabled={trips > 0}
                          className={cn(
                            "p-1.5 rounded-lg",
                            trips > 0
                              ? "text-ink-300 cursor-not-allowed"
                              : "text-ink-500 hover:text-rose-600 hover:bg-rose-50"
                          )}
                          title={
                            trips > 0
                              ? "Agency has trips"
                              : "Delete"
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        open={adding || !!editing}
        title={editing ? "Edit agency" : "Add agency"}
        onClose={() => {
          setEditing(null);
          setAdding(false);
        }}
      >
        <AgencyForm
          initial={editing ?? undefined}
          onSubmit={save}
          onCancel={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
      </Drawer>
    </SectionWrap>
  );
}

function AgencyForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Agency;
  onSubmit: (d: Partial<Agency>) => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [logoColor, setLogoColor] = useState(
    initial?.logoColor ?? AGENCY_GRADIENTS[0].value
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [err, setErr] = useState<{ name?: string }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onPickFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Image must be under 1.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") setImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const e: typeof err = {};
    if (name.trim().length < 2) e.name = "Too short";
    setErr(e);
    if (Object.keys(e).length) return;
    onSubmit({ name: name.trim(), logoColor, imageUrl });
  };

  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AG";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl overflow-hidden text-white text-base font-bold flex items-center justify-center shadow-glow",
            !imageUrl && "bg-gradient-to-br",
            !imageUrl && logoColor
          )}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-500">Live preview</p>
          <p className="font-semibold text-ink-900 truncate">
            {name.trim() || "Agency name"}
          </p>
        </div>
      </div>

      {/* Image upload / clear */}
      <div>
        <label className="text-xs font-semibold text-ink-700">
          Profile picture
        </label>
        <p className="text-[11px] text-ink-500 mt-0.5">
          Optional. PNG/JPG, square works best, under 1.5 MB.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs h-9 px-3"
          >
            <Upload className="h-3.5 w-3.5" />
            {imageUrl ? "Replace image" : "Upload image"}
          </button>
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl(undefined)}
              className="btn-ghost text-xs h-9 px-3 text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      <Field label="Name" error={err.name}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          invalid={!!err.name}
          placeholder="Finexs Voyages"
        />
      </Field>

      <div>
        <label className="text-xs font-semibold text-ink-700">Brand color</label>
        <p className="text-[11px] text-ink-500 mt-0.5">
          Used for the agency logo badge throughout the app.
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {AGENCY_GRADIENTS.map((g) => {
            const active = logoColor === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => setLogoColor(g.value)}
                className={cn(
                  "relative aspect-[3/2] rounded-xl bg-gradient-to-br shadow-soft transition",
                  g.value,
                  active
                    ? "ring-2 ring-offset-2 ring-brand-500"
                    : "hover:scale-[1.02]"
                )}
                title={g.label}
                aria-label={g.label}
              >
                {active && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-white text-brand-600 flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary text-sm">
          Cancel
        </button>
        <button onClick={submit} className="btn-primary text-sm">
          {initial ? "Save" : "Add agency"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Bus Templates ---------- */

export function TemplatesSection({
  store,
  persist,
}: {
  store: Store;
  persist: Persist;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<BusTemplate | null>(null);
  const [adding, setAdding] = useState(false);

  const inUse = (tplId: string) => store.trips.some((t) => t.busTemplateId === tplId);

  const save = (tpl: Partial<BusTemplate>, layout: SeatLayout) => {
    if (editing) {
      // Lock check
      if (editing.locked) {
        toast.error("Layout is locked. Clone instead.");
        return;
      }
      persist({
        ...store,
        busTemplates: store.busTemplates.map((x) =>
          x.id === editing.id ? { ...x, ...tpl, layout } : x
        ),
      });
      toast.success("Template updated");
    } else {
      const id = `bt-${Date.now()}`;
      persist({
        ...store,
        busTemplates: [
          ...store.busTemplates,
          { id, name: tpl.name!, type: (tpl.type ?? "Regular") as SeatClass, layout },
        ],
      });
      toast.success("Template created");
    }
    setEditing(null);
    setAdding(false);
  };

  const remove = (tpl: BusTemplate) => {
    if (inUse(tpl.id)) {
      toast.error("Template is in use by trips. Cannot delete.");
      return;
    }
    persist({
      ...store,
      busTemplates: store.busTemplates.filter((x) => x.id !== tpl.id),
    });
    toast.info("Template removed");
  };

  return (
    <SectionWrap
      title="Bus Templates"
      subtitle="Visual layouts reusable across many trips."
      action={
        <button
          onClick={() => {
            setEditing(null);
            setAdding(true);
          }}
          className="btn-primary text-sm h-9 px-3"
        >
          <Plus className="h-4 w-4" /> New template
        </button>
      }
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {store.busTemplates.map((tpl) => {
          const seatCount = tpl.layout.flat().filter((c) => c && c !== "driver").length;
          const used = inUse(tpl.id);
          return (
            <motion.div
              key={tpl.id}
              layout
              className="card p-5 flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-ink-900">{tpl.name}</h3>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {tpl.type} · {seatCount} seats
                  </p>
                </div>
                {tpl.locked || used ? (
                  <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                    <Lock className="h-3 w-3" /> {tpl.locked ? "Locked" : "In use"}
                  </span>
                ) : (
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Editable
                  </span>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-ink-100 bg-ink-50/40 p-3 grow">
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(...tpl.layout.map((r) => r.length))}, minmax(0, 1fr))`,
                  }}
                >
                  {tpl.layout.flatMap((row, ri) => {
                    const cols = Math.max(...tpl.layout.map((r) => r.length));
                    return Array.from({ length: cols }).map((_, ci) => {
                      const cell = row[ci] ?? null;
                      return (
                        <div
                          key={`${ri}-${ci}`}
                          className={cn(
                            "aspect-square rounded-[4px]",
                            cell === "driver" && "bg-amber-300",
                            cell && cell !== "driver" && "bg-brand-300",
                            !cell && "bg-transparent"
                          )}
                        />
                      );
                    });
                  })}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setAdding(false);
                    setEditing(tpl);
                  }}
                  className="btn-secondary text-xs h-9 px-3 flex-1"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => remove(tpl)}
                  disabled={used}
                  className={cn(
                    "btn-ghost text-xs h-9 px-3",
                    used && "text-ink-300"
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Drawer
        wide
        open={adding || !!editing}
        title={editing ? "Edit template" : "New bus template"}
        onClose={() => {
          setEditing(null);
          setAdding(false);
        }}
      >
        <TemplateForm
          initial={editing ?? undefined}
          onSubmit={save}
          onCancel={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
      </Drawer>
    </SectionWrap>
  );
}

function TemplateForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: BusTemplate;
  onSubmit: (tpl: Partial<BusTemplate>, layout: SeatLayout) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<SeatClass>(initial?.type ?? "Regular");
  const [layout, setLayout] = useState<SeatLayout>(initial?.layout ?? []);
  const [err, setErr] = useState<{ name?: string }>({});

  const submit = () => {
    if (name.trim().length < 2) {
      setErr({ name: "Name too short" });
      return;
    }
    onSubmit({ name: name.trim(), type }, layout);
  };

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Template name" error={err.name}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={!!err.name}
            placeholder="VIP Coach 30"
          />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as SeatClass)}>
            <option value="Regular">Regular</option>
            <option value="VIP">VIP</option>
          </Select>
        </Field>
      </div>

      <SeatLayoutBuilder
        initial={initial?.layout}
        locked={initial?.locked}
        onChange={(l) => setLayout(l)}
      />

      <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
        <button onClick={onCancel} className="btn-secondary text-sm">
          Cancel
        </button>
        <button onClick={submit} className="btn-primary text-sm">
          {initial ? "Save changes" : "Create template"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Routes ---------- */

export function RoutesSection({ store, persist }: { store: Store; persist: Persist }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const activeCities = store.cities.filter((c) => c.active);

  const inUse = (rid: string) => store.trips.some((t) => t.routeId === rid);

  const create = () => {
    if (!from || !to) return toast.error("Pick both cities");
    if (from === to) return toast.error("Cities must differ");
    const dup = store.routes.find((r) => r.fromCityId === from && r.toCityId === to);
    if (dup) return toast.error("Route already exists");
    persist({
      ...store,
      routes: [
        ...store.routes,
        { id: `r-${Date.now()}`, fromCityId: from, toCityId: to },
      ],
    });
    toast.success("Route created");
    setAdding(false);
    setFrom("");
    setTo("");
  };

  const remove = (r: Route) => {
    if (inUse(r.id)) return toast.error("Route is in use by trips.");
    persist({ ...store, routes: store.routes.filter((x) => x.id !== r.id) });
    toast.info("Route removed");
  };

  return (
    <SectionWrap
      title="Routes"
      subtitle="Connections between active cities."
      action={
        <button onClick={() => setAdding(true)} className="btn-primary text-sm h-9 px-3">
          <Plus className="h-4 w-4" /> Add route
        </button>
      }
    >
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/60 text-ink-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">From</th>
              <th className="px-2 py-2.5 font-medium" />
              <th className="text-left px-4 py-2.5 font-medium">To</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-right px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {store.routes.map((r) => {
              const a = store.cities.find((c) => c.id === r.fromCityId);
              const b = store.cities.find((c) => c.id === r.toCityId);
              const used = inUse(r.id);
              return (
                <tr key={r.id} className="border-t border-ink-100 hover:bg-ink-50/40">
                  <td className="px-4 py-3 font-medium text-ink-900">{a?.name}</td>
                  <td className="px-2 text-ink-300"><ChevronRight className="h-4 w-4" /></td>
                  <td className="px-4 py-3 font-medium text-ink-900">{b?.name}</td>
                  <td className="px-4 py-3">
                    <span className={cn("badge border", used ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-ink-50 text-ink-600 border-ink-200")}>
                      {used ? "In use" : "Idle"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(r)}
                      disabled={used}
                      className={cn(
                        "p-1.5 rounded-lg",
                        used
                          ? "text-ink-300 cursor-not-allowed"
                          : "text-ink-500 hover:text-rose-600 hover:bg-rose-50"
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer open={adding} title="Add route" onClose={() => setAdding(false)}>
        <div className="space-y-4">
          <Field label="From">
            <Select value={from} onChange={(e) => setFrom(e.target.value)}>
              <option value="">Select city…</option>
              {activeCities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="To" error={from && to && from === to ? "Must differ" : undefined}>
            <Select value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">Select city…</option>
              {activeCities.map((c) => (
                <option key={c.id} value={c.id} disabled={c.id === from}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAdding(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={create} className="btn-primary text-sm">Create route</button>
          </div>
        </div>
      </Drawer>
    </SectionWrap>
  );
}

/* ---------- Schedules ---------- */

export function SchedulesSection({ store, persist }: { store: Store; persist: Persist }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [time, setTime] = useState("");
  const [label, setLabel] = useState("");

  const inUse = (sid: string) => store.trips.some((t) => t.time === store.schedules.find((s) => s.id === sid)?.time);

  const create = () => {
    if (!/^\d{2}:\d{2}$/.test(time)) return toast.error("Use HH:mm");
    persist({
      ...store,
      schedules: [
        ...store.schedules,
        { id: `s-${Date.now()}`, time, label: label || undefined },
      ],
    });
    toast.success("Schedule added");
    setAdding(false);
    setTime("");
    setLabel("");
  };

  const remove = (s: Schedule) => {
    if (inUse(s.id)) return toast.error("Schedule is in use by trips.");
    persist({ ...store, schedules: store.schedules.filter((x) => x.id !== s.id) });
    toast.info("Schedule removed");
  };

  return (
    <SectionWrap
      title="Schedules"
      subtitle="Standard departure times reused across trips."
      action={
        <button onClick={() => setAdding(true)} className="btn-primary text-sm h-9 px-3">
          <Plus className="h-4 w-4" /> Add schedule
        </button>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {store.schedules.map((s) => (
          <motion.div key={s.id} layout className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-mono font-bold text-lg text-ink-900">{s.time}</p>
              {s.label && <p className="text-xs text-ink-500">{s.label}</p>}
            </div>
            <button
              onClick={() => remove(s)}
              className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </div>

      <Drawer open={adding} title="Add schedule" onClose={() => setAdding(false)}>
        <div className="space-y-4">
          <Field label="Time">
            <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="08:30" />
          </Field>
          <Field label="Label (optional)">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Morning" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAdding(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={create} className="btn-primary text-sm">Add</button>
          </div>
        </div>
      </Drawer>
    </SectionWrap>
  );
}

/* ---------- Bookings ---------- */

export function BookingsSection({ store }: { store: Store }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "valid" | "used" | "cancelled"
  >("all");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");

  // Hydrate context: trip → agency, route + cities, drop-off label
  const enriched = useMemo(() => {
    return store.bookings.map((b) => {
      const trip = store.trips.find((t) => t.id === b.tripId);
      const agency = trip
        ? store.agencies.find((a) => a.id === trip.agencyId)
        : undefined;
      const route = trip
        ? store.routes.find((r) => r.id === trip.routeId)
        : undefined;
      const fromCity = route
        ? store.cities.find((c) => c.id === route.fromCityId)
        : undefined;
      const toCity = route
        ? store.cities.find((c) => c.id === route.toCityId)
        : undefined;
      return {
        booking: b,
        trip,
        agency,
        fromCity,
        toCity,
      };
    });
  }, [store.bookings, store.trips, store.agencies, store.routes, store.cities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((row) => {
      const b = row.booking;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (
        agencyFilter !== "all" &&
        row.trip &&
        row.trip.agencyId !== agencyFilter
      )
        return false;
      if (!q) return true;
      const haystack = [
        b.consignment,
        b.passenger.fullName,
        b.passenger.phone,
        b.passenger.email ?? "",
        b.seat,
        row.fromCity?.code ?? "",
        row.toCity?.code ?? "",
        row.agency?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [enriched, query, statusFilter, agencyFilter]);

  // Stats
  const totalRevenue = filtered
    .filter((r) => r.booking.status !== "cancelled")
    .reduce((acc, r) => acc + r.booking.amount, 0);
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayCount = filtered.filter(
    (r) => (r.booking.createdAt ?? "").slice(0, 10) === todayIso
  ).length;

  return (
    <SectionWrap
      title="Bookings"
      subtitle="Every ticket sold across the network. Updates live."
    >
      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill label="Total" value={filtered.length} icon={Receipt} />
        <StatPill label="Today" value={todayCount} icon={CalendarRange} />
        <StatPill
          label="Revenue (filtered)"
          value={formatFCFA(totalRevenue)}
          icon={TicketIcon}
          mono
        />
        <StatPill
          label="Cancelled"
          value={filtered.filter((r) => r.booking.status === "cancelled").length}
          icon={X}
          tone="rose"
        />
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search consignment, name, phone, route…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-ink-200 text-sm outline-none focus:border-brand-400 focus:shadow-ring"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="sm:max-w-[180px]"
          >
            <option value="all">All statuses</option>
            <option value="valid">Valid</option>
            <option value="used">Used</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="sm:max-w-[200px]"
          >
            <option value="all">All agencies</option>
            {store.agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-ink-50 text-ink-300 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <p className="text-ink-700 font-semibold mt-3">
              {store.bookings.length === 0
                ? "No bookings yet"
                : "No bookings match your filters"}
            </p>
            <p className="text-xs text-ink-500 mt-1">
              {store.bookings.length === 0
                ? "When passengers pay, their tickets will appear here in real time."
                : "Try widening the search or clearing filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/60 text-ink-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Consignment</th>
                  <th className="text-left px-4 py-2.5 font-medium">Passenger</th>
                  <th className="text-left px-4 py-2.5 font-medium">Route</th>
                  <th className="text-left px-4 py-2.5 font-medium">Agency</th>
                  <th className="text-left px-4 py-2.5 font-medium">Trip</th>
                  <th className="text-left px-4 py-2.5 font-medium">Seat</th>
                  <th className="text-right px-4 py-2.5 font-medium">Amount</th>
                  <th className="text-left px-4 py-2.5 font-medium">Method</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Booked</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ booking: b, trip, agency, fromCity, toCity }) => (
                  <tr
                    key={b.consignment}
                    className="border-t border-ink-100 hover:bg-ink-50/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-ink-700 whitespace-nowrap">
                      <a
                        href={`/ticket/${b.consignment}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-brand-700 hover:underline"
                      >
                        {b.consignment}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="leading-tight">
                        <p className="font-medium text-ink-900 truncate max-w-[200px]">
                          {b.passenger.fullName}
                        </p>
                        <p className="text-[11px] text-ink-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-2.5 w-2.5" />
                          <span className="font-mono">{b.passenger.phone}</span>
                        </p>
                        {b.passenger.email && (
                          <p className="text-[11px] text-ink-400 truncate max-w-[200px]">
                            {b.passenger.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {fromCity && toCity ? (
                        <span className="font-medium text-ink-700">
                          {fromCity.code} → {toCity.code}
                        </span>
                      ) : (
                        <span className="text-ink-400 italic text-xs">
                          unknown
                        </span>
                      )}
                      {b.dropOff && (
                        <p className="text-[10px] text-ink-500 truncate max-w-[160px]">
                          {b.dropOff}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {agency ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-6 w-6 rounded-md overflow-hidden text-white text-[9px] font-bold flex items-center justify-center",
                              !agency.imageUrl && "bg-gradient-to-br",
                              !agency.imageUrl && agency.logoColor
                            )}
                          >
                            {agency.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={agency.imageUrl}
                                alt={agency.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              agency.name
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            )}
                          </div>
                          <span className="text-xs text-ink-700 truncate max-w-[120px]">
                            {agency.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-ink-400 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-700 whitespace-nowrap">
                      {trip ? (
                        <>
                          <span className="font-medium">{formatDate(trip.date)}</span>
                          <span className="text-ink-400"> · </span>
                          <span className="font-mono">{trip.time}</span>
                        </>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-brand-700">
                        {b.seat}
                      </span>
                      <span
                        className={cn(
                          "ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                          b.seatClass === "VIP"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-ink-100 text-ink-700"
                        )}
                      >
                        {b.seatClass}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-ink-900 whitespace-nowrap">
                      {formatFCFA(b.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                          b.paymentMethod === "MTN"
                            ? "border-amber-300 bg-amber-50 text-amber-800"
                            : "border-orange-300 bg-orange-50 text-orange-800"
                        )}
                      >
                        {b.paymentMethod === "MTN" ? "MTN MoMo" : "Orange Money"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-[11px] text-ink-500 font-mono whitespace-nowrap">
                      {fmtBookingTime(b.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SectionWrap>
  );
}

function StatPill({
  label,
  value,
  icon: Icon,
  mono,
  tone = "brand",
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  mono?: boolean;
  tone?: "brand" | "rose";
}) {
  return (
    <div className="card p-3 flex items-center gap-3">
      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center",
          tone === "brand"
            ? "bg-brand-50 text-brand-600"
            : "bg-rose-50 text-rose-600"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold truncate">
          {label}
        </p>
        <p
          className={cn(
            "text-lg font-bold text-ink-900 leading-tight truncate",
            mono && "font-mono"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "valid" | "used" | "cancelled" }) {
  const styles = {
    valid: "border-emerald-200 bg-emerald-50 text-emerald-700",
    used: "border-ink-200 bg-ink-50 text-ink-600",
    cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  } as const;
  const dots = {
    valid: "bg-emerald-500",
    used: "bg-ink-400",
    cancelled: "bg-rose-500",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[status]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {status}
    </span>
  );
}

function fmtBookingTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h ago`;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------- Trips ---------- */

export function TripsSection({ store, persist }: { store: Store; persist: Persist }) {
  const toast = useToast();
  const [mode, setMode] = useState<"closed" | "new" | "bulk" | { editId: string }>("closed");
  const [agencyId, setAgencyId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [busTemplateId, setBusTemplateId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [priceRegular, setPriceRegular] = useState("");
  const [priceVip, setPriceVip] = useState("");
  const [dropOffId, setDropOffId] = useState("");
  const [takenSeats, setTakenSeats] = useState<string[]>([]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination & expired filter
  const [currentPage, setCurrentPage] = useState(1);
  const [showExpired, setShowExpired] = useState(false);
  const pageSize = 10;

  // Bulk create state
  const [bulkAgencyId, setBulkAgencyId] = useState("");
  const [bulkRouteId, setBulkRouteId] = useState("");
  const [bulkBusTemplateId, setBulkBusTemplateId] = useState("");
  const [bulkTime, setBulkTime] = useState("");
  const [bulkPriceRegular, setBulkPriceRegular] = useState("");
  const [bulkPriceVip, setBulkPriceVip] = useState("");
  const [bulkDropOffId, setBulkDropOffId] = useState("");
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");

  const drawerOpen = mode !== "closed";
  const isEditing = typeof mode === "object";
  const editingTrip = isEditing
    ? store.trips.find((t) => t.id === mode.editId)
    : undefined;

  // Destination city for the chosen route → drives the drop-off options
  const toCity = useMemo(() => {
    const r = store.routes.find((x) => x.id === routeId);
    return r ? store.cities.find((c) => c.id === r.toCityId) : undefined;
  }, [routeId, store.routes, store.cities]);

  // Seats already locked by real bookings — operator can't unblock these
  const bookedSeats = useMemo(() => {
    if (!isEditing || !editingTrip) return new Set<string>();
    return new Set(
      store.bookings
        .filter((b) => b.tripId === editingTrip.id && b.status !== "cancelled")
        .map((b) => b.seat)
    );
  }, [isEditing, editingTrip, store.bookings]);

  const selectedTemplate = useMemo(
    () => store.busTemplates.find((t) => t.id === busTemplateId),
    [busTemplateId, store.busTemplates]
  );

  const bulkToCity = useMemo(() => {
    const r = store.routes.find((x) => x.id === bulkRouteId);
    return r ? store.cities.find((c) => c.id === r.toCityId) : undefined;
  }, [bulkRouteId, store.routes, store.cities]);

  // Filter & paginate trips
  const filteredTrips = useMemo(() => {
    let trips = store.trips;
    if (!showExpired) {
      trips = trips.filter((t) => !isTripExpired(t.date, t.time));
    }
    return trips;
  }, [store.trips, showExpired]);

  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const resetForm = () => {
    setAgencyId("");
    setRouteId("");
    setBusTemplateId("");
    setDate("");
    setTime("");
    setPriceRegular("");
    setPriceVip("");
    setDropOffId("");
    setTakenSeats([]);
  };

  const closeDrawer = () => {
    setMode("closed");
    resetForm();
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkDelete = () => {
    const toDelete = store.trips.filter((t) => selectedIds.has(t.id));
    const withBookings = toDelete.filter((t) =>
      store.bookings.some((b) => b.tripId === t.id)
    );
    if (withBookings.length > 0) {
      toast.error(`${withBookings.length} selected trip(s) have bookings and cannot be deleted.`);
      return;
    }
    persist({
      ...store,
      trips: store.trips.filter((t) => !selectedIds.has(t.id)),
    });
    toast.success(`${toDelete.length} trip(s) deleted`);
    setSelectedIds(new Set());
  };

  const openEdit = (t: Trip) => {
    setAgencyId(t.agencyId);
    setRouteId(t.routeId);
    setBusTemplateId(t.busTemplateId);
    setDate(t.date);
    setTime(t.time);
    setPriceRegular(String(t.priceRegular));
    setPriceVip(String(t.priceVip));
    setDropOffId(t.dropOffId ?? "");
    setTakenSeats([...t.takenSeats]);
    setMode({ editId: t.id });
  };

  const toggleSeat = (seat: string) => {
    if (bookedSeats.has(seat)) return; // protected
    setTakenSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    );
  };

  const submit = () => {
    if (!agencyId || !routeId || !busTemplateId || !date || !time)
      return toast.error("Fill all fields");
    if (!Number(priceRegular) || !Number(priceVip)) return toast.error("Enter pricing");

    // Always preserve real bookings in takenSeats
    const finalTaken = Array.from(new Set([...takenSeats, ...bookedSeats]));

    if (isEditing && editingTrip) {
      persist({
        ...store,
        trips: store.trips.map((t) =>
          t.id === editingTrip.id
            ? {
                ...t,
                agencyId,
                routeId,
                busTemplateId,
                date,
                time,
                priceRegular: Number(priceRegular),
                priceVip: Number(priceVip),
                dropOffId: dropOffId || undefined,
                takenSeats: finalTaken,
              }
            : t
        ),
      });
      toast.success("Trip updated");
    } else {
      persist({
        ...store,
        trips: [
          ...store.trips,
          {
            id: `t-${Date.now()}`,
            agencyId,
            routeId,
            busTemplateId,
            date,
            time,
            priceRegular: Number(priceRegular),
            priceVip: Number(priceVip),
            takenSeats: finalTaken,
            dropOffId: dropOffId || undefined,
          },
        ],
      });
      toast.success("Trip published");
    }
    closeDrawer();
  };

  const submitBulk = () => {
    if (!bulkAgencyId || !bulkRouteId || !bulkBusTemplateId || !bulkTime)
      return toast.error("Fill all fields");
    if (!Number(bulkPriceRegular) || !Number(bulkPriceVip))
      return toast.error("Enter pricing");
    if (!bulkStartDate || !bulkEndDate)
      return toast.error("Select start and end dates");

    const start = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);
    if (start > end) return toast.error("Start date must be before end date");

    const newTrips: Trip[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const dateStr = cur.toISOString().slice(0, 10);
      const id = `t-${Date.now()}-${newTrips.length}`;
      newTrips.push({
        id,
        agencyId: bulkAgencyId,
        routeId: bulkRouteId,
        busTemplateId: bulkBusTemplateId,
        date: dateStr,
        time: bulkTime,
        priceRegular: Number(bulkPriceRegular),
        priceVip: Number(bulkPriceVip),
        takenSeats: [],
        dropOffId: bulkDropOffId || undefined,
      });
      cur.setDate(cur.getDate() + 1);
    }

    persist({
      ...store,
      trips: [...store.trips, ...newTrips],
    });
    toast.success(`${newTrips.length} trips published`);
    setMode("closed");
    setBulkAgencyId("");
    setBulkRouteId("");
    setBulkBusTemplateId("");
    setBulkTime("");
    setBulkPriceRegular("");
    setBulkPriceVip("");
    setBulkDropOffId("");
    setBulkStartDate("");
    setBulkEndDate("");
  };

  const remove = (t: Trip) => {
    const hasBookings = store.bookings.some((b) => b.tripId === t.id);
    if (hasBookings) return toast.error("Trip has bookings. Cancel instead.");
    persist({ ...store, trips: store.trips.filter((x) => x.id !== t.id) });
    toast.info("Trip removed");
  };

  return (
    <SectionWrap
      title="Trips"
      subtitle="Published trips with VIP / Regular pricing."
      action={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowExpired((s) => !s)}
            className={cn(
              "text-xs h-9 px-3 rounded-xl border transition-all",
              showExpired
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-white border-ink-200 text-ink-600 hover:border-ink-300"
            )}
          >
            {showExpired ? "Hide expired" : "Show expired"}
          </button>
          <button onClick={() => setMode("bulk")} className="btn-secondary text-sm h-9 px-3">
            <CalendarDays className="h-4 w-4" /> Bulk create
          </button>
          <button onClick={() => setMode("new")} className="btn-primary text-sm h-9 px-3">
            <Plus className="h-4 w-4" /> Publish trip
          </button>
        </div>
      }
    >
      {filteredTrips.length === 0 ? (
        <div className="card p-10 text-center">
          <TicketIcon className="h-8 w-8 text-ink-300 mx-auto" />
          <p className="text-ink-600 font-medium mt-3">
            {store.trips.length > 0 ? "All visible trips have expired" : "No trips yet"}
          </p>
          <p className="text-ink-400 text-sm">
            {store.trips.length > 0
              ? "Toggle 'Show expired' above to view past trips."
              : "Publish your first trip to start receiving bookings."}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-brand-50 border-b border-brand-100">
              <span className="text-xs font-semibold text-brand-800">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearSelection}
                  className="text-xs px-2 py-1 rounded-md text-brand-700 hover:bg-brand-100"
                >
                  Clear
                </button>
                <button
                  onClick={bulkDelete}
                  className="text-xs px-2 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="bg-ink-50/60 text-ink-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2.5 font-medium w-10">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-brand-600 cursor-pointer"
                    checked={selectedIds.size > 0 && selectedIds.size === filteredTrips.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllVisible(filteredTrips.map((t) => t.id));
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                </th>
                <th className="text-left px-4 py-2.5 font-medium w-[150px]">Agency</th>
                <th className="text-left px-4 py-2.5 font-medium w-[80px]">Route</th>
                <th className="text-left px-4 py-2.5 font-medium w-[120px]">Drop-off</th>
                <th className="text-left px-4 py-2.5 font-medium w-[140px]">Date · Time</th>
                <th className="text-left px-4 py-2.5 font-medium w-[90px]">Bus</th>
                <th className="text-right px-4 py-2.5 font-medium w-[70px]">Bookings</th>
                <th className="text-right px-4 py-2.5 font-medium w-[70px]">Regular</th>
                <th className="text-right px-4 py-2.5 font-medium w-[60px]">VIP</th>
                <th className="text-right px-4 py-2.5 font-medium w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrips.map((t) => {
                const r = store.routes.find((x) => x.id === t.routeId);
                const a = store.cities.find((c) => c.id === r?.fromCityId);
                const b = store.cities.find((c) => c.id === r?.toCityId);
                const tpl = store.busTemplates.find((x) => x.id === t.busTemplateId);
                const agency = store.agencies.find((ag) => ag.id === t.agencyId);
                const dropOff = t.dropOffId
                  ? b?.dropOffs?.find((d) => d.id === t.dropOffId)
                  : undefined;
                const tripBookings = store.bookings.filter(
                  (b) => b.tripId === t.id && b.status !== "cancelled"
                );
                const expired = isTripExpired(t.date, t.time);
                return (
                  <tr key={t.id} className={cn(
                    "border-t border-ink-100 hover:bg-ink-50/40",
                    expired && "opacity-50 bg-ink-50/20"
                  )}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-brand-600 cursor-pointer"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {agency ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-7 w-7 rounded-lg overflow-hidden text-white text-[10px] font-bold flex items-center justify-center",
                              !agency.imageUrl && "bg-gradient-to-br",
                              !agency.imageUrl && agency.logoColor
                            )}
                          >
                            {agency.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={agency.imageUrl}
                                alt={agency.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              agency.name
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            )}
                          </div>
                          <span className="text-ink-700 truncate max-w-[140px]">
                            {agency.name}
                          </span>
                          {expired && (
                            <span className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500 uppercase tracking-wider">
                              Expired
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-rose-500 text-xs italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {a?.code} → {b?.code}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-600">
                      {dropOff ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-brand-500" />
                          {dropOff.name}
                        </span>
                      ) : (
                        <span className="text-ink-400 italic">City center</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {formatDate(t.date)} · <span className="font-mono">{t.time}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{tpl?.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium",
                        tripBookings.length > 0 ? "text-ink-800" : "text-ink-400"
                      )}>
                        <Users className="h-3 w-3" />
                        {tripBookings.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ink-900">{formatFCFA(t.priceRegular)}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-900">{formatFCFA(t.priceVip)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded-lg text-ink-500 hover:text-brand-600 hover:bg-brand-50"
                          aria-label="Edit trip"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(t)}
                          className="p-1.5 rounded-lg text-ink-500 hover:text-rose-600 hover:bg-rose-50"
                          aria-label="Delete trip"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-ink-100 bg-ink-50/30">
              <span className="text-xs text-ink-500">
                Page {currentPage} of {totalPages} · {filteredTrips.length} trips
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 disabled:opacity-40 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 disabled:opacity-40 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Drawer
        open={drawerOpen && mode !== "bulk"}
        title={isEditing ? "Edit trip" : "Publish a new trip"}
        onClose={closeDrawer}
        wide
      >
        <div className="space-y-4">
          <Field label="Agency">
            <Select
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
            >
              <option value="">Select an agency…</option>
              {store.agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Route">
            <Select
              value={routeId}
              onChange={(e) => {
                setRouteId(e.target.value);
                setDropOffId(""); // reset — drop-offs depend on destination city
              }}
            >
              <option value="">Select a route…</option>
              {store.routes.map((r) => {
                const a = store.cities.find((c) => c.id === r.fromCityId);
                const b = store.cities.find((c) => c.id === r.toCityId);
                return (
                  <option key={r.id} value={r.id}>
                    {a?.name} → {b?.name}
                  </option>
                );
              })}
            </Select>
          </Field>

          {routeId && (
            <Field
              label={`Drop-off in ${toCity?.name ?? "destination"}`}
              hint={
                toCity && (toCity.dropOffs?.length ?? 0) === 0
                  ? "No drop-offs configured for this city. Add some in Cities to enable this picker."
                  : "Where this bus drops passengers. Defaults to city center."
              }
            >
              <Select
                value={dropOffId}
                onChange={(e) => setDropOffId(e.target.value)}
                disabled={!toCity || (toCity.dropOffs?.length ?? 0) === 0}
              >
                <option value="">{toCity?.name ?? "City"} — city center (default)</option>
                {toCity?.dropOffs?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Bus template">
            <Select value={busTemplateId} onChange={(e) => setBusTemplateId(e.target.value)}>
              <option value="">Select a template…</option>
              {store.busTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} · {t.type}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Time">
              <Select value={time} onChange={(e) => setTime(e.target.value)}>
                <option value="">Pick time…</option>
                {store.schedules.map((s) => (
                  <option key={s.id} value={s.time}>{s.time}{s.label ? ` · ${s.label}` : ""}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price Regular (FCFA)">
              <Input type="number" min={500} value={priceRegular} onChange={(e) => setPriceRegular(e.target.value)} placeholder="4000" />
            </Field>
            <Field label="Price VIP (FCFA)">
              <Input type="number" min={500} value={priceVip} onChange={(e) => setPriceVip(e.target.value)} placeholder="7500" />
            </Field>
          </div>

          {selectedTemplate && (
            <SeatBlocker
              layout={selectedTemplate.layout}
              taken={takenSeats}
              booked={bookedSeats}
              onToggle={toggleSeat}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeDrawer} className="btn-secondary text-sm">Cancel</button>
            <button onClick={submit} className="btn-primary text-sm">
              {isEditing ? "Save changes" : "Publish"}
            </button>
          </div>
        </div>
      </Drawer>

      <Drawer
        open={mode === "bulk"}
        title="Bulk create trips"
        onClose={closeDrawer}
        wide
      >
        <div className="space-y-4">
          <Field label="Agency">
            <Select value={bulkAgencyId} onChange={(e) => setBulkAgencyId(e.target.value)}>
              <option value="">Select an agency…</option>
              {store.agencies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Route">
            <Select
              value={bulkRouteId}
              onChange={(e) => {
                setBulkRouteId(e.target.value);
                setBulkDropOffId("");
              }}
            >
              <option value="">Select a route…</option>
              {store.routes.map((r) => {
                const a = store.cities.find((c) => c.id === r.fromCityId);
                const b = store.cities.find((c) => c.id === r.toCityId);
                return (
                  <option key={r.id} value={r.id}>
                    {a?.name} → {b?.name}
                  </option>
                );
              })}
            </Select>
          </Field>

          {bulkRouteId && (
            <Field
              label={`Drop-off in ${bulkToCity?.name ?? "destination"}`}
              hint={
                bulkToCity && (bulkToCity.dropOffs?.length ?? 0) === 0
                  ? "No drop-offs configured for this city."
                  : "Defaults to city center."
              }
            >
              <Select
                value={bulkDropOffId}
                onChange={(e) => setBulkDropOffId(e.target.value)}
                disabled={!bulkToCity || (bulkToCity.dropOffs?.length ?? 0) === 0}
              >
                <option value="">{bulkToCity?.name ?? "City"} — city center (default)</option>
                {bulkToCity?.dropOffs?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Bus template">
            <Select value={bulkBusTemplateId} onChange={(e) => setBulkBusTemplateId(e.target.value)}>
              <option value="">Select a template…</option>
              {store.busTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} · {t.type}</option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <Input type="date" value={bulkStartDate} onChange={(e) => setBulkStartDate(e.target.value)} />
            </Field>
            <Field label="End date">
              <Input type="date" value={bulkEndDate} onChange={(e) => setBulkEndDate(e.target.value)} />
            </Field>
          </div>

          <Field label="Time">
            <Select value={bulkTime} onChange={(e) => setBulkTime(e.target.value)}>
              <option value="">Pick time…</option>
              {store.schedules.map((s) => (
                <option key={s.id} value={s.time}>
                  {s.time}{s.label ? ` · ${s.label}` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price Regular (FCFA)">
              <Input type="number" min={500} value={bulkPriceRegular} onChange={(e) => setBulkPriceRegular(e.target.value)} placeholder="4000" />
            </Field>
            <Field label="Price VIP (FCFA)">
              <Input type="number" min={500} value={bulkPriceVip} onChange={(e) => setBulkPriceVip(e.target.value)} placeholder="7500" />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeDrawer} className="btn-secondary text-sm">Cancel</button>
            <button onClick={submitBulk} className="btn-primary text-sm">Publish trips</button>
          </div>
        </div>
      </Drawer>
    </SectionWrap>
  );
}

/* ---------- Seat blocker (dashboard) ---------- */

function SeatBlocker({
  layout,
  taken,
  booked,
  onToggle,
}: {
  layout: SeatLayout;
  taken: string[];
  booked: Set<string>;
  onToggle: (seat: string) => void;
}) {
  const cols = Math.max(...layout.map((r) => r.length));
  const takenSet = new Set(taken);
  const totalSeats = layout
    .flat()
    .filter((c) => c && c !== "driver").length;
  const blockedCount = taken.filter((s) => !booked.has(s)).length;
  const availableCount = totalSeats - takenSet.size;

  return (
    <div className="rounded-2xl border border-ink-200 bg-gradient-to-b from-ink-50/40 to-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-400 font-semibold">
            Seat availability
          </p>
          <p className="text-[11px] text-ink-500 mt-1">
            Click a seat to block it. Booked seats can&apos;t be unblocked here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {availableCount} free
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {blockedCount} blocked
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {booked.size} booked
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-sm">
        <div className="rounded-t-[1.75rem] border border-ink-200 border-b-0 h-6 mb-1" />
        <div
          className="grid gap-1.5 p-3 border border-ink-200 rounded-b-3xl bg-white"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {layout.flatMap((row, ri) =>
            Array.from({ length: cols }).map((_, ci) => {
              const cell = row[ci] ?? null;

              if (cell === "driver") {
                return (
                  <div
                    key={`${ri}-${ci}`}
                    className="aspect-square rounded-md border border-dashed border-ink-300 bg-ink-50/60 text-[9px] text-ink-400 flex items-center justify-center"
                    title="Driver"
                  >
                    DRV
                  </div>
                );
              }
              if (!cell) {
                return <div key={`${ri}-${ci}`} className="aspect-square" />;
              }

              const isBooked = booked.has(cell);
              const isBlocked = takenSet.has(cell) && !isBooked;
              return (
                <button
                  key={`${ri}-${ci}`}
                  type="button"
                  disabled={isBooked}
                  onClick={() => onToggle(cell)}
                  className={cn(
                    "aspect-square rounded-md border text-[10px] font-bold flex items-center justify-center transition",
                    isBooked &&
                      "bg-rose-50 border-rose-200 text-rose-600 cursor-not-allowed line-through",
                    isBlocked &&
                      "bg-amber-50 border-amber-300 text-amber-700 hover:border-amber-500",
                    !isBooked &&
                      !isBlocked &&
                      "bg-white border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                  )}
                  title={
                    isBooked
                      ? `${cell} — booked (cannot unblock)`
                      : isBlocked
                        ? `${cell} — blocked (click to free)`
                        : `${cell} — free (click to block)`
                  }
                >
                  {cell}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Layout helpers ---------- */

function SectionWrap({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
          {subtitle && <p className="text-ink-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Drawer({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink-900/30 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className={cn(
              "fixed right-0 top-0 h-full bg-white z-50 border-l border-ink-100 shadow-2xl flex flex-col",
              wide ? "w-full sm:w-[680px]" : "w-full sm:w-[440px]"
            )}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <h3 className="font-semibold text-ink-900">{title}</h3>
              <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg hover:bg-ink-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
