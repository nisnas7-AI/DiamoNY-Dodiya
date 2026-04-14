import { Component, ErrorInfo, ReactNode } from "react";
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

/**
 * Error boundary for individual content blocks.
 * Prevents a single block failure from breaking the entire page.
 * Styled to match the brand's Scandinavian luxury aesthetic.
 */
class BlockErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Block rendering error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="py-8 px-4">
          <div className="max-w-md mx-auto bg-muted/30 border border-border/50 rounded-lg p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4 font-body">
              {this.props.fallbackMessage || "אירעה שגיאה בטעינת התוכן"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              נסה שוב
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default BlockErrorBoundary;
