import { Award, Diamond, Shield } from "lucide-react";
import { useSectionSettings, getSectionStyle, getSectionClasses, SectionSetting } from "@/hooks/useSectionSettings";

const TrustIndicators = () => {
  const { data: settings } = useSectionSettings("trust_indicators");
  const settingsTyped = settings as SectionSetting | null;
  
  const indicators = [{
    icon: Award,
    title: "משלוח חינם בכל רכישה",
    description: "מסירת התכשיט לידכם בביטחון"
  }, {
    icon: Diamond,
    title: "תעודה גמולוגית לכל תכשיטי היהלומים",
    description: "לכל הזמנה מצורפת תעודת איכות"
  }, {
    icon: Shield,
    title: "שנתיים אחריות ע\"פ התקנון",
    description: "חומרי גלם באיכות הגבוהה ביותר"
  }];

  const sectionStyle = getSectionStyle(settingsTyped);
  const sectionClasses = getSectionClasses(settingsTyped);

  return (
    <section 
      className={`py-12 bg-secondary border-y border-border ${sectionClasses}`}
      style={sectionStyle}
    >
      <div className="container-luxury">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {indicators.map((item, index) => (
            <div 
              key={item.title} 
              className="flex items-center gap-4 justify-center text-center md:text-right" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <item.icon className="w-10 h-10 text-accent flex-shrink-0" strokeWidth={1.5} />
              <div>
                <h3 className="font-heading font-medium text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;