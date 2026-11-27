import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Paper Bloom UI boundary caught error:', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center">
          <h1 className="font-editorial text-3xl text-[#181d1a] mb-3">
            Something went quietly wrong
          </h1>
          <p className="text-[#525954] max-w-md mb-6">
            We could not render this section properly. Try refreshing the page or returning to the Paper Bloom home page.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full bg-[#9f3c16] text-white text-sm font-medium hover:bg-[#bf542c] transition-colors"
            >
              Reload page
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              className="px-5 py-2.5 rounded-full border border-[#dec0b7] text-[#181d1a] text-sm font-medium hover:bg-[#faf6f0] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
