import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Mail, Phone, MessageSquare, Calendar, Trash2, Check, Clock, X, Download, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LeadsManagerProps {
  limit?: number;
  compact?: boolean;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "חדש", color: "bg-blue-500" },
  contacted: { label: "נוצר קשר", color: "bg-yellow-500" },
  closed: { label: "סגור", color: "bg-green-500" },
};

const closureLabels: Record<string, { label: string; color: string }> = {
  open: { label: "פתוח", color: "bg-gray-500" },
  converted: { label: "הומר ללקוח", color: "bg-green-500" },
  not_interested: { label: "לא מעוניין", color: "bg-red-500" },
  pending: { label: "ממתין", color: "bg-yellow-500" },
};

const LeadsManager = ({ limit, compact = false }: LeadsManagerProps) => {
  const queryClient = useQueryClient();
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [conversationSummary, setConversationSummary] = useState("");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads", limit],
    queryFn: async () => {
      let query = (supabase as any)
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await (supabase as any)
        .from("leads")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "הליד עודכן בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה בעדכון הליד", variant: "destructive" });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "נתוני הליד נמחקו בהצלחה (זכות להישכח)" });
    },
    onError: () => {
      toast({ title: "שגיאה במחיקת הליד", variant: "destructive" });
    },
  });

  const handleStatusChange = (leadId: string, status: string) => {
    const updates: any = { status };
    if (status === "contacted") {
      updates.contacted_at = new Date().toISOString();
    }
    updateLeadMutation.mutate({ id: leadId, updates });
  };

  const handleClosureChange = (leadId: string, closure_status: string) => {
    updateLeadMutation.mutate({ id: leadId, updates: { closure_status } });
  };

  const handleSaveSummary = (leadId: string) => {
    updateLeadMutation.mutate({
      id: leadId,
      updates: { conversation_summary: conversationSummary },
    });
    setEditingLead(null);
    setConversationSummary("");
  };

  // DSR: Export client data as JSON
  const handleExportData = (lead: any) => {
    const exportData = {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      jewelry_interest_type: lead.jewelry_interest_type,
      estimated_budget: lead.estimated_budget,
      metal_preference: lead.metal_preference,
      ring_size: lead.ring_size,
      event_target_date: lead.event_target_date,
      consent_privacy_policy: lead.consent_privacy_policy,
      consent_privacy_timestamp: lead.consent_privacy_timestamp,
      consent_marketing_timestamp: lead.consent_marketing_timestamp,
      utm_source: lead.utm_source,
      utm_campaign: lead.utm_campaign,
      utm_medium: lead.utm_medium,
      source: lead.source,
      created_at: lead.created_at,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead-data-${lead.name.replace(/\s+/g, "-")}-${lead.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "נתוני הלקוח יוצאו בהצלחה" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!leads?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        אין לידים להצגה
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {leads.map((lead: any) => (
          <div
            key={lead.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div>
              <p className="font-medium text-sm">{lead.name}</p>
              <a
                href={`mailto:${lead.email}`}
                className="text-xs text-primary hover:underline"
              >
                {lead.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs text-white ${statusLabels[lead.status || "new"].color}`}
              >
                {statusLabels[lead.status || "new"].label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {format(new Date(lead.created_at), "dd/MM", { locale: he })}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead: any) => (
        <div
          key={lead.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{lead.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm">
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {lead.email}
                </a>
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", {
                  locale: he,
                })}
              </div>
            </div>
          </div>

          {/* Privacy Consent Log */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-2 mb-3">
            <p className="text-xs font-medium text-green-800 dark:text-green-300">
              לוג אישור פרטיות:{" "}
              {lead.consent_privacy_timestamp ? (
                <span className="font-normal">
                  ✅ אושר ב-{format(new Date(lead.consent_privacy_timestamp), "dd/MM/yyyy HH:mm:ss", { locale: he })}
                </span>
              ) : (
                <span className="font-normal text-amber-600">⚠️ לא קיים רישום</span>
              )}
            </p>
          </div>

          {/* Original Message */}
          <div className="bg-muted/50 rounded-md p-3 mb-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm">{lead.message}</p>
            </div>
          </div>

          {/* Status Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                סטטוס ליד
              </label>
              <Select
                value={lead.status || "new"}
                onValueChange={(value) => handleStatusChange(lead.id, value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      חדש
                    </div>
                  </SelectItem>
                  <SelectItem value="contacted">
                    <div className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      נוצר קשר
                    </div>
                  </SelectItem>
                  <SelectItem value="closed">
                    <div className="flex items-center gap-2">
                      <X className="h-3 w-3" />
                      סגור
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {lead.contacted_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  נוצר קשר:{" "}
                  {format(new Date(lead.contacted_at), "dd/MM/yyyy HH:mm", {
                    locale: he,
                  })}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                מצב סגירה
              </label>
              <Select
                value={lead.closure_status || "open"}
                onValueChange={(value) => handleClosureChange(lead.id, value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">פתוח</SelectItem>
                  <SelectItem value="converted">הומר ללקוח</SelectItem>
                  <SelectItem value="not_interested">לא מעוניין</SelectItem>
                  <SelectItem value="pending">ממתין</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversation Summary */}
          <div className="mb-3">
            <label className="text-xs text-muted-foreground mb-1 block">
              סיכום שיחה
            </label>
            {editingLead === lead.id ? (
              <div className="space-y-2">
                <Textarea
                  value={conversationSummary}
                  onChange={(e) => setConversationSummary(e.target.value)}
                  placeholder="תאר את תוכן השיחה..."
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveSummary(lead.id)}
                    disabled={updateLeadMutation.isPending}
                  >
                    שמור
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingLead(null);
                      setConversationSummary("");
                    }}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="bg-muted/30 rounded-md p-2 min-h-[40px] cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setEditingLead(lead.id);
                  setConversationSummary(lead.conversation_summary || "");
                }}
              >
                <p className="text-sm text-muted-foreground">
                  {lead.conversation_summary || "לחץ להוספת סיכום שיחה..."}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons - Including DSR Tools */}
          <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
            {/* Export Client Data (Data Portability) */}
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => handleExportData(lead)}
            >
              <Download className="h-3 w-3" />
              ייצוא נתוני לקוח
            </Button>

            {/* Delete/Anonymize (Right to be Forgotten) */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1 text-amber-600 border-amber-300 hover:bg-amber-50">
                  <ShieldX className="h-3 w-3" />
                  מחיקת נתונים
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>מחיקת נתונים אישיים (זכות להישכח)</AlertDialogTitle>
                  <AlertDialogDescription>
                    פעולה זו תמחק לצמיתות את כל הנתונים האישיים של {lead.name} ({lead.email}) מהמערכת.
                    פעולה זו בלתי הפיכה ומבוצעת בהתאם לזכות ה-Right to be Forgotten.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteLeadMutation.mutate(lead.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    אישור מחיקה סופית
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Standard Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="gap-1">
                  <Trash2 className="h-3 w-3" />
                  מחק
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>האם למחוק את הליד?</AlertDialogTitle>
                  <AlertDialogDescription>
                    פעולה זו תמחק לצמיתות את הליד של {lead.name}. לא ניתן לבטל
                    פעולה זו.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteLeadMutation.mutate(lead.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    מחק
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeadsManager;
