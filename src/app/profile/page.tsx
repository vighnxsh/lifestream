"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        {session?.user ? (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold">{session.user.name}</h2>
                <p className="text-gray-600">{session.user.email}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {session.user.role || "USER"}
                  </span>
                </div>
              </div>
              <Button onClick={() => alert("Edit functionality will be implemented soon")}>Edit Profile</Button>
            </div>

            {/* Quick Actions */}
            {session.user.role === "DONOR" && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="/donor/appointments"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Schedule Donation
                  </a>
                  <a
                    href="/donor/donations"
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View My Donations
                  </a>
                </div>
              </div>
            )}

            {session.user.role === "RECIPIENT" && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="/blood-requests/new"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Request Blood
                  </a>
                  <a
                    href="/blood-requests"
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View My Requests
                  </a>
                </div>
              </div>
            )}

            {session.user.role === "ADMIN" && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium mb-4">Admin Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="/admin"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Admin Dashboard
                  </a>
                  <a
                    href="/admin/users"
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Manage Users
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Please log in to view your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
