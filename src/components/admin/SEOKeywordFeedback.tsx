import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { analyzeKeywordPresence } from "@/lib/seoKeywords";

interface SEOKeywordFeedbackProps {
  text: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const SEOKeywordFeedback = ({ 
  text, 
  showDetails = true,
  compact = false 
}: SEOKeywordFeedbackProps) => {
  const analysis = analyzeKeywordPresence(text);
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 70) return "מצוין";
    if (score >= 40) return "טוב";
    return "דרוש שיפור";
  };
  
  const getProgressColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  if (!text || text.length < 10) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <TrendingUp className="h-3 w-3 text-primary" />
        <span className={`font-medium ${getScoreColor(analysis.score)}`}>
          SEO: {analysis.score}%
        </span>
        <span className="text-muted-foreground">
          ({analysis.found.length} מילות מפתח)
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 to-violet-50/50 border border-primary/20 rounded-lg p-4 space-y-3">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">ניתוח SEO</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>
            {analysis.score}%
          </span>
          <Badge 
            variant={analysis.score >= 70 ? "default" : analysis.score >= 40 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {getScoreLabel(analysis.score)}
          </Badge>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <Progress value={analysis.score} className="h-2" />
        <div 
          className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${getProgressColor(analysis.score)}`}
          style={{ width: `${analysis.score}%` }}
        />
      </div>
      
      {showDetails && (
        <>
          {/* Power Words Found */}
          {analysis.powerWordsFound.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>מילות כוח שנמצאו:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {analysis.powerWordsFound.map((word, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs bg-green-50 border-green-200 text-green-700"
                  >
                    ✨ {word}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Keywords Found */}
          {analysis.found.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                <span>מילות מפתח שנמצאו ({analysis.found.length}):</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {analysis.found.slice(0, 10).map((word, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs bg-primary/5 border-primary/20"
                  >
                    {word}
                  </Badge>
                ))}
                {analysis.found.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{analysis.found.length - 10} נוספות
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Missing Keywords Hint */}
          {analysis.found.length < 5 && (
            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded p-2">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>
                הטקסט מכיל מעט מילות מפתח. שקול להשתמש בכפתור "אופטימיזציה ל-SEO" 
                כדי לשפר את הדירוג בגוגל.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SEOKeywordFeedback;
