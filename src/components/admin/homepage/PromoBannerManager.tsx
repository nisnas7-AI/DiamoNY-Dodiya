import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Star, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  banner_image_url: string | null;
  banner_text: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  show_on_homepage: boolean;
  slug: string;
}

const PromoBannerManager = () => {
  const queryClient = useQueryClient();

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["promotions-for-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Promotion[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, show_on_homepage }: { id: string; show_on_homepage: boolean }) => {
      // First, remove all other promotions from homepage
      if (show_on_homepage) {
        await supabase
          .from("promotions")
          .update({ show_on_homepage: false })
          .neq("id", id);
      }
      
      const { error } = await supabase
        .from("promotions")
        .update({ show_on_homepage })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-for-banner"] });
      queryClient.invalidateQueries({ queryKey: ["active-promo-banner"] });
      toast.success("הבאנר הפרסומי עודכן");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הבאנר");
    },
  });

  const activePromo = promotions?.find(p => p.show_on_homepage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            באנר פרסומי עליון
          </CardTitle>
          <CardDescription>
            בחר מבצע שיוצג בראש עמוד הבית כבאנר בולט. רק מבצע אחד יכול להיות מוצג בכל רגע נתון.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePromo ? (
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
              {activePromo.banner_image_url && (
                <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={activePromo.banner_image_url}
                    alt={activePromo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-medium">{activePromo.title}</h4>
                <p className="text-sm text-muted-foreground">{activePromo.description}</p>
                {activePromo.end_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    עד {format(new Date(activePromo.end_date), "dd בMMMM yyyy", { locale: he })}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateMutation.mutate({ id: activePromo.id, show_on_homepage: false })}
              >
                הסר מעמוד הבית
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground p-4 bg-background rounded-lg border border-dashed">
              <AlertTriangle className="h-5 w-5" />
              <span>לא נבחר מבצע להצגה בראש עמוד הבית</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>מבצעים פעילים</CardTitle>
          <CardDescription>
            בחר אחד מהמבצעים הפעילים להצגה בראש עמוד הבית
          </CardDescription>
        </CardHeader>
        <CardContent>
          {promotions?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              אין מבצעים פעילים. צור מבצע חדש בלשונית "מבצעים".
            </p>
          ) : (
            <div className="space-y-3">
              {promotions?.map((promo) => (
                <div
                  key={promo.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    promo.show_on_homepage ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  {promo.banner_image_url && (
                    <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={promo.banner_image_url}
                        alt={promo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{promo.title}</h4>
                    {promo.end_date && (
                      <p className="text-xs text-muted-foreground">
                        עד {format(new Date(promo.end_date), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`show-${promo.id}`} className="text-xs text-muted-foreground">
                      הצג בראש הדף
                    </Label>
                    <Switch
                      id={`show-${promo.id}`}
                      checked={promo.show_on_homepage}
                      onCheckedChange={(checked) => 
                        updateMutation.mutate({ id: promo.id, show_on_homepage: checked })
                      }
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoBannerManager;
