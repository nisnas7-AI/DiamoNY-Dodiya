import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Globe, Image, Palette, Eye, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";

interface WebPresenceRow {
  id: string;
  favicon_original_url: string | null;
  favicon_16: string | null;
  favicon_32: string | null;
  favicon_48: string | null;
  favicon_180: string | null;
  favicon_192: string | null;
  favicon_512: string | null;
  favicon_version: number;
  theme_color: string;
  og_image_url: string | null;
}

const SIZES = [16, 32, 48, 180, 192, 512] as const;

type SizeKey = `favicon_${typeof SIZES[number]}`;

interface LocalFaviconBlobs {
  original: Blob;
  originalName: string;
  sizes: Record<SizeKey, { blob: Blob; url: string }>;
}

/* ─── Canvas-based resize (transparent, aggressive fill) ─── */
const resizeImageToBlob = (img: HTMLImageElement, size: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return reject(new Error("No canvas context"));

    // Ensure fully transparent canvas
    ctx.clearRect(0, 0, size, size);

    // Aggressive fill: use Math.max so the icon covers the full square
    const ratio = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    const x = (size - w) / 2;
    const y = (size - h) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, x, y, w, h);

    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png"
    );
  });
};

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });

/* ─── Favicon Live Preview ─── */
const FaviconPreview = ({ src }: { src: string }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
      <Eye className="w-4 h-4" /> תצוגה מקדימה
    </h3>
    <div className="border rounded-xl overflow-hidden bg-muted/30">
      <div className="bg-[#dee1e6] dark:bg-[#35363a] px-3 pt-2">
        <div className="flex items-center gap-2 bg-background rounded-t-lg px-3 py-2 max-w-[220px] border border-b-0 border-border">
          <img src={src} alt="Favicon" className="w-4 h-4 rounded-sm object-contain" />
          <span className="text-xs truncate text-foreground">DiamoNY | צורפות עילית</span>
        </div>
      </div>
      <div className="h-16 bg-background border-t" />
    </div>
    <div className="border rounded-xl p-4 bg-background space-y-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Google Mobile Result</p>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
          <img src={src} alt="Favicon" className="w-5 h-5 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">diamony.me</p>
          <p className="text-sm font-medium text-[#1a0dab] truncate">DiamoNY | צורפות עילית בעיצוב אישי</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        סטודיו לצורפות עילית בעיצוב אישי. תכשיטי יהלומים וזהב בסטנדרט פרימיום…
      </p>
    </div>
  </div>
);

