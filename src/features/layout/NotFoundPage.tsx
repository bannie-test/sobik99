export function NotFoundPage() {
  return (
    <section className="page-shell">
      <small>404 / LẠC MỘT VÒNG XOAY</small>
      <h1>Trang này chưa tồn tại.</h1>
      <a className="button primary" href="#/">
        Về trang chủ ↗
      </a>
    </section>
  );
}

export function RouteError() {
  return (
    <section className="page-shell">
      <h1>Chưa mở được trang.</h1>
      <p>Hãy tải lại trang hoặc trở về trang chủ.</p>
      <a href="#/" className="button primary">
        Về trang chủ
      </a>
    </section>
  );
}

export function PageLoading({ message }: { message: string }) {
  return (
    <section className="page-shell">
      <p>{message}</p>
    </section>
  );
}
