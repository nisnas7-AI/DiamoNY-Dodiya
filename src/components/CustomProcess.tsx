import { MessageCircle, Palette, Sparkles, Heart, Star, Crown, Gem } from "lucide-react";
import { useSectionSettings, getSectionStyle, getSectionClasses, SectionSetting } from "@/hooks/useSectionSettings";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  MessageSquare: MessageCircle,
  MessageCircle: MessageCircle,
  Palette: Palette,
  Sparkles: Sparkles,
  Gem: Gem,
  Heart: Heart,
  Star: Star,
  Crown: Crown,
};

const CustomProcess = () => {
  const { data: settings } = useSectionSettings("custom_process");
  
  const defaultSteps = [
    {
      icon: MessageCircle,
      step: "01",
      title: "הפגישה",
      description: "ליטוש החלום – בחירת חומרי הגלם, יהלומים וזהב, והתאמה לתקציב.",
    },
    {
      icon: Palette,
      step: "02",
      title: "העיצוב",
      description: "הדמיה ממוחשבת (3D) לאישור לפני הייצור – לראות את התכשיט לפני שנוצר.",
    },
    {
      icon: Sparkles,
      step: "03",
      title: "היצירה",
      description: "צורפות עילית – התכשיט נוצר בידיים מיומנות ומוכן למסירה.",
    },
  ];

  // Get steps from settings or use defaults
  const settingsTyped = settings as SectionSetting | null;
  const contentSteps = settingsTyped?.content?.steps as Array<{
    icon: string;
    step: number;
    title: string;
    description: string;
  }> | undefined;

  const steps = contentSteps
    ? contentSteps.map((s) => ({
        icon: ICON_MAP[s.icon] || MessageCircle,
        step: String(s.step).padStart(2, "0"),
        title: s.title,
        description: s.description,
      }))
    : defaultSteps;

  const sectionStyle = getSectionStyle(settingsTyped);
  const sectionClasses = getSectionClasses(settingsTyped);

  const title = settingsTyped?.title || "מהסקיצה ועד התכשיט";
  const subtitle = settingsTyped?.subtitle || "THE BESPOKE EXPERIENCE";

  return (
    <section 
      id="custom" 
      className={`px-4 md:px-8 bg-secondary ${sectionClasses}`}
      style={sectionStyle}
    >
      <div className="container-luxury">
        <div className="text-center mb-10">
          <span className="text-accent font-light text-sm tracking-[0.3em] uppercase mb-4 block">
            {subtitle}
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-light mb-4">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            תהליך העיצוב האישי שלנו מבטיח שהתכשיט הסופי ישקף בדיוק את החזון שלך
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-8">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative text-center group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-border -translate-x-1/2" />
              )}

              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-card border-2 border-accent/30 flex items-center justify-center group-hover:border-accent transition-colors duration-300">
                  <item.icon className="w-10 h-10 text-accent" strokeWidth={1.5} />
                </div>
                <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 text-xs font-medium text-accent bg-secondary px-2">
                  {item.step}
                </span>
              </div>

              <h3 className="font-heading text-xl font-light mb-3">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="#contact" className="btn-gold inline-block">
            התחל את המסע שלך כאן
          </a>
        </div>
      </div>
    </section>
  );
};

export default CustomProcess;
