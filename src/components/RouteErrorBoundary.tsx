import { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary for lazy-loaded route chunks.
 * Catches chunk-load failures and render errors with a brand-aligned fallback.
 */
class RouteErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route error boundary caught:", error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6" dir="rtl">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 mx-auto mb-6 text-muted-foreground/30">
              <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
                <path d="M20 4L4 16L20 36L36 16L20 4Z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-light text-foreground mb-3">
              אירעה שגיאה
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              לא הצלחנו לטעון את העמוד. אנא נסו שוב.
            </p>
            <Button variant="outline" size="sm" onClick={this.handleRetry} className="gap-2">
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

export default RouteErrorBoundary;
