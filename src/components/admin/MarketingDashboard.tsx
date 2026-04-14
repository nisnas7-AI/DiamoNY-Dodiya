import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  MessageCircle,
  ShieldCheck,
  Eye,
  TrendingUp,
  ShoppingBag,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  Globe,
  Wifi,
  QrCode,
  Link2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const GOLD = "#D4AF37";
const GOLD_DIM = "#856404";
const DARK_BG = "#0A0A0A";
const CARD_BG = "#121212";
const GRID_COLOR = "rgba(255,255,255,0.06)";

const MarketingDashboard = () => {
  // ── WhatsApp count ──
  const { data: whatsappCount, isLoading: isLoadingWA } = useQuery({
    queryKey: ["analytics-whatsapp-count"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "whatsapp_click");
      if (error) throw error;
      return count || 0;
    },
  });

  // ── Category stats ──
  const { data: categoryStats, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["analytics-category-views"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("analytics_events")
        .select("event_value")
        .eq("event_type", "category_view");
      if (error) throw error;

      const mapping: Record<string, string> = {
        rings: "טבעות",
        earrings: "עגילים",
        pendants: "תליונים",
        bracelets: "צמידים",
      };
      const counts: Record<string, number> = {};
      for (const name of Object.values(mapping)) counts[name] = 0;

      (data as any[])?.forEach((row: any) => {
        const slug = (row.event_value || "").toLowerCase();
        for (const [key, name] of Object.entries(mapping)) {
          if (slug === key || slug.includes(key)) {
            counts[name]++;
            break;
          }
        }
      });

      return Object.entries(counts)
        .map(([name, views]) => ({ name, views }))
        .sort((a, b) => b.views - a.views);
    },
  });

  const { data: totalCategoryViews } = useQuery({
    queryKey: ["analytics-total-category-views"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "category_view");
      if (error) throw error;
      return count || 0;
    },
  });

  // ── Time-series (last 30 days) — server-side aggregation via RPC ──
  // Payload: max 30 rows { event_date, event_count }. No client-side looping.
  const { data: timeSeriesData, isLoading: isLoadingTimeSeries } = useQuery({
    queryKey: ["analytics-time-series-v2"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_analytics_time_series",
        { days_back: 30 },
      );
      if (error) throw error;
      return (data as { event_date: string; event_count: number }[]).map((row) => ({
        date: row.event_date.slice(5), // MM-DD display label
        events: Number(row.event_count),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Device distribution — server-side GROUP BY via RPC ──
  // Payload: 2-4 rows { device_type, device_count }. Zero client-side reducing.
  const { data: deviceData, isLoading: isLoadingDevices } = useQuery({
    queryKey: ["analytics-device-distribution-v2"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "get_analytics_device_distribution",
      );
      if (error) throw error;
      return (data as { device_type: string; device_count: number }[]).map((row) => ({
        name: row.device_type,
        value: Number(row.device_count),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Average dwell time ──
  const { data: avgDwell } = useQuery({
    queryKey: ["analytics-avg-dwell"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("analytics_events")
        .select("duration_seconds")
        .not("duration_seconds", "is", null)
        .gt("duration_seconds", 0);
      if (error) throw error;
      if (!data?.length) return 0;
      const sum = (data as any[]).reduce((acc: number, r: any) => acc + (r.duration_seconds || 0), 0);
      return Math.round(sum / data.length);
    },
  });

  // ── Traffic source breakdown ──
  const { data: sourceStats, isLoading: isLoadingSources } = useQuery({
    queryKey: ["analytics-traffic-sources"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("analytics_events")
        .select("event_value")
        .eq("event_type", "traffic_source");
      if (error) throw error;
      const counts: Record<string, number> = { nfc: 0, qr: 0, direct: 0 };
      (data as any[])?.forEach((row: any) => {
        const val = (row.event_value || "direct").toLowerCase();
        if (val === "nfc") counts.nfc++;
        else if (val === "qr") counts.qr++;
        else counts.direct++;
      });
      return counts;
    },
  });

  const totalSources = sourceStats ? sourceStats.nfc + sourceStats.qr + sourceStats.direct : 0;

  const totalViews = totalCategoryViews ?? 0;
  const topCategory = categoryStats?.[0];
  const DEVICE_COLORS = [GOLD, "#8B7355", "#C0A36A"];

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="המרות וואטסאפ"
          icon={<MessageCircle className="h-5 w-5 text-[#25D366]" />}
          isLoading={isLoadingWA}
          value={whatsappCount}
          subtitle="לחיצות על כפתור וואטסאפ"
        />
        <KPICard
          title="קטגוריה מובילה"
          icon={<ShoppingBag className="h-5 w-5 text-[#D4AF37]" />}
          isLoading={isLoadingCategories}
          value={topCategory?.name || "—"}
          subtitle={`${topCategory?.views || 0} צפיות`}
        />
        <KPICard
          title="צפיות בקטלוג"
          icon={<Eye className="h-5 w-5 text-[#D4AF37]" />}
          value={totalViews.toLocaleString()}
          subtitle="סה״כ צפיות בקטגוריות"
        />
        <KPICard
          title="זמן שהייה ממוצע"
          icon={<Clock className="h-5 w-5 text-[#D4AF37]" />}
          value={avgDwell ? `${avgDwell}s` : "—"}
          subtitle="ממוצע שניות בעמוד מוצר"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart — 2/3 width */}
        <Card className="lg:col-span-2 bg-[#121212] border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="text-[#D4AF37] flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              אירועים ב-30 יום אחרונים
            </CardTitle>
            <CardDescription className="text-gray-400">
              היסטוריית צפיות ואינטראקציות
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTimeSeries ? (
              <Skeleton className="h-[260px] w-full bg-gray-800" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GOLD} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis
                    dataKey="date"
                    stroke="#555"
                    tick={{ fill: "#888", fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#555" tick={{ fill: "#888", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1A1A",
                      border: `1px solid ${GOLD}40`,
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: GOLD }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke={GOLD}
                    strokeWidth={2}
                    fill="url(#goldGrad)"
                    name="אירועים"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart — 1/3 width */}
        <Card className="bg-[#121212] border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="text-[#D4AF37] flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5" />
              התפלגות מכשירים
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {isLoadingDevices ? (
              <Skeleton className="h-[200px] w-[200px] rounded-full bg-gray-800" />
            ) : deviceData && deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {deviceData.map((_, index) => (
                      <Cell key={index} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value: string) => (
                      <span className="text-gray-300 text-xs">{value}</span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1A1A",
                      border: `1px solid ${GOLD}40`,
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 text-sm text-center py-8">
                <Monitor className="h-8 w-8 mx-auto mb-2 opacity-40" />
                אין נתוני מכשירים עדיין
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Category Performance Breakdown ── */}
      <Card className="bg-[#121212] border-[#D4AF37]/20">
        <CardHeader>
          <CardTitle className="text-[#D4AF37] flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ביצועי קטגוריות
          </CardTitle>
          <CardDescription className="text-gray-400">
            התפלגות צפיות לפי קטגוריה (נתונים חיים)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCategories ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-full bg-gray-700" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {categoryStats?.map((category, index) => {
                const percentage = totalViews > 0 ? (category.views / totalViews) * 100 : 0;
                return (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {index === 0 && <TrendingUp className="h-4 w-4 text-[#D4AF37]" />}
                        <span className="text-white font-medium">{category.name}</span>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {category.views} צפיות ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#856404] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Collection Views Table ── */}
      <Card className="bg-[#121212] border-[#D4AF37]/20">
        <CardHeader>
          <CardTitle className="text-[#D4AF37] flex items-center gap-2 text-base">
            <Eye className="h-5 w-5" />
            כניסה לקולקציה
          </CardTitle>
          <CardDescription className="text-gray-400">
            צפיות לפי קטגוריה
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCategories ? (
            <Skeleton className="h-32 w-full bg-gray-800" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D4AF37]/10">
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">קולקציה</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">צפיות</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">אחוז</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStats?.map((cat) => {
                    const pct = totalViews > 0 ? ((cat.views / totalViews) * 100).toFixed(1) : "0";
                    return (
                      <tr key={cat.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{cat.name}</td>
                        <td className="py-3 px-4 text-gray-300">{cat.views.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-400">{pct}%</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-[#D4AF37]/20">
                    <td className="py-3 px-4 text-[#D4AF37] font-bold">סה״כ</td>
                    <td className="py-3 px-4 text-[#D4AF37] font-bold">{totalViews.toLocaleString()}</td>
                    <td className="py-3 px-4 text-[#D4AF37] font-bold">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Traffic Source Breakdown ── */}
      <Card className="bg-[#121212] border-[#D4AF37]/20">
        <CardHeader>
          <CardTitle className="text-[#D4AF37] flex items-center gap-2 text-base">
            <Globe className="h-5 w-5" />
            מקורות תנועה
          </CardTitle>
          <CardDescription className="text-gray-400">
            התפלגות לפי NFC, QR וגישה ישירה
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSources ? (
            <Skeleton className="h-24 w-full bg-gray-800" />
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <SourceCard
                icon={<Wifi className="h-5 w-5" />}
                label="NFC"
                count={sourceStats?.nfc || 0}
                total={totalSources}
                color="#D4AF37"
              />
              <SourceCard
                icon={<QrCode className="h-5 w-5" />}
                label="QR Code"
                count={sourceStats?.qr || 0}
                total={totalSources}
                color="#8B7355"
              />
              <SourceCard
                icon={<Link2 className="h-5 w-5" />}
                label="ישיר"
                count={sourceStats?.direct || 0}
                total={totalSources}
                color="#C0A36A"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Security status (kept) ── */}
      <Card className="bg-[#121212] border-[#D4AF37]/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-[#D4AF37]">הגנת reCAPTCHA</CardTitle>
          <ShieldCheck className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">פעיל</div>
          <p className="text-xs text-gray-400 mt-1">v3 עם סף ציון 0.5</p>
          <p className="text-xs text-green-500 mt-2">חסימת בוטים מופעלת</p>
        </CardContent>
      </Card>
    </div>
  );
};

/* ── Reusable KPI Card ── */
function KPICard({
  title,
  icon,
  value,
  subtitle,
  isLoading,
}: {
  title: string;
  icon: React.ReactNode;
  value: string | number | undefined;
  subtitle: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="bg-[#121212] border-[#D4AF37]/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[#D4AF37]">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16 bg-gray-700" />
        ) : (
          <div className="text-3xl font-bold text-white">{value}</div>
        )}
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}


/* ── Source Card for traffic breakdown ── */
function SourceCard({
  icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
  return (
    <div className="bg-black/30 rounded-xl p-4 border border-white/5 text-center space-y-2">
      <div className="mx-auto w-fit" style={{ color }}>{icon}</div>
      <div className="text-2xl font-bold text-white">{count}</div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden mt-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-xs text-gray-500">{pct}%</div>
    </div>
  );
}

export default MarketingDashboard;
