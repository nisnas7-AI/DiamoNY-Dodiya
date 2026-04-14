import { useState, lazy, Suspense } from "react";
import { Globe, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import AdminErrorBoundary from "@/components/admin/AdminErrorBoundary";

const WebPresenceManager = lazy(() => import("@/components/admin/WebPresenceManager"));

const WebPresenceCard = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative w-full rounded-2xl border border-border bg-card p-6 text-right shadow-sm transition-all hover:shadow-md hover:border-[#c9a96e]/40 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <div className="flex items-center justify-between gap-4">
          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Web Identity & Favicon</h3>
              <p className="text-xs text-muted-foreground mt-0.5">נוכחות דיגיטלית, Favicon, OG Image וצבע מותג</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c9a96e]/10 text-[#c9a96e]">
              <Globe className="h-5 w-5" />
            </div>
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Globe className="h-5 w-5 text-[#c9a96e]" />
              Web Identity & Favicon
            </DialogTitle>
            <DialogDescription>ניהול Favicon, OG Image וצבע מותג</DialogDescription>
          </DialogHeader>
          <AdminErrorBoundary fallbackMessage="שגיאה בטעינת מנהל נוכחות האתר. נסה לרענן.">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <WebPresenceManager />
            </Suspense>
          </AdminErrorBoundary>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WebPresenceCard;
