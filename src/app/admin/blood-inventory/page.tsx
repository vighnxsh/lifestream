"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { bloodTypeLabels } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface BloodInventory {
  id: string;
  bloodType: string;
  quantity: number;
  expiryDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBloodInventoryPage() {
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BloodInventory | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch("/api/blood-inventory");
        
        if (!response.ok) {
          throw new Error("Failed to fetch blood inventory");
        }
        
        const data = await response.json();
        setInventory(data.bloodInventory);
      } catch (error) {
        setError("Error loading blood inventory. Please try again later.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleAddInventory = () => {
    setSelectedItem(null);
    setShowAddModal(true);
  };

  const handleEditInventory = (item: BloodInventory) => {
    setSelectedItem(item);
    setShowAddModal(true);
  };

  const handleDeleteInventory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) {
      return;
    }

    try {
      const response = await fetch(`/api/blood-inventory/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete inventory item");
      }

      // Remove the item from the list
      setInventory(inventory.filter(item => item.id !== id));
    } catch (error) {
      alert("Error deleting inventory item. Please try again.");
      console.error(error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "RESERVED":
        return "bg-yellow-100 text-yellow-800";
      case "USED":
        return "bg-blue-100 text-blue-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        <span className="ml-2">Loading inventory...</span>
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

  // Group inventory by blood type for summary
  const bloodTypeGroups = inventory.reduce((acc, item) => {
    if (!acc[item.bloodType]) {
      acc[item.bloodType] = {
        total: 0,
        available: 0,
      };
    }
    acc[item.bloodType].total += item.quantity;
    if (item.status === "AVAILABLE") {
      acc[item.bloodType].available += item.quantity;
    }
    return acc;
  }, {} as Record<string, { total: number; available: number }>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blood Inventory Management</h1>
        <Button onClick={handleAddInventory}>Add Blood Units</Button>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.keys(bloodTypeLabels).map((bloodType) => {
          const group = bloodTypeGroups[bloodType] || { total: 0, available: 0 };
          return (
            <div key={bloodType} className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {bloodTypeLabels[bloodType]}
              </div>
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-500">Available</div>
                  <div className="text-xl font-semibold">{group.available}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-xl font-semibold">{group.total}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blood Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added On
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{bloodTypeLabels[item.bloodType]}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{item.quantity} units</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      isExpired(item.expiryDate) 
                        ? "text-red-600 font-semibold" 
                        : isExpiringSoon(item.expiryDate) 
                          ? "text-yellow-600 font-semibold" 
                          : "text-gray-500"
                    }`}>
                      {formatDate(item.expiryDate)}
                      {isExpired(item.expiryDate) && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          Expired
                        </span>
                      )}
                      {isExpiringSoon(item.expiryDate) && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          Expiring soon
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditInventory(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInventory(item.id)}
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

      {/* Add/Edit Inventory Modal would be implemented here */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedItem ? "Edit Blood Inventory" : "Add Blood Units"}
            </h2>
            <p className="text-gray-500 mb-4">
              Form would be implemented here with fields for blood type, quantity, expiry date, and status.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button>
                {selectedItem ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
