"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const pathName = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // run check only on client
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("auth") === "true";

      if (!auth && pathName !== "/login") {
        router.push("/login");
      } else if (auth && pathName === "/login") {
        router.push("/");
      }

      setIsAuthenticated(auth);
      setLoading(false);
    }
  }, [pathName, router]);

  // 🔹 show loader until auth check finishes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // 🔹 only render children if allowed
  if (!isAuthenticated && pathName !== "/login") {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
