import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Mail, MessageCircle, Sparkles, CalendarHeart, Gift, Copy } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, addDays } from "date-fns";
import { he } from "date-fns/locale";

interface HotLead {
  id: string;
  event_name: string;
  event_date: string;
  days_remaining: number;
  member: {
    id: string;
    full_name: string;
    credit_balance: number;
    phone_key: string;
    email: string | null;
  };
}

function formatPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("05") && digits.length === 10) return "972" + digits.slice(1);
  if (digits.startsWith("972") && digits.length === 12) return digits;
  if (digits.startsWith("+972")) return digits.slice(1);
  return null;
}

const HotLeadsPanel = () => {
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data: hotLeads, isLoading } = useQuery({
    queryKey: ["hot-leads"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: events, error } = await supabase
        .from("vip_special_dates")
        .select(`
          id, event_name, event_date, member_id,
          vip_members!inner ( id, full_name, credit_balance, phone_key, email )
        `)
        .order("event_date", { ascending: true });

      if (error) throw error;

      const leads: HotLead[] = [];
      events?.forEach((event: any) => {
        // Parse date without timezone shift
        const [year, month, day] = event.event_date.split("-").map(Number);
        const currentYear = today.getFullYear();

        // Normalize to current year anniversary
        let nextAnniversary = new Date(currentYear, month - 1, day);
        nextAnniversary.setHours(0, 0, 0, 0);

        // If already passed this year, use next year
        if (nextAnniversary < today) {
          nextAnniversary = new Date(currentYear + 1, month - 1, day);
          nextAnniversary.setHours(0, 0, 0, 0);
        }

        const daysRemaining = differenceInDays(nextAnniversary, today);

        if (daysRemaining >= 0 && daysRemaining <= 30) {
          leads.push({
            id: event.id,
            event_name: event.event_name,
            event_date: event.event_date,
            days_remaining: daysRemaining,
            member: {
              id: event.vip_members.id,
              full_name: event.vip_members.full_name,
              credit_balance: Number(event.vip_members.credit_balance),
              phone_key: event.vip_members.phone_key,
              email: event.vip_members.email,
            },
          });
        }
      });

      return leads.sort((a, b) => a.days_remaining - b.days_remaining);
    },
    refetchInterval: 60000,
  });

  const handleSendEmail = async (lead: HotLead, type: "t21" | "t14") => {
    if (!lead.member.email) {
      toast.warning(`ללקוח ${lead.member.full_name} לא מוגדר אימייל`);
      return;
    }

    const btnKey = `${lead.id}-${type}`;
    setSendingId(btnKey);

    try {
      const { data, error } = await supabase.functions.invoke("send-vip-lifecycle-email", {
        body: {
          customerEmail: lead.member.email,
          customerName: lead.member.full_name,
          eventName: lead.event_name,
          storeCredit: lead.member.credit_balance,
          templateType: type,
        },
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || "שליחה נכשלה");

      toast.success(`📧 אימייל ${type.toUpperCase()} נשלח ל-${lead.member.full_name}`);
    } catch (err: any) {
      console.error("[VIP Lifecycle] Email send error:", err);
      toast.error(`שגיאה בשליחת אימייל: ${err.message || "שגיאה לא ידועה"}`);
    } finally {
      setSendingId(null);
    }
  };

  const handleSendWhatsApp = (lead: HotLead) => {
    const formatted = formatPhone(lead.member.phone_key);
    if (!formatted) {
      toast.error(`מספר טלפון לא תקין עבור ${lead.member.full_name}`);
      return;
    }

    const message = `היי ${lead.member.full_name}, כאן ניצן מ-DiamoNY. ראיתי ש${lead.event_name} ממש מעבר לפינה! רציתי לבדוק אישית אם כבר מצאת את התכשיט שחיפשת, או שאוכל לעזור לך לדייק משהו מיוחד שנספיק להכין בזמן לחגיגה?`;
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyWhatsApp = (lead: HotLead) => {
    const formatted = formatPhone(lead.member.phone_key);
    if (!formatted) {
      toast.error("מספר טלפון לא תקין");
      return;
    }
    const message = `היי ${lead.member.full_name}, כאן ניצן מ-DiamoNY. ראיתי ש${lead.event_name} ממש מעבר לפינה! רציתי לבדוק אישית אם כבר מצאת את התכשיט שחיפשת, או שאוכל לעזור לך לדייק משהו מיוחד שנספיק להכין בזמן לחגיגה?`;
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
    navigator.clipboard.writeText(url);
    toast.success("הקישור הועתק");
  };

  const getDaysLabel = (days: number) => {
    if (days <= 7) return { label: `${days} ימים`, color: "bg-red-500" };
    if (days <= 14) return { label: `${days} ימים`, color: "bg-amber-500" };
    return { label: `${days} ימים`, color: "bg-emerald-500" };
  };

  const getEventIcon = (eventName: string) => {
    const lower = eventName.toLowerCase();
    if (lower.includes("יום הולדת") || lower.includes("birthday")) return "🎂";
    if (lower.includes("יום נישואין") || lower.includes("anniversary")) return "💍";
    if (lower.includes("חג") || lower.includes("holiday")) return "🎉";
    return "📅";
  };

  return (
    <Card className="border-[#C9A96E]/30 bg-gradient-to-br from-[#FDFBF7] to-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarHeart className="w-5 h-5 text-[#D4AF37]" />
          הזדמנויות חמות - אירועים מתקרבים
          <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          לקוחות עם אירועים מיוחדים ב-30 הימים הקרובים
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#C9A96E]" />
          </div>
        ) : !hotLeads || hotLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">אין אירועים מתקרבים בתקופה הקרובה</p>
            <p className="text-xs mt-1">הוסיפו תאריכים מיוחדים ללקוחות VIP</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FDFBF7]">
                  <TableHead className="text-right">לקוח</TableHead>
                  <TableHead className="text-right">אירוע</TableHead>
                  <TableHead className="text-center">ימים</TableHead>
                  <TableHead className="text-center">קרדיט</TableHead>
                  <TableHead className="text-center">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotLeads.map((lead) => {
                  const daysInfo = getDaysLabel(lead.days_remaining);
                  return (
                    <TableRow key={lead.id} className="hover:bg-[#FDFBF7]/50">
                      <TableCell className="font-medium">{lead.member.full_name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <span>{getEventIcon(lead.event_name)}</span>
                          <span className="text-sm">{lead.event_name}</span>
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {format(new Date(lead.event_date), "d בMMMM", { locale: he })}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${daysInfo.color} text-white font-bold`}>
                          {lead.days_remaining === 0 ? "היום!" : `בעוד ${lead.days_remaining} ימים`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-[#D4AF37]">
                          ₪{lead.member.credit_balance.toLocaleString("he-IL")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            disabled={sendingId === `${lead.id}-t21`}
                            onClick={() => handleSendEmail(lead, "t21")}
                            className="!bg-[#D4AF37] !text-black hover:!brightness-95 text-xs px-2 h-7"
                          >
                            {sendingId === `${lead.id}-t21` ? (
                              <Loader2 className="w-3 h-3 animate-spin ml-1" />
                            ) : (
                              <Mail className="w-3 h-3 ml-1" />
                            )}
                            T-21
                          </Button>
                          <Button
                            size="sm"
                            disabled={sendingId === `${lead.id}-t14`}
                            onClick={() => handleSendEmail(lead, "t14")}
                            className="!bg-[#D4AF37] !text-black hover:!brightness-95 text-xs px-2 h-7"
                          >
                            {sendingId === `${lead.id}-t14` ? (
                              <Loader2 className="w-3 h-3 animate-spin ml-1" />
                            ) : (
                              <Mail className="w-3 h-3 ml-1" />
                            )}
                            T-14
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSendWhatsApp(lead)}
                            className="!bg-[#25D366] !text-white hover:!brightness-95 text-xs px-2 h-7"
                          >
                            <MessageCircle className="w-3 h-3 ml-1" />
                            T-7
                          </Button>
                          <Button
                            size="icon"
                            onClick={() => handleCopyWhatsApp(lead)}
                            className="!bg-[#D4AF37] !text-black hover:!bg-[#b8942b] h-7 w-7"
                            title="העתק קישור"
                          >
                            <Copy className="w-3 h-3 !text-black" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HotLeadsPanel;
