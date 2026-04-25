import { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LogIn, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const baseNav = [
  { to: "/", label: "Park" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/donate", label: "Donate" },
];

const Layout = () => {
  const { user, isAdmin, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const navItems = [...baseNav, ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : [])];

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container max-w-5xl flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
            <Logo />
            {isAdmin && (
              <span className="ml-2 hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
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
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2 gap-1.5">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            ) : (
              <Button asChild variant="default" size="sm" className="ml-2">
                <Link to="/auth"><LogIn className="h-4 w-4 mr-1.5" /> Sign in</Link>
              </Button>
            )}
          </nav>

          {/* Mobile burger */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted -mr-2"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-border/60 bg-background">
            <nav className="container max-w-5xl flex flex-col py-2 px-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-3 rounded-md text-base text-muted-foreground hover:text-foreground hover:bg-muted",
                      isActive && "text-foreground bg-muted"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="border-t border-border/60 mt-2 pt-2">
                {user ? (
                  <>
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      Signed in as {profile?.display_name ?? user.email}
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-3 rounded-md text-base text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-3 rounded-md text-base text-primary hover:bg-muted inline-flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" /> Sign in / Create account
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border/60 mt-16">
        <div className="container max-w-5xl py-8 px-4 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <p>Built with care for the community.</p>
          <p>Park for Salah · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
