import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground">
            M
          </span>
          <span className="text-sm font-semibold tracking-tight text-navy">MISO Navigator</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-navy [&.active]:text-navy">
            Ask
          </Link>
          <Link to="/data" className="hover:text-navy [&.active]:text-navy">
            Data
          </Link>
          <Link to="/canvas" search={{}} className="hover:text-navy [&.active]:text-navy">
            Data Canvas
          </Link>
        </nav>
      </div>
    </header>
  );
}
