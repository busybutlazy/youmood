import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-6xl font-semibold text-wood-light">404</p>
      <h1 className="mt-4 text-2xl font-semibold">找不到頁面</h1>
      <p className="mt-2 text-muted-foreground">
        您要找的頁面可能已移除或不存在。
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-wood px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-wood/90"
      >
        回到首頁
      </Link>
    </div>
  );
}
