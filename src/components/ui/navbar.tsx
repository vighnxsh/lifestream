"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

// Extend the session user type to include role
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-red-700 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Link href="/" className="text-2xl font-bold">
             Lifestream
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={cn(
                "hover:text-red-200 transition-colors",
                isActive("/") && "font-bold underline"
              )}
            >
              Home
            </Link>
            <Link
              href="/blood-inventory"
              className={cn(
                "hover:text-red-200 transition-colors",
                isActive("/blood-inventory") && "font-bold underline"
              )}
            >
              Blood Inventory
            </Link>

            {/* Authenticated user links */}
            {session ? (
              <>
                {/* Donor specific links */}
                {session.user.role === "DONOR" && (
                  <>
                    <Link
                      href="/donor/appointments"
                      className={cn(
                        "hover:text-red-200 transition-colors",
                        isActive("/donor/appointments") && "font-bold underline"
                      )}
                    >
                      My Appointments
                    </Link>
                    <Link
                      href="/donor/donations"
                      className={cn(
                        "hover:text-red-200 transition-colors",
                        isActive("/donor/donations") && "font-bold underline"
                      )}
                    >
                      My Donations
                    </Link>
                  </>
                )}

                {/* Recipient specific links */}
                {session.user.role === "RECIPIENT" && (
                  <Link
                    href="/recipient/requests"
                    className={cn(
                      "hover:text-red-200 transition-colors",
                      isActive("/recipient/requests") && "font-bold underline"
                    )}
                  >
                    My Requests
                  </Link>
                )}

                {/* Admin specific links */}
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className={cn(
                      "hover:text-red-200 transition-colors",
                      pathname.startsWith("/admin") && "font-bold underline"
                    )}
                  >
                    Admin Dashboard
                  </Link>
                )}

                <Link
                  href="/profile"
                  className={cn(
                    "hover:text-red-200 transition-colors",
                    isActive("/profile") && "font-bold underline"
                  )}
                >
                  Profile
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hover:text-red-200 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    "hover:text-red-200 transition-colors",
                    isActive("/login") && "font-bold underline"
                  )}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    "hover:text-red-200 transition-colors",
                    isActive("/register") && "font-bold underline"
                  )}
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            {/* Add mobile menu toggle button here */}
            <button className="p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
