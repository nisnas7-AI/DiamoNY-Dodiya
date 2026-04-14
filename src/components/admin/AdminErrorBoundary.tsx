import { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class AdminErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin component error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              שגיאה בטעינת הרכיב
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {this.props.fallbackMessage || "אירעה שגיאה בטעינת הנתונים. נסה לרענן את העמוד."}
            </p>
            {this.state.error && (
              <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                {this.state.error.message}
              </p>
            )}
            <Button 
              onClick={() => this.setState({ hasError: false, error: undefined })}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default AdminErrorBoundary;
