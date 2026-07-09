import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, useInvalidateAuth } from "../lib/auth";
import { apiFetch } from "../lib/api";
import { toast } from "sonner";
import { Building2, LogIn, LogOut, LayoutDashboard, Shield, Menu, X, Settings, User, Heart, Bell, Info } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Navbar() {
  const { user } = useAuth();
  const invalidate = useInvalidateAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useQuery({
    queryKey: ["notif-count"],
    queryFn: () => apiFetch("/notifications/unread-count"),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const unreadCount: number = notifData?.count ?? 0;

  const { data: favData } = useQuery({
    queryKey: ["favorite-ids"],
    queryFn: () => apiFetch("/favorites/ids"),
    enabled: !!user,
  });
  const favCount: number = favData?.ids?.length ?? 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" });
    invalidate();
    navigate("/");
    setMobileOpen(false);
    setDropdownOpen(false);
    toast.success("Ai fost deconectat");
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
            <div className="bg-primary rounded-lg p-1.5 group-hover:bg-primary/90 transition-colors">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground text-base tracking-tight">Servicii</span>
              <span className="font-bold text-primary text-base tracking-tight">Locale</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {user && (
              <Link to="/dashboard" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive("/dashboard") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <LayoutDashboard className="h-4 w-4" />Dashboard
              </Link>
            )}
            <Link to="/despre" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive("/despre") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <Info className="h-4 w-4" />Despre
            </Link>
            {user?.role === "admin" && (
              <Link to="/admin" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive("/admin") ? "bg-orange-50 text-orange-700" : "text-orange-600 hover:bg-orange-50"}`}>
                <Shield className="h-4 w-4" />Admin
              </Link>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {/* Favorites */}
                <Link to="/favorite" className={`relative p-2 rounded-lg transition-colors ${isActive("/favorite") ? "bg-pink-50 text-pink-500" : "text-muted-foreground hover:text-pink-500 hover:bg-pink-50"}`} title="Anunțuri salvate">
                  <Heart className="h-5 w-5" />
                  {favCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {favCount > 9 ? "9+" : favCount}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <Link to="/notificari" className={`relative p-2 rounded-lg transition-colors ${isActive("/notificari") ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`} title="Notificări">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-white font-semibold">{user.name[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{user.name.split(" ")[0]}</span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-border shadow-lg py-1.5 z-50">
                      <Link to={`/profile/${user.id}`} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                        <User className="h-4 w-4 text-muted-foreground" />Profil public
                      </Link>
                      <Link to="/settings" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                        <Settings className="h-4 w-4 text-muted-foreground" />Setări cont
                      </Link>
                      <div className="border-t border-border my-1" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full">
                        <LogOut className="h-4 w-4" />Deconectare
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <LogIn className="h-4 w-4" />Conectare
                </Link>
                <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
                  Înregistrare gratuită
                </Link>
              </div>
            )}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 flex flex-col gap-1 shadow-lg">
          {user && (
            <>
              <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                <LayoutDashboard className="h-4 w-4 text-primary" />Dashboard
              </Link>
              <Link to="/favorite" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                <Heart className="h-4 w-4 text-pink-500" />Anunțuri salvate
                {favCount > 0 && <span className="ml-auto text-xs font-bold text-pink-500">{favCount}</span>}
              </Link>
              <Link to="/notificari" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                <Bell className="h-4 w-4 text-primary" />Notificări
                {unreadCount > 0 && <span className="ml-auto text-xs font-bold text-primary">{unreadCount}</span>}
              </Link>
              <Link to={`/profile/${user.id}`} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                <User className="h-4 w-4 text-muted-foreground" />Profil public
              </Link>
              <Link to="/settings" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                <Settings className="h-4 w-4 text-muted-foreground" />Setări cont
              </Link>
            </>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50" onClick={() => setMobileOpen(false)}>
              <Shield className="h-4 w-4" />Panou Admin
            </Link>
          )}
          <Link to="/despre" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary" onClick={() => setMobileOpen(false)}>
            <Info className="h-4 w-4 text-muted-foreground" />Despre noi
          </Link>
          <div className="border-t border-border pt-2 mt-1 flex flex-col gap-1">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white font-semibold">{user.name[0]}</span>
                  </div>
                  {user.name}
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5 text-left">
                  <LogOut className="h-4 w-4" />Deconectare
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2.5 rounded-lg text-sm font-medium text-center border border-border hover:bg-secondary" onClick={() => setMobileOpen(false)}>Conectare</Link>
                <Link to="/register" className="px-3 py-2.5 rounded-lg text-sm font-semibold text-center bg-primary text-white hover:bg-primary/90" onClick={() => setMobileOpen(false)}>Înregistrare gratuită</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
