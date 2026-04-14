import designerPortrait from "@/assets/designer-portrait.jpg";

const ArtisanBadge = () => (
  <div className="flex items-center justify-center gap-3 mt-4">
    <img
      src={designerPortrait}
      alt="ניצן יעקובי – מעצבת תכשיטים"
      className="w-10 h-10 rounded-full object-cover border border-border"
    />
    <span className="text-sm text-muted-foreground">
      עוצב ונוצר בעבודת יד ע״י ניצן יעקובי
    </span>
  </div>
);

export default ArtisanBadge;
