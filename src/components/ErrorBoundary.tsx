import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal-error">
          <h1>这一页暂时没能加载</h1>
          <p>已保存的学习记录不会被清除。</p>
          <button className="primary" onClick={() => location.reload()}>
            重新加载
          </button>
        </main>
      );
    return this.props.children;
  }
}