/* ─── Generated Sizes Grid ─── */
const SizesGrid = ({ items }: { items: { label: string; url: string | null; use: string }[] }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-muted-foreground">גדלים שנוצרו</h3>
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {items.map((s) => (
        <div key={s.label} className="text-center space-y-1.5">
          <div className="mx-auto w-12 h-12 rounded-lg border bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)_0_0/16px_16px] flex items-center justify-center">
            {s.url ? (
              <img src={s.url} alt={s.label} className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-[10px] text-muted-foreground">—</span>
            )}
          </div>
          <p className="text-[10px] font-mono text-muted-foreground">{s.label}</p>
          <p className="text-[9px] text-muted-foreground/60">{s.use}</p>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Main Component ─── */
const WebPresenceManager = () => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [ogUploading, setOgUploading] = useState(false);
  const [themeColor, setThemeColor] = useState("#1a1a1a");

  // Local blobs produced by Canvas (not yet saved)
  const [localFavicon, setLocalFavicon] = useState<LocalFaviconBlobs | null>(null);
  const [ogLocalPreview, setOgLocalPreview] = useState<string | null>(null);
  const ogFileRef = useRef<File | null>(null);

  // Cleanup object URLs on unmount
  const revokeLocalFavicon = useCallback((lf: LocalFaviconBlobs | null) => {
    if (!lf) return;
    Object.values(lf.sizes).forEach((v) => URL.revokeObjectURL(v.url));
  }, []);

  useEffect(() => {
    return () => {
      revokeLocalFavicon(localFavicon);
      if (ogLocalPreview) URL.revokeObjectURL(ogLocalPreview);
    };
  }, []); // intentional: cleanup only on unmount

  /* ─── Fetch saved data ─── */
  const { data: row, isLoading } = useQuery({
    queryKey: ["web-presence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("web_presence_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: newRow, error: insertErr } = await supabase
          .from("web_presence_settings" as any)
          .insert({ theme_color: "#1a1a1a" } as any)
          .select("*")
          .single();
        if (insertErr) throw insertErr;
        return newRow as unknown as WebPresenceRow;
      }
      return data as unknown as WebPresenceRow;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (row?.theme_color) setThemeColor(row.theme_color);
  }, [row?.theme_color]);

  /* ─── Client-side favicon processing via Canvas ─── */
  const onFaviconDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const allowed = ["image/svg+xml", "image/png", "image/webp", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      toast.error("פורמט לא נתמך. השתמש ב-SVG, PNG, WebP או JPG");
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = await loadImageElement(objectUrl);

      const sizes: Record<string, { blob: Blob; url: string }> = {};
      for (const size of SIZES) {
        const blob = await resizeImageToBlob(img, size);
        sizes[`favicon_${size}`] = { blob, url: URL.createObjectURL(blob) };
      }

      // Revoke old local data
      revokeLocalFavicon(localFavicon);
      URL.revokeObjectURL(objectUrl);

      setLocalFavicon({
        original: file,
        originalName: file.name,
        sizes: sizes as LocalFaviconBlobs["sizes"],
      });

      toast.success("הגדלים נוצרו בהצלחה! לחץ 'שמור' לפרסום.");
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בעיבוד התמונה");
    }
  }, [localFavicon, revokeLocalFavicon]);

  const faviconDropzone = useDropzone({
    onDrop: onFaviconDrop,
    accept: { "image/svg+xml": [".svg"], "image/png": [".png"], "image/webp": [".webp"], "image/jpeg": [".jpg", ".jpeg"] },
    maxFiles: 1,
    disabled: saving,
  });

  /* ─── Save Favicon (upload all blobs to Storage) ─── */
  const saveFavicon = useCallback(async () => {
    if (!localFavicon || !row?.id) {
      console.error("saveFavicon: missing localFavicon or row.id", { hasLocal: !!localFavicon, rowId: row?.id });
      toast.error("אין נתונים לשמירה. נסה להעלות קובץ מחדש.");
      return;
    }
    setSaving(true);
    try {
      const version = Date.now();
      const ext = localFavicon.originalName.split(".").pop() || "png";

      // 1. Upload original
      const origPath = `favicon/favicon-original.${ext}`;
      const { error: origErr } = await supabase.storage
        .from("vip-assets")
        .upload(origPath, localFavicon.original, { upsert: true, contentType: localFavicon.original.type || "image/png" });
      if (origErr) throw new Error(`Original upload failed: ${origErr.message}`);

      const { data: origUrl } = supabase.storage.from("vip-assets").getPublicUrl(origPath);
      if (!origUrl?.publicUrl) throw new Error("Failed to get original public URL");

      // 2. Upload each resized variant
      const urls: Record<string, string> = { favicon_original_url: origUrl.publicUrl };
      for (const size of SIZES) {
        const key = `favicon_${size}` as SizeKey;
        const blob = localFavicon.sizes[key]?.blob;
        if (!blob) throw new Error(`Missing blob for size ${size}`);

        const path = `favicon/favicon-${size}.png`;
        const { error: sizeErr } = await supabase.storage
          .from("vip-assets")
          .upload(path, blob, { upsert: true, contentType: "image/png" });
        if (sizeErr) throw new Error(`Upload ${size}px failed: ${sizeErr.message}`);

        const { data: sizeUrl } = supabase.storage.from("vip-assets").getPublicUrl(path);
        if (!sizeUrl?.publicUrl) throw new Error(`Failed to get public URL for ${size}px`);
        urls[key] = sizeUrl.publicUrl;
      }

      // 3. Update DB row
      const { error: dbErr } = await supabase
        .from("web_presence_settings" as any)
        .update({
          ...urls,
          favicon_version: version,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", row.id);
      if (dbErr) throw new Error(`DB update failed: ${dbErr.message}`);

      revokeLocalFavicon(localFavicon);
      setLocalFavicon(null);
      await queryClient.invalidateQueries({ queryKey: ["web-presence"] });
      toast.success("הפאביקון נשמר ופורסם בהצלחה!");
    } catch (err: any) {
      console.error("saveFavicon error:", err);
      toast.error(err?.message || "שגיאה בשמירת הפאביקון");
    } finally {
      setSaving(false);
    }
  }, [localFavicon, row, queryClient, revokeLocalFavicon]);

  /* ─── OG Image Upload ─── */
  const onOgDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (ogLocalPreview) URL.revokeObjectURL(ogLocalPreview);
    ogFileRef.current = file;
    setOgLocalPreview(URL.createObjectURL(file));
    toast.success("תמונת OG נטענה! לחץ 'שמור' לפרסום.");
  }, [ogLocalPreview]);

  const saveOgImage = useCallback(async () => {
    const file = ogFileRef.current;
    if (!file || !row?.id) {
      console.error("saveOgImage: missing file or row.id");
      toast.error("אין תמונה לשמירה.");
      return;
    }
    setOgUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `favicon/og-image-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("vip-assets").upload(path, file, { upsert: true });
      if (upErr) throw new Error(`OG upload failed: ${upErr.message}`);

      const { data: urlData } = supabase.storage.from("vip-assets").getPublicUrl(path);
      if (!urlData?.publicUrl) throw new Error("Failed to get OG public URL");

      const { error: dbErr } = await supabase
        .from("web_presence_settings" as any)
        .update({ og_image_url: urlData.publicUrl, updated_at: new Date().toISOString() } as any)
        .eq("id", row.id);
      if (dbErr) throw new Error(`OG DB update failed: ${dbErr.message}`);

      if (ogLocalPreview) URL.revokeObjectURL(ogLocalPreview);
      setOgLocalPreview(null);
      ogFileRef.current = null;
      await queryClient.invalidateQueries({ queryKey: ["web-presence"] });
      toast.success("תמונת השיתוף החברתי נשמרה");
    } catch (err: any) {
      console.error("saveOgImage error:", err);
      toast.error(err?.message || "שגיאה בשמירת תמונה");
    } finally {
      setOgUploading(false);
    }
  }, [row, queryClient, ogLocalPreview]);

  const ogDropzone = useDropzone({
    onDrop: onOgDrop,
    accept: { "image/png": [".png"], "image/webp": [".webp"], "image/jpeg": [".jpg", ".jpeg"] },
    maxFiles: 1,
    disabled: ogUploading,
  });

  /* ─── Theme Color Save ─── */
  const themeColorMutation = useMutation({
    mutationFn: async () => {
      if (!row?.id) throw new Error("No settings row");
      await supabase
        .from("web_presence_settings" as any)
        .update({ theme_color: themeColor, updated_at: new Date().toISOString() } as any)
        .eq("id", row.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["web-presence"] });
      toast.success("צבע הנושא עודכן");
    },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* ─── Build grid items: prefer local blobs, fallback to saved DB URLs ─── */
  const sizesMeta = [
    { size: 16, label: "16×16", use: "Browsers" },
    { size: 32, label: "32×32", use: "Browsers HD" },
    { size: 48, label: "48×48", use: "Google SEO" },
    { size: 180, label: "180×180", use: "Apple Touch" },
    { size: 192, label: "192×192", use: "Android/PWA" },
    { size: 512, label: "512×512", use: "PWA Splash" },
  ] as const;

  const gridItems = sizesMeta.map((m) => {
    const key = `favicon_${m.size}` as SizeKey;
    const localUrl = localFavicon?.sizes[key]?.url ?? null;
    const dbUrl = row?.[key as keyof WebPresenceRow] as string | null;
    const displayUrl = localUrl || (dbUrl ? `${dbUrl}?v=${row?.favicon_version}` : null);
    return { label: m.label, url: displayUrl, use: m.use };
  });

  const hasAnySizeUrl = gridItems.some((g) => g.url);

  // Preview src: local 32px blob → saved 32px → saved original → fallback
  const previewSrc =
    localFavicon?.sizes.favicon_32?.url ||
    (row?.favicon_32 ? `${row.favicon_32}?v=${row.favicon_version}` : null) ||
    (row?.favicon_original_url ? `${row.favicon_original_url}?v=${row.favicon_version}` : null) ||
    "/favicon.png";

  const ogDisplayUrl = ogLocalPreview || row?.og_image_url || null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Favicon ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-[#c9a96e]" />
            Favicon & App Icon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Upload Zone */}
              <div
                {...faviconDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${faviconDropzone.isDragActive ? "border-[#c9a96e] bg-[#c9a96e]/5" : "border-border hover:border-[#c9a96e]/50"}
                  ${saving ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input {...faviconDropzone.getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium">גרור קובץ או לחץ לבחירה</p>
                  <p className="text-xs text-muted-foreground">SVG, PNG, WebP, JPG • מומלץ 512×512 לפחות</p>
                </div>
              </div>

              {/* Save Button */}
              {localFavicon && (
                <Button onClick={saveFavicon} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  שמור ופרסם פאביקון
                </Button>
              )}

              {/* Current active indicator (when no local pending) */}
              {!localFavicon && row?.favicon_original_url && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
                  <img
                    src={`${row.favicon_original_url}?v=${row.favicon_version}`}
                    alt="Current favicon"
                    className="w-8 h-8 rounded object-contain"
                  />
                  <span className="text-xs text-muted-foreground">פאביקון פעיל כרגע</span>
                </div>
              )}

              {/* Sizes Grid */}
              {hasAnySizeUrl && <SizesGrid items={gridItems} />}
            </div>

            <FaviconPreview src={previewSrc} />
          </div>
        </CardContent>
      </Card>

      {/* ─── Theme Color ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-[#c9a96e]" />
            צבע נושא (Theme Color)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            משפיע על צבע סרגל הכתובות בדפדפנים מובייל ובצבע ה-PWA.
          </p>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>בחר צבע</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-28 font-mono text-sm"
                  dir="ltr"
                  maxLength={7}
                />
              </div>
            </div>
            <Button
              onClick={() => themeColorMutation.mutate()}
              disabled={themeColorMutation.isPending}
              size="sm"
            >
              {themeColorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Check className="w-4 h-4 ml-1" />}
              שמור
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-64 h-6 rounded-t-lg" style={{ backgroundColor: themeColor }} />
            <span className="text-xs text-muted-foreground">סרגל כתובות במובייל</span>
          </div>
        </CardContent>
      </Card>

      {/* ─── OG Image ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image className="w-5 h-5 text-[#c9a96e]" />
            תמונת שיתוף חברתי (OG Image)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            תמונת ברירת מחדל שמוצגת כשהאתר משותף ברשתות חברתיות. גודל מומלץ: 1200×630 פיקסלים.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div
                {...ogDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                  ${ogDropzone.isDragActive ? "border-[#c9a96e] bg-[#c9a96e]/5" : "border-border hover:border-[#c9a96e]/50"}
                  ${ogUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input {...ogDropzone.getInputProps()} />
                {ogUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#c9a96e] mx-auto" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm">העלה תמונת OG (1200×630)</p>
                    <p className="text-xs text-muted-foreground">PNG, WebP, JPG</p>
                  </div>
                )}
              </div>

              {ogLocalPreview && (
                <Button onClick={saveOgImage} disabled={ogUploading} className="w-full">
                  {ogUploading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  שמור תמונת OG
                </Button>
              )}
            </div>

            {ogDisplayUrl && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">תצוגה מקדימה — שיתוף חברתי</p>
                <div className="rounded-xl overflow-hidden border aspect-[1200/630]">
                  <img src={ogDisplayUrl} alt="OG Preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebPresenceManager;
