import { useState, useEffect } from "react";
import { Diamond, Phone, MessageCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "react-router-dom";

const DesignAppointmentBanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const phoneNumber = "054-6290534";
  const whatsappLink = `https://wa.me/972546290534?text=${encodeURIComponent("היי, אשמח לתאם פגישת עיצוב אישי")}`;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={`fixed top-32 right-4 z-40 flex flex-col items-center gap-2 px-3 py-4 
            bg-gradient-to-b from-primary to-accent text-primary-foreground 
            rounded-full shadow-lg transition-all duration-300 
            hover:scale-105 hover:shadow-xl animate-pulse-slow
            ${isScrolled ? 'opacity-70 hover:opacity-100' : 'opacity-100'}`}
          aria-label="לתיאום פגישת עיצוב"
        >
          <Diamond className="h-5 w-5" />
          <span className="writing-vertical text-xs font-medium" style={{ writingMode: 'vertical-rl' }}>
            לתיאום פגישת עיצוב
          </span>
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[90vw] sm:w-[400px] bg-background">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-right flex items-center gap-2 justify-end">
            <span>תיאום פגישת עיצוב אישי</span>
            <Diamond className="h-5 w-5 text-primary" />
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6 text-right">
          <p className="text-muted-foreground leading-relaxed">
            רוצים ליצור תכשיט ייחודי שמספר את הסיפור שלכם? 
            בפגישת העיצוב האישית נלטש יחד את החלום, נבחר חומרים ואבנים, 
            וניצור עיצוב שהוא רק שלכם.
          </p>

          <div className="space-y-3">
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center justify-end gap-3 p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <div className="text-right">
                <p className="font-medium">התקשרו עכשיו</p>
                <p className="text-sm text-muted-foreground">{phoneNumber}</p>
              </div>
              <Phone className="h-5 w-5 text-primary" />
            </a>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-end gap-3 p-4 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors"
            >
              <div className="text-right">
                <p className="font-medium">שלחו הודעה בוואטסאפ</p>
                <p className="text-sm text-muted-foreground">מענה מהיר</p>
              </div>
              <MessageCircle className="h-5 w-5 text-green-600" />
            </a>
          </div>

          <Link
            to="/contact"
            onClick={() => setIsOpen(false)}
            className="block w-full text-center py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            לטופס יצירת קשר
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DesignAppointmentBanner;
