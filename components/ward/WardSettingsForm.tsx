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
import { updateOrganization } from "@/lib/actions/organizations";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import type { Organization } from "@/lib/db/schema";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Puerto_Rico",
];

export default function WardSettingsForm({ ward }: { ward: Organization }) {
  const [name, setName] = useState(ward.name);
  const [slug, setSlug] = useState(ward.slug);
  const [timezone, setTimezone] = useState(ward.timezone);
  const [primaryColor, setPrimaryColor] = useState(ward.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(ward.secondaryColor);
  const [logoUrl, setLogoUrl] = useState(ward.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState((ward as any).bannerUrl ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleImageUpload = async (
    file: File | null,
    setter: (url: string) => void,
    setUploading: (v: boolean) => void,
    label: string
  ) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setter(result.url);
      toast.success(`${label} uploaded`);
    } catch {
      toast.error(`${label} upload failed`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    startTransition(async () => {
      try {
        await updateOrganization(ward.id, {
          name: name.trim(),
          slug: slug.trim(),
          timezone,
          primaryColor,
          secondaryColor,
          logoUrl: logoUrl || undefined,
          bannerUrl: bannerUrl || undefined,
        });
        toast.success("Settings saved");
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to save");
      }
    });
  };

  return (
    <div className="space-y-6 bg-white border rounded-xl p-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">Ward Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">
          URL Slug
          <span className="ml-1.5 text-xs text-muted-foreground font-normal">
            (wardannouncements.com/ward/{slug})
          </span>
        </Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
          placeholder="my-ward"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Timezone</Label>
        <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Banner image */}
      <div className="space-y-2">
        <Label>Banner Image</Label>
        <p className="text-xs text-muted-foreground">
          Wide image displayed at the top of your public ward page (recommended: 1200×400px)
        </p>
        {bannerUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerUrl}
              alt="Banner"
              className="w-full h-32 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => setBannerUrl("")}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg h-24 cursor-pointer hover:bg-muted/40 transition-colors">
            {uploadingBanner ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload banner image</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                handleImageUpload(e.target.files?.[0] ?? null, setBannerUrl, setUploadingBanner, "Banner")
              }
              disabled={uploadingBanner}
            />
          </label>
        )}
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <Label>Ward Logo</Label>
        <p className="text-xs text-muted-foreground">Small logo shown in the banner header</p>
        <div className="flex items-center gap-3">
          {logoUrl && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Logo" className="h-14 w-14 rounded-full object-cover border" />
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="absolute -top-1 -right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <label className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/40 text-sm">
            {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{logoUrl ? "Replace logo" : "Upload logo"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                handleImageUpload(e.target.files?.[0] ?? null, setLogoUrl, setUploadingLogo, "Logo")
              }
              disabled={uploadingLogo}
            />
          </label>
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Primary Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-16 rounded border cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Secondary Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-9 w-16 rounded border cursor-pointer"
            />
            <Input
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t">
        <Button onClick={handleSave} disabled={isPending || uploadingLogo || uploadingBanner}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
