"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const pathName = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const auth = localStorage.getItem("auth") === "true";
    const user = localStorage.getItem("user");

    if (!auth || !user) {
      setIsAuthenticated(false);
      if (pathName !== "/login") {
        router.replace("/login"); // redirect if not logged in
      }
    } else {
      setIsAuthenticated(true);
      if (pathName === "/login") {
        router.replace("/"); // already logged in → go home
      }
    }

    setLoading(false);
  }, [pathName, router]);

  // 🔹 Loader until auth check finishes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // 🔹 If not authenticated & trying to access protected route
  if (!isAuthenticated && pathName !== "/login") {
    return null;
  }

  // 🔹 Allow access
  return <>{children}</>;
};

export default ProtectedRoute;
