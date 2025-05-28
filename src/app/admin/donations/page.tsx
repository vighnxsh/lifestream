"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  donor: {
    id: string;
    name: string;
    email: string;
  };
  bloodInventory: {
    id: string;
    bloodType: string;
    quantity: number;
  } | null;
}

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  useEffect(() => {
    const fetchDonations = async () => {
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

    fetchDonations();
  }, []);

  const handleAddDonation = () => {
    setSelectedDonation(null);
    setShowAddModal(true);
  };

  const handleEditDonation = (donation: Donation) => {
    setSelectedDonation(donation);
    setShowAddModal(true);
  };

  const handleDeleteDonation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this donation record?")) {
      return;
    }

    try {
      const response = await fetch(`/api/donations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete donation");
      }

      // Remove the donation from the list
      setDonations(donations.filter(donation => donation.id !== id));
    } catch (error) {
      alert("Error deleting donation. Please try again.");
      console.error(error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        <span className="ml-2">Loading donations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  // Calculate donation statistics
  const totalDonations = donations.length;
  const completedDonations = donations.filter(d => d.status === "COMPLETED").length;
  const scheduledDonations = donations.filter(d => d.status === "SCHEDULED").length;
  const cancelledDonations = donations.filter(d => d.status === "CANCELLED").length;
  const totalUnits = donations.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Donation Management</h1>
        <Button onClick={handleAddDonation}>Record New Donation</Button>
      </div>

      {/* Donation Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Total Donations</div>
          <div className="text-2xl font-bold">{totalDonations}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">{completedDonations}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Scheduled</div>
          <div className="text-2xl font-bold text-yellow-600">{scheduledDonations}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Cancelled</div>
          <div className="text-2xl font-bold text-red-600">{cancelledDonations}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Total Units</div>
          <div className="text-2xl font-bold text-blue-600">{totalUnits}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donation Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blood Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{donation.donor.name}</div>
                    <div className="text-sm text-gray-500">{donation.donor.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(donation.donationDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{donation.quantity} units</div>
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(donation.status)}`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditDonation(donation)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDonation(donation.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Donation Modal would be implemented here */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedDonation ? "Edit Donation" : "Record New Donation"}
            </h2>
            <p className="text-gray-500 mb-4">
              Form would be implemented here with fields for donor, donation date, quantity, blood type, and status.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button>
                {selectedDonation ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
