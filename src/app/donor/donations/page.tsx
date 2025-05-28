"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { bloodTypeLabels } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface Donation {
  id: string;
  donorId: string;
  bloodInventoryId: string | null;
  donationDate: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  bloodInventory: {
    id: string;
    bloodType: string;
    quantity: number;
  } | null;
}

export default function DonorDonationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated or not a donor
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && session.user.role !== "DONOR") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchDonations = async () => {
      if (!session?.user.id) return;

      try {
        const response = await fetch("/api/donations");
        
        if (!response.ok) {
          throw new Error("Failed to fetch donations");
        }
        
        const data = await response.json();
        setDonations(data.donations);
      } catch (error) {
        setError("Error loading donations. Please try again later.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user.id) {
      fetchDonations();
    }
  }, [session?.user.id]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show loading state while checking authentication
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  // Show access denied message if not a donor
  if (session && session.user.role !== "DONOR") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Access Denied</p>
          <p>You must be a donor to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">My Donations</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {donations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">You haven&apos;t made any donations yet.</p>
          <p className="mb-4">
            Ready to save lives? Schedule an appointment to donate blood today!
          </p>
          <a
            href="/donor/appointments"
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors inline-block"
          >
            Schedule Appointment
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donation Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blood Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(donation.donationDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {donation.bloodInventory ? (
                        <div className="text-sm font-medium text-gray-900">
                          {bloodTypeLabels[donation.bloodInventory.bloodType]}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Not recorded</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{donation.quantity} units</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(donation.status)}`}>
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Donation Information */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Donation Information</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Benefits of Donating Blood:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Your donation can save up to 3 lives</li>
              <li>Free mini health check-up</li>
              <li>Reduced risk of heart disease</li>
              <li>Stimulates blood cell production</li>
              <li>Burns calories</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Eligibility Requirements:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Be at least 18 years old</li>
              <li>Weigh at least 110 pounds</li>
              <li>Be in good health</li>
              <li>Have not donated in the last 56 days</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What to Expect:</h3>
            <p className="text-gray-700">
              The donation process takes about an hour from start to finish, with the actual blood draw taking only about 10 minutes. You&apos;ll be asked to fill out a health questionnaire, undergo a mini health check, and then donate blood. After donation, you&apos;ll be provided with refreshments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
