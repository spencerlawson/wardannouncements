"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Loader2,
  Eye,
  Music,
  Mic2,
  BookOpen,
  Hand,
  AlignLeft,
  Minus,
  Quote,
  Users2,
} from "lucide-react";
import {
  PROGRAM_TYPE_LABELS,
  PROGRAM_TEMPLATES,
  PROGRAM_ICONS,
  PROGRAM_ITEM_TYPE_LABELS,
} from "@/lib/constants/programs";
import { ProgramIcon } from "./ProgramIcons";
import { createProgram, updateProgram } from "@/lib/actions/programs";
import type { ProgramType, ProgramItemType, Program, ProgramItem } from "@/lib/db/schema";
import type { ProgramIconKey } from "@/lib/constants/programs";

interface Org {
  id: string;
  name: string;
}

type DraftItem = {
  _key: string;
  type: ProgramItemType;
  label: string;
  detail: string;
  secondaryDetail: string;
  isCongregalional: boolean;
};

let _keyCounter = 0;
function makeKey() {
  return `item-${++_keyCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

const ITEM_TYPE_ICONS: Record<ProgramItemType, React.ReactNode> = {
  hymn: <Music className="h-3.5 w-3.5" />,
  prayer: <Hand className="h-3.5 w-3.5" />,
  speaker: <Mic2 className="h-3.5 w-3.5" />,
  musical_number: <Music className="h-3.5 w-3.5" />,
  sacrament: <Users2 className="h-3.5 w-3.5" />,
  text: <AlignLeft className="h-3.5 w-3.5" />,
  divider: <Minus className="h-3.5 w-3.5" />,
  scripture: <BookOpen className="h-3.5 w-3.5" />,
};

const ITEM_TYPE_COLORS: Record<ProgramItemType, string> = {
  hymn: "bg-violet-100 text-violet-700",
  prayer: "bg-sky-100 text-sky-700",
  speaker: "bg-amber-100 text-amber-700",
  musical_number: "bg-pink-100 text-pink-700",
  sacrament: "bg-stone-100 text-stone-700",
  text: "bg-slate-100 text-slate-600",
  divider: "bg-slate-50 text-slate-400",
  scripture: "bg-emerald-100 text-emerald-700",
};

function templateToItems(type: ProgramType): DraftItem[] {
  return PROGRAM_TEMPLATES[type].map((t) => ({
    _key: makeKey(),
    type: t.type,
    label: t.label ?? "",
    detail: t.detail ?? "",
    secondaryDetail: t.secondaryDetail ?? "",
    isCongregalional: t.isCongregalional ?? false,
  }));
}

function existingToItems(items: ProgramItem[]): DraftItem[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => ({
      _key: makeKey(),
      type: i.type,
      label: i.label ?? "",
      detail: i.detail ?? "",
      secondaryDetail: i.secondaryDetail ?? "",
      isCongregalional: i.isCongregalional,
    }));
}

interface ProgramBuilderProps {
  orgs: Org[];
  defaultOrgId?: string;
  existing?: Program;
  existingItems?: ProgramItem[];
}

export default function ProgramBuilder({
  orgs,
  defaultOrgId,
  existing,
  existingItems,
}: ProgramBuilderProps) {
  const defaultOrg =
    (defaultOrgId && orgs.find((o) => o.id === defaultOrgId))
      ? defaultOrgId
      : orgs[0]?.id ?? "";

  const [orgId, setOrgId] = useState<string>(existing?.organizationId ?? defaultOrg);
  const [date, setDate] = useState(existing?.date ?? "");
  const [type, setType] = useState<ProgramType>(existing?.type ?? "sacrament_meeting");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [sessionLabel, setSessionLabel] = useState(existing?.sessionLabel ?? "");
  const [presiding, setPresiding] = useState(existing?.presiding ?? "");
  const [conducting, setConducting] = useState(existing?.conducting ?? "");
  const [theme, setTheme] = useState(existing?.theme ?? "");
  const [icon, setIcon] = useState<string | null>(existing?.icon ?? null);
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [items, setItems] = useState<DraftItem[]>(
    existing && existingItems ? existingToItems(existingItems) : templateToItems("sacrament_meeting")
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleTypeChange = (newType: ProgramType) => {
    setType(newType);
    if (!existing) {
      setItems(templateToItems(newType));
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setItems((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DraftItem, value: string | boolean) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = (itemType: ProgramItemType) => {
    setShowAddMenu(false);
    const defaults: Record<ProgramItemType, Partial<DraftItem>> = {
      hymn: { label: "Hymn", isCongregalional: true },
      prayer: { label: "Prayer" },
      speaker: { label: "Speaker" },
      musical_number: { label: "Musical Number" },
      sacrament: { label: "Administration of the Sacrament" },
      text: { label: "" },
      divider: { label: "" },
      scripture: { label: "Scripture" },
    };
    setItems((prev) => [
      ...prev,
      {
        _key: makeKey(),
        type: itemType,
        label: "",
        detail: "",
        secondaryDetail: "",
        isCongregalional: false,
        ...defaults[itemType],
      },
    ]);
  };

  const handleSave = (status: "draft" | "published") => {
    if (!date) return toast.error("Date is required");
    if (!orgId) return toast.error("Ward is required");

    const payload = {
      organizationId: orgId,
      date,
      type,
      title: title || null,
      sessionLabel: sessionLabel || null,
      presiding: presiding || null,
      conducting: conducting || null,
      theme: theme || null,
      icon: icon || null,
      status,
      isActive,
      items: items.map((item) => ({
        type: item.type,
        label: item.label || null,
        detail: item.detail || null,
        secondaryDetail: item.secondaryDetail || null,
        isCongregalional: item.isCongregalional,
      })),
    };

    startTransition(async () => {
      try {
        if (existing) {
          await updateProgram(existing.id, payload);
          toast.success(status === "published" ? "Program published" : "Draft saved");
        } else {
          await createProgram(payload);
        }
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to save");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Program details ── */}
      <div className="bg-white border rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-stone-800">Program Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {orgs.length > 1 && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Ward</Label>
              <Select value={orgId} onValueChange={(v) => v && setOrgId(v)}>
                <SelectTrigger>
                  {orgs.find((o) => o.id === orgId)?.name ?? "Select ward"}
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="prog-date">Date *</Label>
            <Input
              id="prog-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Meeting Type *</Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as ProgramType)}>
              <SelectTrigger>{PROGRAM_TYPE_LABELS[type]}</SelectTrigger>
              <SelectContent>
                {(Object.keys(PROGRAM_TYPE_LABELS) as ProgramType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {PROGRAM_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="prog-title">
              Title Override{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (e.g. "Elder Smith's Mission Farewell")
              </span>
            </Label>
            <Input
              id="prog-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={PROGRAM_TYPE_LABELS[type]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prog-session">
              Session Label{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (e.g. "Saturday Evening Session")
              </span>
            </Label>
            <Input
              id="prog-session"
              value={sessionLabel}
              onChange={(e) => setSessionLabel(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prog-theme">Theme / Scripture</Label>
            <Input
              id="prog-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prog-presiding">Presiding</Label>
            <Input
              id="prog-presiding"
              value={presiding}
              onChange={(e) => setPresiding(e.target.value)}
              placeholder="Name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prog-conducting">Conducting</Label>
            <Input
              id="prog-conducting"
              value={conducting}
              onChange={(e) => setConducting(e.target.value)}
              placeholder="Name"
            />
          </div>
        </div>

        {/* Icon picker */}
        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIcon(null)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                icon === null
                  ? "border-stone-800 bg-stone-800 text-white"
                  : "border-stone-200 text-stone-500 hover:border-stone-400"
              }`}
            >
              None
            </button>
            {(Object.keys(PROGRAM_ICONS) as ProgramIconKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  icon === key
                    ? "border-stone-800 bg-stone-50"
                    : "border-stone-200 text-stone-500 hover:border-stone-400"
                }`}
              >
                <ProgramIcon icon={key} className="h-5 w-5 text-stone-600" />
                {PROGRAM_ICONS[key]}
              </button>
            ))}
          </div>
        </div>

        {/* Active toggle */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            Show on public ward page
          </label>
          <p className="text-xs text-muted-foreground">
            If a published program isn&apos;t active, it won&apos;t appear on the ward&apos;s public page.
            Use this to prepare an additional program (e.g. a later meeting the same day)
            without cluttering the page until you&apos;re ready to display it.
          </p>
        </div>
      </div>

      {/* ── Order of service ── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-stone-50">
          <h2 className="font-semibold text-stone-800">Order of Service</h2>
          <span className="text-xs text-muted-foreground">{items.length} items</span>
        </div>

        <div className="divide-y">
          {items.map((item, index) => (
            <div key={item._key} className="flex gap-3 px-4 py-3 items-start">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 pt-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-0.5 text-stone-300 hover:text-stone-600 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === items.length - 1}
                  className="p-0.5 text-stone-300 hover:text-stone-600 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Type badge */}
              <div className="pt-1.5 shrink-0">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${ITEM_TYPE_COLORS[item.type]}`}
                >
                  {ITEM_TYPE_ICONS[item.type]}
                  {PROGRAM_ITEM_TYPE_LABELS[item.type]}
                </span>
              </div>

              {/* Fields */}
              <div className="flex-1 min-w-0">
                <ItemFields item={item} index={index} onChange={updateItem} />
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="pt-1.5 text-stone-300 hover:text-red-500 transition-colors shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add item */}
        <div className="px-4 py-3 border-t relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-stone-500"
            onClick={() => setShowAddMenu((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>

          {showAddMenu && (
            <div className="absolute left-4 bottom-full mb-1 z-10 bg-white border border-stone-200 rounded-lg shadow-lg py-1 min-w-44">
              {(Object.keys(PROGRAM_ITEM_TYPE_LABELS) as ProgramItemType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addItem(t)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-stone-50 transition-colors"
                >
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${ITEM_TYPE_COLORS[t]}`}>
                    {ITEM_TYPE_ICONS[t]}
                  </span>
                  {PROGRAM_ITEM_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave("draft")}
          disabled={isPending}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSave("published")}
          disabled={isPending}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          {existing?.status === "published" ? "Save & Publish" : "Publish"}
        </Button>
        {existing && (
          <a
            href="#preview"
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Preview
          </a>
        )}
      </div>
    </div>
  );
}

function ItemFields({
  item,
  index,
  onChange,
}: {
  item: DraftItem;
  index: number;
  onChange: (index: number, field: keyof DraftItem, value: string | boolean) => void;
}) {
  if (item.type === "divider") {
    return <p className="text-xs text-stone-400 pt-1.5">— visual separator —</p>;
  }

  if (item.type === "sacrament") {
    return (
      <Input
        value={item.label}
        onChange={(e) => onChange(index, "label", e.target.value)}
        placeholder="Administration of the Sacrament"
        className="text-sm h-8"
      />
    );
  }

  if (item.type === "text") {
    return (
      <div className="flex gap-2">
        <Input
          value={item.label}
          onChange={(e) => onChange(index, "label", e.target.value)}
          placeholder="Label"
          className="text-sm h-8 w-36 shrink-0 text-stone-500"
        />
        <Input
          value={item.detail}
          onChange={(e) => onChange(index, "detail", e.target.value)}
          placeholder="Value (e.g. Bishop Smith)"
          className="text-sm h-8 flex-1"
        />
      </div>
    );
  }

  if (item.type === "hymn") {
    return (
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            value={item.label}
            onChange={(e) => onChange(index, "label", e.target.value)}
            placeholder="Label"
            className="text-sm h-8 w-36 shrink-0 text-stone-500"
          />
          <Input
            value={item.detail}
            onChange={(e) => onChange(index, "detail", e.target.value)}
            placeholder="No. and title (e.g. 72 — Praise to the Man)"
            className="text-sm h-8 flex-1"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={item.isCongregalional}
            onChange={(e) => onChange(index, "isCongregalional", e.target.checked)}
            className="rounded"
          />
          Congregational
        </label>
      </div>
    );
  }

  if (item.type === "prayer") {
    return (
      <div className="flex gap-2">
        <Input
          value={item.label}
          onChange={(e) => onChange(index, "label", e.target.value)}
          placeholder="Label"
          className="text-sm h-8 w-36 shrink-0 text-stone-500"
        />
        <Input
          value={item.detail}
          onChange={(e) => onChange(index, "detail", e.target.value)}
          placeholder="Person's name"
          className="text-sm h-8 flex-1"
        />
      </div>
    );
  }

  if (item.type === "speaker") {
    return (
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            value={item.label}
            onChange={(e) => onChange(index, "label", e.target.value)}
            placeholder="Label"
            className="text-sm h-8 w-36 shrink-0 text-stone-500"
          />
          <Input
            value={item.detail}
            onChange={(e) => onChange(index, "detail", e.target.value)}
            placeholder="Name"
            className="text-sm h-8 flex-1"
          />
        </div>
        <Input
          value={item.secondaryDetail}
          onChange={(e) => onChange(index, "secondaryDetail", e.target.value)}
          placeholder="Topic (optional)"
          className="text-sm h-8"
        />
      </div>
    );
  }

  if (item.type === "musical_number") {
    return (
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            value={item.label}
            onChange={(e) => onChange(index, "label", e.target.value)}
            placeholder="Label"
            className="text-sm h-8 w-36 shrink-0 text-stone-500"
          />
          <Input
            value={item.detail}
            onChange={(e) => onChange(index, "detail", e.target.value)}
            placeholder="Song title"
            className="text-sm h-8 flex-1"
          />
        </div>
        <Input
          value={item.secondaryDetail}
          onChange={(e) => onChange(index, "secondaryDetail", e.target.value)}
          placeholder="Performed by (optional)"
          className="text-sm h-8"
        />
      </div>
    );
  }

  if (item.type === "scripture") {
    return (
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            value={item.label}
            onChange={(e) => onChange(index, "label", e.target.value)}
            placeholder="Label"
            className="text-sm h-8 w-36 shrink-0 text-stone-500"
          />
          <Input
            value={item.detail}
            onChange={(e) => onChange(index, "detail", e.target.value)}
            placeholder="Reference (e.g. John 3:16)"
            className="text-sm h-8 flex-1"
          />
        </div>
        <Input
          value={item.secondaryDetail}
          onChange={(e) => onChange(index, "secondaryDetail", e.target.value)}
          placeholder="Verse text (optional)"
          className="text-sm h-8"
        />
      </div>
    );
  }

  return null;
}
