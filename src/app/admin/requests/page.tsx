"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { bloodTypeLabels } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface BloodRequest {
  id: string;
  requesterId: string;
  bloodInventoryId: string | null;
  bloodType: string;
  quantity: number;
  urgency: string;
  status: string;
  requestDate: string;
  fulfilledDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  requester: {
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

export default function AdminBloodRequestsPage() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [availableInventory, setAvailableInventory] = useState<any[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch("/api/blood-requests");
        
        if (!response.ok) {
          throw new Error("Failed to fetch blood requests");
        }
        
        const data = await response.json();
        setRequests(data.bloodRequests);
      } catch (error) {
        setError("Error loading blood requests. Please try again later.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/blood-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update request status");
      }

      const data = await response.json();
      
      // Update the request in the list
      setRequests(requests.map(request => 
        request.id === id ? { ...request, status: newStatus } : request
      ));
    } catch (error) {
      alert("Error updating request status. Please try again.");
      console.error(error);
    }
  };

  const handleFulfillRequest = (request: BloodRequest) => {
    setSelectedRequest(request);
    
    // In a real application, you would fetch available inventory here
    // For now, we'll use mock data
    const mockInventory = [
      { id: "inv1", bloodType: request.bloodType, quantity: 5, expiryDate: "2025-06-30" },
      { id: "inv2", bloodType: request.bloodType, quantity: 3, expiryDate: "2025-06-15" },
      { id: "inv3", bloodType: request.bloodType, quantity: 2, expiryDate: "2025-07-10" },
    ];
    
    setAvailableInventory(mockInventory);
    setShowFulfillModal(true);
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blood request?")) {
      return;
    }

    try {
      const response = await fetch(`/api/blood-requests/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete blood request");
      }

      // Remove the request from the list
      setRequests(requests.filter(request => request.id !== id));
    } catch (error) {
      alert("Error deleting blood request. Please try again.");
      console.error(error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "FULFILLED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "NORMAL":
        return "bg-blue-100 text-blue-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        <span className="ml-2">Loading blood requests...</span>
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

  // Calculate request statistics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === "PENDING").length;
  const approvedRequests = requests.filter(r => r.status === "APPROVED").length;
  const fulfilledRequests = requests.filter(r => r.status === "FULFILLED").length;
  const rejectedRequests = requests.filter(r => r.status === "REJECTED").length;
  const criticalRequests = requests.filter(r => r.urgency === "CRITICAL" && (r.status === "PENDING" || r.status === "APPROVED")).length;

  // Sort requests by urgency and date
  const sortedRequests = [...requests].sort((a, b) => {
    // First sort by status (PENDING and APPROVED first)
    const statusOrder = { PENDING: 0, APPROVED: 1, FULFILLED: 2, REJECTED: 3, CANCELLED: 4 };
    const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    if (statusDiff !== 0) return statusDiff;
    
    // Then sort by urgency
    const urgencyOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
    const urgencyDiff = urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder];
    if (urgencyDiff !== 0) return urgencyDiff;
    
    // Finally sort by date (newest first)
    return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Blood Request Management</h1>

      {/* Request Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold">{totalRequests}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Approved</div>
          <div className="text-2xl font-bold text-blue-600">{approvedRequests}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Fulfilled</div>
          <div className="text-2xl font-bold text-green-600">{fulfilledRequests}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Rejected</div>
          <div className="text-2xl font-bold text-red-600">{rejectedRequests}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Critical</div>
          <div className="text-2xl font-bold text-red-600">{criticalRequests}</div>
        </div>
      </div>

      {/* Critical Requests */}
      {criticalRequests > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Critical Requests</h2>
          <div className="bg-red-50 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Requester
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Blood Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Request Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedRequests
                    .filter(r => r.urgency === "CRITICAL" && (r.status === "PENDING" || r.status === "APPROVED"))
                    .map((request) => (
                      <tr key={request.id} className="hover:bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{request.requester.name}</div>
                          <div className="text-sm text-gray-500">{request.requester.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {bloodTypeLabels[request.bloodType]}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.quantity} units</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(request.requestDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateStatus(request.id, "APPROVED")}
                              className="text-blue-600 hover:text-blue-900 mr-2"
                            >
                              Approve
                            </button>
                          )}
                          {(request.status === "PENDING" || request.status === "APPROVED") && (
                            <>
                              <button
                                onClick={() => handleFulfillRequest(request)}
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                Fulfill
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(request.id, "REJECTED")}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All Requests */}
      <div>
        <h2 className="text-xl font-bold mb-4">All Blood Requests</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blood Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRequests.map((request) => (
                  <tr key={request.id} className={`hover:bg-gray-50 ${
                    request.urgency === "CRITICAL" && (request.status === "PENDING" || request.status === "APPROVED")
                      ? "bg-red-50"
                      : ""
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{request.requester.name}</div>
                      <div className="text-sm text-gray-500">{request.requester.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {bloodTypeLabels[request.bloodType]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.quantity} units</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getUrgencyBadgeClass(request.urgency)}`}>
                        {request.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(request.requestDate)}</div>
                      {request.fulfilledDate && (
                        <div className="text-xs text-gray-500">
                          Fulfilled: {formatDate(request.fulfilledDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(request.id, "APPROVED")}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, "REJECTED")}
                            className="text-red-600 hover:text-red-900 mr-2"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(request.status === "PENDING" || request.status === "APPROVED") && (
                        <button
                          onClick={() => handleFulfillRequest(request)}
                          className="text-green-600 hover:text-green-900 mr-2"
                        >
                          Fulfill
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
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
      </div>

      {/* Fulfill Request Modal */}
      {showFulfillModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              Fulfill Blood Request
            </h2>
            <div className="mb-4">
              <p className="text-gray-700">
                <span className="font-semibold">Requester:</span> {selectedRequest.requester.name}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Blood Type:</span> {bloodTypeLabels[selectedRequest.bloodType]}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Quantity:</span> {selectedRequest.quantity} units
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Urgency:</span> {selectedRequest.urgency}
              </p>
            </div>
            
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Available Blood Inventory</h3>
              {availableInventory.length > 0 ? (
                <div className="bg-gray-50 p-2 rounded max-h-60 overflow-y-auto">
                  {availableInventory.map((item) => (
                    <div key={item.id} className="p-2 border-b border-gray-200 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{bloodTypeLabels[item.bloodType]}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} units, expires {formatDate(item.expiryDate)}
                        </p>
                      </div>
                      <Button size="sm">Select</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-red-600">No matching blood inventory available</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => setShowFulfillModal(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={availableInventory.length === 0}
              >
                Fulfill Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
