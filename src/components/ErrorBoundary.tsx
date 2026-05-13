import { Component, ReactNode } from 'react';

interface State { hasError: boolean; message?: string }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, message: undefined });
    // Best-effort hard reset to recover the app
    if (typeof window !== 'undefined') window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Une erreur est survenue</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {this.state.message ?? "L'application a rencontré un problème inattendu."}
          </p>
          <button onClick={this.reset} className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
            Recharger l'accueil
          </button>
        </div>
      </div>
    );
  }
}
