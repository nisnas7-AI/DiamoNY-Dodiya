import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface VipTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VipTermsModal = ({ isOpen, onClose }: VipTermsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-lg border-0 shadow-2xl rounded-[2rem] bg-[#0a0a0a] p-0 overflow-hidden max-h-[90vh]"
        dir="rtl"
      >
        <div className="px-8 pt-10 pb-4 text-center border-b border-white/10">
          <DialogTitle className="text-xl md:text-2xl font-heading text-[#C9A96E] tracking-wide">
            תקנון כספת VIP ומדיניות פרטיות
          </DialogTitle>
        </div>

        <ScrollArea className="max-h-[60vh] px-8 py-6">
          <div className="space-y-8 text-white/80 text-sm leading-relaxed font-body">
            {/* Section 1 */}
            <section>
              <h3 className="text-[#C9A96E] font-heading text-base mb-3">הגדרות צבירת יתרה</h3>
              <p>
                חברי כספת VIP של DiamoNY זכאים לצבירת קרדיט על בסיס רכישות עתידיות. יתרת הקרדיט תעודכן
                באופן ידני על ידי צוות DiamoNY לאחר כל רכישה מאומתת. הקרדיט אינו ניתן להמרה לכסף מזומן
                ותקף לשימוש ברכישות עתידיות בלבד.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="text-[#C9A96E] font-heading text-base mb-3">אחוזי הנחה</h3>
              <p>
                אחוזי ההנחה למוצרים נקבעים באופן פרטני עבור כל פריט בכספת. ההנחה המוצגת הינה
                ההנחה הסופית וכוללת את כל ההטבות הרלוונטיות. DiamoNY שומרת לעצמה את הזכות לעדכן
                את אחוזי ההנחה מעת לעת.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="text-[#C9A96E] font-heading text-base mb-3">כפל הטבות</h3>
              <p>
                הטבות הכספת אינן ניתנות לשילוב עם מבצעים, קופונים או הנחות אחרות הפעילות באתר,
                אלא אם צוין אחרת במפורש. במקרה של חפיפה, תחול ההטבה הגבוהה מבין השתיים.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="text-[#C9A96E] font-heading text-base mb-3">הצהרת פרטיות</h3>
              <p>
                DiamoNY מחויבת להגנה על פרטיות חברי הכספת בהתאם לחוק הגנת הפרטיות, התשמ"א-1981
                (סעיף 13). המידע שנאסף (שם, טלפון, כתובת דוא"ל) ישמש אך ורק לצורך מתן שירות VIP,
                שליחת הטבות והודעות רלוונטיות. המידע לא יועבר לצדדים שלישיים ולא ישמש למטרות שיווקיות
                שאינן קשורות ישירות לשירותי DiamoNY. ניתן לבקש מחיקת המידע בכל עת באמצעות פנייה ישירה.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="px-8 pb-8 pt-4">
          <Button
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-[#C9A96E] hover:bg-[#b8944f] text-[#0a0a0a] font-semibold text-base tracking-wide transition-all duration-300"
          >
            <X className="w-4 h-4 ml-2" />
            סגירה
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VipTermsModal;
