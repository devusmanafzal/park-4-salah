import { NavLink, Outlet, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Park" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/donate", label: "Donate" },
  { to: "/admin", label: "Admin" },
];

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container max-w-5xl flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display text-sm">P</span>
            <span className="font-display text-lg">Park for Salah</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 rounded-md transition-colors text-muted-foreground hover:text-foreground",
                    isActive && "text-foreground bg-muted"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 mt-16">
        <div className="container max-w-5xl py-8 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <p>Built with care for the community.</p>
          <p>Park for Salah · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
