import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FlaskConical } from "lucide-react";
import { toast } from "sonner";

interface ProductAeoSpecsProps {
  productId: string | null;
}

interface AeoSpecs {
  metal_type: string;
  gemstone_type: string;
  total_carat_weight: string;
  diamond_color: string;
  diamond_clarity: string;
  diamond_cut: string;
  certification_body: string;
}

const EMPTY_SPECS: AeoSpecs = {
  metal_type: "",
  gemstone_type: "",
  total_carat_weight: "",
  diamond_color: "",
  diamond_clarity: "",
  diamond_cut: "",
  certification_body: "",
};

const ProductAeoSpecs = ({ productId }: ProductAeoSpecsProps) => {
  const [specs, setSpecs] = useState<AeoSpecs>(EMPTY_SPECS);
  const queryClient = useQueryClient();

  const { data: existingSpecs, isLoading } = useQuery({
    queryKey: ["product-aeo-specs", productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from("product_aeo_specs")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  useEffect(() => {
    if (existingSpecs) {
      setSpecs({
        metal_type: existingSpecs.metal_type || "",
        gemstone_type: existingSpecs.gemstone_type || "",
        total_carat_weight: existingSpecs.total_carat_weight?.toString() || "",
        diamond_color: existingSpecs.diamond_color || "",
        diamond_clarity: existingSpecs.diamond_clarity || "",
        diamond_cut: existingSpecs.diamond_cut || "",
        certification_body: existingSpecs.certification_body || "",
      });
    } else {
      setSpecs(EMPTY_SPECS);
    }
  }, [existingSpecs]);

  const saveSpecs = useMutation({
    mutationFn: async () => {
      if (!productId) return;

      const payload = {
        product_id: productId,
        metal_type: specs.metal_type || null,
        gemstone_type: specs.gemstone_type || null,
        total_carat_weight: specs.total_carat_weight ? parseFloat(specs.total_carat_weight) : null,
        diamond_color: specs.diamond_color || null,
        diamond_clarity: specs.diamond_clarity || null,
        diamond_cut: specs.diamond_cut || null,
        certification_body: specs.certification_body || null,
      };

      const { error } = await supabase
        .from("product_aeo_specs")
        .upsert(payload, { onConflict: "product_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-aeo-specs", productId] });
      toast.success("מפרט טכני AEO נשמר");
    },
    onError: (err: any) => {
      toast.error(err.message || "שגיאה בשמירת מפרט");
    },
  });

  // Auto-save when productId exists and user changes a field
  const updateField = (field: keyof AeoSpecs, value: string) => {
    setSpecs(prev => ({ ...prev, [field]: value }));
  };

  // Expose save for parent form
  useEffect(() => {
    if (!productId) return;
    // Save specs when component unmounts or productId changes (form submit triggers dialog close)
    return () => {
      // Only save if any field has data
      const hasData = Object.values(specs).some(v => v.trim() !== "");
      if (hasData && productId) {
        // Fire and forget
        const payload = {
          product_id: productId,
          metal_type: specs.metal_type || null,
          gemstone_type: specs.gemstone_type || null,
          total_carat_weight: specs.total_carat_weight ? parseFloat(specs.total_carat_weight) : null,
          diamond_color: specs.diamond_color || null,
          diamond_clarity: specs.diamond_clarity || null,
          diamond_cut: specs.diamond_cut || null,
          certification_body: specs.certification_body || null,
        };
        supabase.from("product_aeo_specs").upsert(payload, { onConflict: "product_id" }).then();
      }
    };
  }, [productId, specs]);

  if (!productId) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-medium text-muted-foreground">מפרט טכני (AEO)</Label>
        </div>
        <p className="text-sm text-muted-foreground">שמור את המוצר קודם כדי להוסיף מפרט טכני.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className="h-5 w-5 text-blue-600" />
        <Label className="text-base font-medium">מפרט טכני (AEO)</Label>
        <span className="text-xs text-muted-foreground bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
          מוזרק ל-JSON-LD עבור Google & AI
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>סוג מתכת</Label>
          <Select value={specs.metal_type} onValueChange={(v) => updateField("metal_type", v)}>
            <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="14K Yellow Gold">14K Yellow Gold</SelectItem>
              <SelectItem value="14K White Gold">14K White Gold</SelectItem>
              <SelectItem value="14K Rose Gold">14K Rose Gold</SelectItem>
              <SelectItem value="18K Yellow Gold">18K Yellow Gold</SelectItem>
              <SelectItem value="18K White Gold">18K White Gold</SelectItem>
              <SelectItem value="18K Rose Gold">18K Rose Gold</SelectItem>
              <SelectItem value="Platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>סוג אבן חן</Label>
          <Input
            value={specs.gemstone_type}
            onChange={(e) => updateField("gemstone_type", e.target.value)}
            placeholder="Natural Diamond"
          />
        </div>

        <div className="space-y-2">
          <Label>משקל קראט כולל</Label>
          <Input
            type="number"
            step="0.01"
            value={specs.total_carat_weight}
            onChange={(e) => updateField("total_carat_weight", e.target.value)}
            placeholder="0.50"
          />
        </div>

        <div className="space-y-2">
          <Label>צבע יהלום</Label>
          <Select value={specs.diamond_color} onValueChange={(v) => updateField("diamond_color", v)}>
            <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
            <SelectContent>
              {["D", "E", "F", "G", "H", "I", "J", "K"].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>ניקיון יהלום</Label>
          <Select value={specs.diamond_clarity} onValueChange={(v) => updateField("diamond_clarity", v)}>
            <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
            <SelectContent>
              {["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2"].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>חיתוך יהלום</Label>
          <Select value={specs.diamond_cut} onValueChange={(v) => updateField("diamond_cut", v)}>
            <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
            <SelectContent>
              {["Excellent", "Very Good", "Good", "Fair"].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label>גוף תעודה</Label>
          <Input
            value={specs.certification_body}
            onChange={(e) => updateField("certification_body", e.target.value)}
            placeholder="GIA / IGI / HRD..."
            list="certification-suggestions"
          />
          <datalist id="certification-suggestions">
            <option value="GIA" />
            <option value="IGI" />
            <option value="HRD" />
            <option value="EGL" />
            <option value="AGS" />
          </datalist>
        </div>
      </div>
    </div>
  );
};

export default ProductAeoSpecs;
