import { Shield, Truck, Award } from "lucide-react";

const badges = [
  { icon: Shield, label: "אחריות ע״פ התקנון" },
  { icon: Truck, label: "משלוח לכל הזמנה" },
  { icon: Award, label: "יהלומים מתועדים" },
];

const ProductTrustBadges = () => (
  <div className="flex items-center justify-center gap-6 border-t border-border pt-4 mt-4">
    {badges.map(({ icon: Icon, label }) => (
      <div key={label} className="flex flex-col items-center gap-1.5">
        <Icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
        <span className="text-muted-foreground text-xs text-center leading-tight">{label}</span>
      </div>
    ))}
  </div>
);

export default ProductTrustBadges;
