"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Wifi, WifiOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/supabaseClient";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [online, setOnline] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);

        // Normalize Supabase user object
        setUser({
          uid: parsed.id, // Supabase user id
          name:
            parsed.user_metadata?.full_name ||
            parsed.user_metadata?.name ||
            parsed.email?.split("@")[0] ||
            "User",
          email: parsed.email,
        });
      }
    }

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    router.replace("/login");
  };
  
  return (
    <nav className="bg-white backdrop-blur-lg shadow-md border-b border-gray-200 sticky w-full top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <Link
            href={"/"}
            className="flex items-center space-x-2 overflow-hidden"
          >
            <Image
              width={1000}
              height={1000}
              src={"/logo.png"}
              className="w-48 object-contain"
              alt="logo"
              loading="lazy"
            />
          </Link>

          {/* Profile Section */}
          {user && (
            <div className="relative group">
              {/* Avatar */}
              <div className="flex items-center space-x-2 cursor-pointer select-none">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden sm:block font-medium text-gray-700">
                  {user.name}
                </span>
              </div>

              {/* Hover Card */}
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-xl border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      {user.name}
                    </h4>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-2 text-sm mb-3">
                  {online ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Offline</span>
                    </>
                  )}
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
