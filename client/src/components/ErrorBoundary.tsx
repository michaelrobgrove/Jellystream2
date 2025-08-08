// Create this as client/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto bg-gray-900 border-red-500">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-red-500 bg-red-500/10 mb-4">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertTitle className="text-red-400">Payment Error</AlertTitle>
                <AlertDescription className="text-red-300">
                  We encountered an issue processing your request. This could be due to:
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Network connection issues</li>
                    <li>Payment processing errors</li>
                    <li>Server temporary unavailability</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button 
                  onClick={this.handleReload}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-400 hover:bg-gray-800"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
                  <summary className="cursor-pointer">Error Details (Dev Mode)</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Payment-specific error component
export const PaymentErrorFallback = ({ error, retry }: { error?: string; retry?: () => void }) => (
  <div className="w-full max-w-md mx-auto">
    <Card className="bg-gray-900 border-red-500">
      <CardContent className="pt-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Payment Failed</h3>
          <p className="text-gray-400 mb-4">
            {error || "We couldn't process your payment. Please check your card details and try again."}
          </p>
          
          <div className="space-y-2">
            {retry && (
              <Button 
                onClick={retry}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Loading component to prevent blank screens during payment processing
export const PaymentLoading = ({ message = "Processing..." }: { message?: string }) => (
  <div className="w-full max-w-md mx-auto">
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{message}</h3>
          <p className="text-gray-400">
            Please don't close this window...
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);