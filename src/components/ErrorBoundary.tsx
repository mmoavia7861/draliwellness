import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      let friendlyMessage = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message) as { error?: string; path?: string };
        if (parsed.error) {
          friendlyMessage = `Database access notice (${parsed.path ?? 'store'}): ${parsed.error}`;
        }
      } catch {
        // non-JSON error
      }

      return (
        <div className="min-h-screen bg-[#FAF8F2] text-[#252B29] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#174D40]/15 rounded-xl p-8 space-y-4">
            <h1 className="font-serif text-2xl font-semibold text-[#174D40]">
              Something went wrong
            </h1>
            <p className="text-sm text-[#252B29]/80 leading-relaxed">{friendlyMessage}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.href = '/';
              }}
              className="px-5 py-2.5 bg-[#174D40] text-white text-sm font-medium rounded-lg hover:bg-[#113A30] transition-colors cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
