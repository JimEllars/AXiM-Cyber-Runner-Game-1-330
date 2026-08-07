import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiAlertTriangle, FiRefreshCw } = FiIcons;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleReboot = this.handleReboot.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught in ErrorBoundary:", error, errorInfo);
  }

  handleReboot() {
    this.setState({ hasError: false });
    // Reset to practice mode could be handled here or by reloading
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-neon-magenta font-mono p-4">
          <SafeIcon icon={FiAlertTriangle} className="text-6xl mb-4" />
          <h1 className="text-2xl font-bold mb-2 uppercase tracking-widest text-center">System Glitch - Rebooting...</h1>
          <p className="text-gray-400 mb-8 text-center max-w-md">
            A fatal error occurred in the rendering pipeline. Initiating safe reboot sequence to Practice Mode.
          </p>
          <button
            onClick={this.handleReboot}
            className="flex items-center gap-2 border-2 border-neon-cyan text-neon-cyan px-6 py-3 rounded hover:bg-neon-cyan hover:text-black transition-all font-bold uppercase tracking-wider"
          >
            <SafeIcon icon={FiRefreshCw} /> Reboot System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
