"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  label?: string;
};

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label || "unknown"}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <h3 className="font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {this.props.label ? `Failed to load ${this.props.label}.` : "An unexpected error occurred."}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-md mx-auto">
            {this.state.error?.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
