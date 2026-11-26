import { Component, type ReactNode } from 'react';
import { RouteError } from '../features/layout/NotFoundPage';

/** Lỗi khi render/tải một trang → hiện thông báo thay vì trắng màn hình. Reset theo key (hash). */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    return this.state.failed ? <RouteError /> : this.props.children;
  }
}
