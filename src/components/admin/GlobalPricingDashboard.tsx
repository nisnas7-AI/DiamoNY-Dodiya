import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, DollarSign, AlertTriangle, Check, Eye, Settings, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GoldPricingSettings {
  gold_14k_previous: number;
  gold_14k_multiplier: number;
  gold_14k_last_updated: string | null;
  gold_18k_previous: number;
  gold_18k_multiplier: number;
  gold_18k_last_updated: string | null;
  platinum_previous: number;
  platinum_multiplier: number;
  platinum_last_updated: string | null;
  spot_api_key: string | null;
  spot_api_provider: string;
}

interface ProductPreview {
  id: string;
  name: string;
  current_price: number;
  new_price: number;
  difference: number;
  gold_type: string;
}

interface SpotPrices {
  gold_14k_per_gram: number;
  gold_18k_per_gram: number;
  gold_24k_per_gram: number;
  platinum_per_gram: number;
  currency: string;
  timestamp: string;
  source: string;
}

export function GlobalPricingDashboard() {
  const queryClient = useQueryClient();
  
  // Metal prices state
  const [gold14kNew, setGold14kNew] = useState<string>('');
  const [gold18kNew, setGold18kNew] = useState<string>('');
  const [platinumNew, setPlatinumNew] = useState<string>('');
  
  // Multipliers state
  const [gold14kMultiplier, setGold14kMultiplier] = useState<number>(12);
  const [gold18kMultiplier, setGold18kMultiplier] = useState<number>(15);
  const [platinumMultiplier, setPlatinumMultiplier] = useState<number>(18);
  
  // API settings state
  const [apiKey, setApiKey] = useState<string>('');
  const [apiProvider, setApiProvider] = useState<string>('goldapi');
  
  // Preview dialog state
  const [showPreview, setShowPreview] = useState(false);
  const [previewProducts, setPreviewProducts] = useState<ProductPreview[]>([]);
  const [totalProductsToUpdate, setTotalProductsToUpdate] = useState(0);
  const [pendingUpdateType, setPendingUpdateType] = useState<'14k' | '18k' | 'platinum' | 'all' | null>(null);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['gold-pricing-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'gold_pricing')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as GoldPricingSettings;
    }
  });

  // Initialize state from settings
  useEffect(() => {
    if (settings) {
      setGold14kMultiplier(settings.gold_14k_multiplier || 12);
      setGold18kMultiplier(settings.gold_18k_multiplier || 15);
      setPlatinumMultiplier(settings.platinum_multiplier || 18);
      setApiKey(settings.spot_api_key || '');
      setApiProvider(settings.spot_api_provider || 'goldapi');
    }
  }, [settings]);

  // Calculate price increase percentage
  const calculateIncrease = (previous: number, newPrice: number): number => {
    if (!previous || previous === 0) return 0;
    return Math.round(((newPrice - previous) / previous) * 100);
  };

  // Check for significant price increase (20%+)
  const has14kWarning = gold14kNew && settings?.gold_14k_previous && calculateIncrease(settings.gold_14k_previous, parseFloat(gold14kNew)) >= 20;
  const has18kWarning = gold18kNew && settings?.gold_18k_previous && calculateIncrease(settings.gold_18k_previous, parseFloat(gold18kNew)) >= 20;
  const hasPlatinumWarning = platinumNew && settings?.platinum_previous && calculateIncrease(settings.platinum_previous, parseFloat(platinumNew)) >= 20;

  // Fetch spot prices mutation
  const fetchSpotPricesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-gold-prices', {
        body: { api_key: apiKey, provider: apiProvider }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as SpotPrices;
    },
    onSuccess: (data) => {
      setGold14kNew(data.gold_14k_per_gram.toString());
      setGold18kNew(data.gold_18k_per_gram.toString());
      if (data.platinum_per_gram > 0) {
        setPlatinumNew(data.platinum_per_gram.toString());
      }
      toast.success(`מחירים עודכנו מ-${data.source}`, {
        description: `זהב 14K: ₪${data.gold_14k_per_gram} | זהב 18K: ₪${data.gold_18k_per_gram}`
      });
    },
    onError: (error: Error) => {
      toast.error('שגיאה בשליפת מחירים', { description: error.message });
    }
  });

  // Save API settings mutation
  const saveApiSettingsMutation = useMutation({
    mutationFn: async () => {
      const updatedValue = {
        ...settings,
        spot_api_key: apiKey || null,
        spot_api_provider: apiProvider
      };
      
      const { error } = await supabase
        .from('site_settings')
        .update({ value: updatedValue, updated_at: new Date().toISOString() })
        .eq('key', 'gold_pricing');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gold-pricing-settings'] });
      toast.success('הגדרות API נשמרו');
    },
    onError: (error: Error) => {
      toast.error('שגיאה בשמירת הגדרות', { description: error.message });
    }
  });

  // Save multipliers mutation
  const saveMultipliersMutation = useMutation({
    mutationFn: async () => {
      const updatedValue = {
        ...settings,
        gold_14k_multiplier: gold14kMultiplier,
        gold_18k_multiplier: gold18kMultiplier,
        platinum_multiplier: platinumMultiplier
      };
      
      const { error } = await supabase
        .from('site_settings')
        .update({ value: updatedValue, updated_at: new Date().toISOString() })
        .eq('key', 'gold_pricing');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gold-pricing-settings'] });
      toast.success('מכפילים נשמרו בהצלחה');
    },
    onError: (error: Error) => {
      toast.error('שגיאה בשמירת מכפילים', { description: error.message });
    }
  });

  // Generate preview before update
  const generatePreview = async (updateType: '14k' | '18k' | 'platinum' | 'all') => {
    try {
      // Fetch products that are gold-linked and match the metal type
      let query = supabase
        .from('products')
        .select('id, name, price, gold_type, is_gold_linked')
        .eq('is_active', true)
        .eq('is_gold_linked', true);

      if (updateType !== 'all') {
        const goldTypeFilter = updateType === '14k' ? '14K' : updateType === '18k' ? '18K' : 'פלטינה';
        query = query.ilike('gold_type', `%${goldTypeFilter}%`);
      }

      const { data: products, error } = await query;
      if (error) throw error;

      if (!products || products.length === 0) {
        toast.error('לא נמצאו מוצרים מקושרים לעדכון');
        return;
      }

      // Calculate new prices for each product
      const previews: ProductPreview[] = [];
      
      for (const product of products) {
        if (!product.price) continue;
        
        let priceDiff = 0;
        const goldType = product.gold_type?.toLowerCase() || '';
        
        if (goldType.includes('14k') || goldType.includes('14 קראט')) {
          if (gold14kNew && settings?.gold_14k_previous) {
            priceDiff = (parseFloat(gold14kNew) - settings.gold_14k_previous) * gold14kMultiplier;
          }
        } else if (goldType.includes('18k') || goldType.includes('18 קראט')) {
          if (gold18kNew && settings?.gold_18k_previous) {
            priceDiff = (parseFloat(gold18kNew) - settings.gold_18k_previous) * gold18kMultiplier;
          }
        } else if (goldType.includes('פלטינה') || goldType.includes('platinum')) {
          if (platinumNew && settings?.platinum_previous) {
            priceDiff = (parseFloat(platinumNew) - settings.platinum_previous) * platinumMultiplier;
          }
        }
        
        if (priceDiff !== 0) {
          previews.push({
            id: product.id,
            name: product.name,
            current_price: product.price,
            new_price: Math.round(product.price + priceDiff),
            difference: Math.round(priceDiff),
            gold_type: product.gold_type || 'לא צוין'
          });
        }
      }

      if (previews.length === 0) {
        toast.error('אין מוצרים לעדכון עם ההגדרות הנוכחיות');
        return;
      }

      // Sort by price and get min, median, max
      const sorted = [...previews].sort((a, b) => a.current_price - b.current_price);
      const sampleProducts = [
        sorted[0], // Cheapest
        sorted[Math.floor(sorted.length / 2)], // Median
        sorted[sorted.length - 1] // Most expensive
      ].filter(Boolean);

      setPreviewProducts(sampleProducts);
      setTotalProductsToUpdate(previews.length);
      setPendingUpdateType(updateType);
      setShowPreview(true);

    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('שגיאה ביצירת תצוגה מקדימה');
    }
  };

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async () => {
      if (!pendingUpdateType) throw new Error('No update type selected');

      // Fetch products to update
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_gold_linked', true);

      if (pendingUpdateType !== 'all') {
        const goldTypeFilter = pendingUpdateType === '14k' ? '14K' : pendingUpdateType === '18k' ? '18K' : 'פלטינה';
        query = query.ilike('gold_type', `%${goldTypeFilter}%`);
      }

      const { data: products, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let updatedCount = 0;
      const now = new Date().toISOString();

      for (const product of products || []) {
        if (!product.price) continue;
        
        let priceDiff = 0;
        const goldType = product.gold_type?.toLowerCase() || '';
        
        if (goldType.includes('14k') || goldType.includes('14 קראט')) {
          if (gold14kNew && settings?.gold_14k_previous) {
            priceDiff = (parseFloat(gold14kNew) - settings.gold_14k_previous) * gold14kMultiplier;
          }
        } else if (goldType.includes('18k') || goldType.includes('18 קראט')) {
          if (gold18kNew && settings?.gold_18k_previous) {
            priceDiff = (parseFloat(gold18kNew) - settings.gold_18k_previous) * gold18kMultiplier;
          }
        } else if (goldType.includes('פלטינה') || goldType.includes('platinum')) {
          if (platinumNew && settings?.platinum_previous) {
            priceDiff = (parseFloat(platinumNew) - settings.platinum_previous) * platinumMultiplier;
          }
        }

        if (priceDiff === 0) continue;

        const updates: Record<string, number> = {};
        
        if (product.price) updates.price = Math.round(product.price + priceDiff);
        if (product.sale_price) updates.sale_price = Math.round(product.sale_price + priceDiff);
        if (product.original_price) updates.original_price = Math.round(product.original_price + priceDiff);
        if (product.price_from) updates.price_from = Math.round(product.price_from + priceDiff);
        if (product.price_to) updates.price_to = Math.round(product.price_to + priceDiff);

        const { error: updateError } = await supabase
          .from('products')
          .update(updates)
          .eq('id', product.id);

        if (!updateError) updatedCount++;
      }

      // Update the reference prices in settings
      const updatedSettings = {
        gold_14k_previous: gold14kNew && (pendingUpdateType === '14k' || pendingUpdateType === 'all') 
          ? parseFloat(gold14kNew) : (settings?.gold_14k_previous || 0),
        gold_14k_multiplier: settings?.gold_14k_multiplier || 12,
        gold_14k_last_updated: gold14kNew && (pendingUpdateType === '14k' || pendingUpdateType === 'all') 
          ? now : (settings?.gold_14k_last_updated || null),
        gold_18k_previous: gold18kNew && (pendingUpdateType === '18k' || pendingUpdateType === 'all') 
          ? parseFloat(gold18kNew) : (settings?.gold_18k_previous || 0),
        gold_18k_multiplier: settings?.gold_18k_multiplier || 15,
        gold_18k_last_updated: gold18kNew && (pendingUpdateType === '18k' || pendingUpdateType === 'all') 
          ? now : (settings?.gold_18k_last_updated || null),
        platinum_previous: platinumNew && (pendingUpdateType === 'platinum' || pendingUpdateType === 'all') 
          ? parseFloat(platinumNew) : (settings?.platinum_previous || 0),
        platinum_multiplier: settings?.platinum_multiplier || 18,
        platinum_last_updated: platinumNew && (pendingUpdateType === 'platinum' || pendingUpdateType === 'all') 
          ? now : (settings?.platinum_last_updated || null),
        spot_api_key: settings?.spot_api_key || null,
        spot_api_provider: settings?.spot_api_provider || 'goldapi'
      };

      const { error: settingsError } = await supabase
        .from('site_settings')
        .update({ value: updatedSettings, updated_at: now })
        .eq('key', 'gold_pricing');

      if (settingsError) throw settingsError;

      return updatedCount;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['gold-pricing-settings'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowPreview(false);
      setGold14kNew('');
      setGold18kNew('');
      setPlatinumNew('');
      toast.success(`עודכנו ${count} מוצרים בהצלחה!`);
    },
    onError: (error: Error) => {
      toast.error('שגיאה בעדכון מחירים', { description: error.message });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'לא עודכן';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: he });
    } catch {
      return 'לא עודכן';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ניהול מחירי מתכות יקרות</h2>
          <p className="text-muted-foreground">עדכון גלובלי של מחירי מוצרים לפי מחיר המתכת</p>
        </div>
      </div>

      {/* Warning Alerts */}
      {(has14kWarning || has18kWarning || hasPlatinumWarning) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>אזהרה! זינוק משמעותי במחיר</AlertTitle>
          <AlertDescription>
            {has14kWarning && <div>זהב 14K: עלייה של {calculateIncrease(settings?.gold_14k_previous || 0, parseFloat(gold14kNew))}%</div>}
            {has18kWarning && <div>זהב 18K: עלייה של {calculateIncrease(settings?.gold_18k_previous || 0, parseFloat(gold18kNew))}%</div>}
            {hasPlatinumWarning && <div>פלטינה: עלייה של {calculateIncrease(settings?.platinum_previous || 0, parseFloat(platinumNew))}%</div>}
            <strong className="block mt-2">וודא שהמכפילים עדיין רלוונטיים!</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Metal Price Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Gold 14K Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-yellow-500">🥇</span> זהב 14K
              </CardTitle>
              <Badge variant="outline">58.5% טהור</Badge>
            </div>
            <CardDescription>מכפיל: {gold14kMultiplier}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-xs text-muted-foreground">מחיר קודם לגרם</Label>
              <div className="text-xl font-bold">₪{settings?.gold_14k_previous || 0}</div>
              <p className="text-xs text-muted-foreground">{formatDate(settings?.gold_14k_last_updated || null)}</p>
            </div>
            <div>
              <Label>מחיר חדש לגרם</Label>
              <Input
                type="number"
                value={gold14kNew}
                onChange={(e) => setGold14kNew(e.target.value)}
                placeholder="הזן מחיר חדש..."
                className={has14kWarning ? 'border-destructive' : ''}
              />
              {gold14kNew && settings?.gold_14k_previous !== undefined && (
                <div className={`text-sm mt-1 flex items-center gap-1 ${parseFloat(gold14kNew) > settings.gold_14k_previous ? 'text-red-500' : 'text-green-500'}`}>
                  {parseFloat(gold14kNew) > settings.gold_14k_previous ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {calculateIncrease(settings.gold_14k_previous, parseFloat(gold14kNew))}%
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => generatePreview('14k')}
              disabled={!gold14kNew || bulkUpdateMutation.isPending}
            >
              <Eye className="h-4 w-4 ml-2" />
              תצוגה מקדימה ועדכון
            </Button>
          </CardContent>
        </Card>

        {/* Gold 18K Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-yellow-400">🥇</span> זהב 18K
              </CardTitle>
              <Badge variant="outline">75% טהור</Badge>
            </div>
            <CardDescription>מכפיל: {gold18kMultiplier}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-xs text-muted-foreground">מחיר קודם לגרם</Label>
              <div className="text-xl font-bold">₪{settings?.gold_18k_previous || 0}</div>
              <p className="text-xs text-muted-foreground">{formatDate(settings?.gold_18k_last_updated || null)}</p>
            </div>
            <div>
              <Label>מחיר חדש לגרם</Label>
              <Input
                type="number"
                value={gold18kNew}
                onChange={(e) => setGold18kNew(e.target.value)}
                placeholder="הזן מחיר חדש..."
                className={has18kWarning ? 'border-destructive' : ''}
              />
              {gold18kNew && settings?.gold_18k_previous !== undefined && (
                <div className={`text-sm mt-1 flex items-center gap-1 ${parseFloat(gold18kNew) > settings.gold_18k_previous ? 'text-red-500' : 'text-green-500'}`}>
                  {parseFloat(gold18kNew) > settings.gold_18k_previous ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {calculateIncrease(settings.gold_18k_previous, parseFloat(gold18kNew))}%
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => generatePreview('18k')}
              disabled={!gold18kNew || bulkUpdateMutation.isPending}
            >
              <Eye className="h-4 w-4 ml-2" />
              תצוגה מקדימה ועדכון
            </Button>
          </CardContent>
        </Card>

        {/* Platinum Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-gray-400">⬜</span> פלטינה
              </CardTitle>
              <Badge variant="outline">95% טהור</Badge>
            </div>
            <CardDescription>מכפיל: {platinumMultiplier}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-xs text-muted-foreground">מחיר קודם לגרם</Label>
              <div className="text-xl font-bold">₪{settings?.platinum_previous || 0}</div>
              <p className="text-xs text-muted-foreground">{formatDate(settings?.platinum_last_updated || null)}</p>
            </div>
            <div>
              <Label>מחיר חדש לגרם</Label>
              <Input
                type="number"
                value={platinumNew}
                onChange={(e) => setPlatinumNew(e.target.value)}
                placeholder="הזן מחיר חדש..."
                className={hasPlatinumWarning ? 'border-destructive' : ''}
              />
              {platinumNew && settings?.platinum_previous !== undefined && (
                <div className={`text-sm mt-1 flex items-center gap-1 ${parseFloat(platinumNew) > settings.platinum_previous ? 'text-red-500' : 'text-green-500'}`}>
                  {parseFloat(platinumNew) > settings.platinum_previous ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {calculateIncrease(settings.platinum_previous, parseFloat(platinumNew))}%
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => generatePreview('platinum')}
              disabled={!platinumNew || bulkUpdateMutation.isPending}
            >
              <Eye className="h-4 w-4 ml-2" />
              תצוגה מקדימה ועדכון
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Update All Button */}
      {(gold14kNew || gold18kNew || platinumNew) && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => generatePreview('all')}
              disabled={bulkUpdateMutation.isPending}
            >
              {bulkUpdateMutation.isPending ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4 ml-2" />
              )}
              עדכן את כל המתכות
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Settings Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              הגדרות API - Spot Price
            </CardTitle>
            <CardDescription>חיבור לשירות מחירי זהב בזמן אמת</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>ספק שירות</Label>
              <Select value={apiProvider} onValueChange={setApiProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goldapi">GoldAPI.io</SelectItem>
                  <SelectItem value="metals_dev">Metals.dev</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>מפתח API</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="הזן מפתח API..."
              />
              <p className="text-xs text-muted-foreground mt-1">השאר ריק לנתוני דמו</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => saveApiSettingsMutation.mutate()}
                disabled={saveApiSettingsMutation.isPending}
              >
                {saveApiSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span className="mr-2">שמור</span>
              </Button>
              <Button 
                onClick={() => fetchSpotPricesMutation.mutate()}
                disabled={fetchSpotPricesMutation.isPending}
              >
                {fetchSpotPricesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="mr-2">משוך מחירים</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Multipliers Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              מכפילי מחיר
            </CardTitle>
            <CardDescription>קבע את המכפיל לכל סוג מתכת</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>זהב 14K</Label>
                <Input
                  type="number"
                  value={gold14kMultiplier}
                  onChange={(e) => setGold14kMultiplier(parseFloat(e.target.value) || 12)}
                />
              </div>
              <div>
                <Label>זהב 18K</Label>
                <Input
                  type="number"
                  value={gold18kMultiplier}
                  onChange={(e) => setGold18kMultiplier(parseFloat(e.target.value) || 15)}
                />
              </div>
              <div>
                <Label>פלטינה</Label>
                <Input
                  type="number"
                  value={platinumMultiplier}
                  onChange={(e) => setPlatinumMultiplier(parseFloat(e.target.value) || 18)}
                />
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => saveMultipliersMutation.mutate()}
              disabled={saveMultipliersMutation.isPending}
            >
              {saveMultipliersMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span className="mr-2">שמור מכפילים</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              תצוגה מקדימה - דוגמאות מחירים
            </DialogTitle>
            <DialogDescription>
              בדוק את השינויים לפני העדכון
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {previewProducts.map((product, index) => (
              <div key={product.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {index === 0 ? 'הזול ביותר' : index === 1 ? 'ממוצע' : 'היקר ביותר'}
                  </Badge>
                  <Badge variant="secondary">{product.gold_type}</Badge>
                </div>
                <h4 className="font-medium">{product.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-muted-foreground">₪{product.current_price.toLocaleString()}</span>
                  <span>→</span>
                  <span className="font-bold">₪{product.new_price.toLocaleString()}</span>
                  <Badge className={product.difference > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {product.difference > 0 ? '+' : ''}₪{product.difference.toLocaleString()}
                  </Badge>
                </div>
              </div>
            ))}

            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">סה"כ מוצרים שיעודכנו</p>
              <p className="text-2xl font-bold">{totalProductsToUpdate}</p>
              <p className="text-xs text-muted-foreground">(רק מוצרים עם is_gold_linked מסומן)</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              ביטול
            </Button>
            <Button 
              onClick={() => bulkUpdateMutation.mutate()}
              disabled={bulkUpdateMutation.isPending}
            >
              {bulkUpdateMutation.isPending ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 ml-2" />
              )}
              אישור ועדכון המחירים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GlobalPricingDashboard;
