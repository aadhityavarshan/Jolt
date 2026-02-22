import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-[1100px] px-6 py-4 flex items-center gap-3">
          <SidebarTrigger />
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
      </div>
      </div>
    </div>
  );
};

export default NotFound;
