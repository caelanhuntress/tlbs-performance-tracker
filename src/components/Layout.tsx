import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Calendar, BarChart3, Database, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Layout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Calendar", path: "/", icon: Calendar },
    { name: "Data", path: "/data", icon: Database },
    { name: "Dashboard", path: "/dashboard", icon: BarChart3 },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-performance" />
              <h1 className="text-2xl font-bold text-foreground">TLBS Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <nav className="flex space-x-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;