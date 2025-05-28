"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

interface BloodRequest {
  id: string;
  userId: string;
  bloodType: string;
  quantity: number;
  urgency: string;
  status: string;
  hospitalName: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export default function RecipientRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [bloodType, setBloodType] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [urgency, setUrgency] = useState<string>("NORMAL");
  const [hospitalName, setHospitalName] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated or not a recipient
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && session.user.role !== "RECIPIENT") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!session?.user.id) return;

      try {
        const response = await fetch("/api/blood-requests");
        
        if (!response.ok) {
          throw new Error("Failed to fetch blood requests");
        }
        
        const data = await response.json();
        setRequests(data.requests);
      } catch (error) {
        setError("Error loading blood requests. Please try again later.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user.id) {
      fetchRequests();
    }
  }, [session?.user.id]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/blood-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bloodType,
          quantity,
          urgency,
          hospitalName,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create blood request");
      }

      const data = await response.json();
      
      // Add the new request to the list
      setRequests([...requests, data.request]);
      
      // Reset form and close modal
      setBloodType("");
      setQuantity(1);
      setUrgency("NORMAL");
      setHospitalName("");
      setReason("");
      setShowRequestModal(false);
    } catch (error) {
      setError("Error creating blood request. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/blood-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "CANCELLED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel blood request");
      }

      // Update the request status in the UI
      setRequests(
        requests.map((req) =>
          req.id === requestId ? { ...req, status: "CANCELLED" } : req
        )
      );
    } catch (error) {
      setError("Error cancelling request. Please try again.");
      console.error(error);
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        <span className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading your blood requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto my-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-2 text-gray-900 dark:text-white"
        >
          My Blood Requests
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-600 dark:text-gray-400"
        >
          Manage your blood requests and track their status
        </motion.p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Your Requests
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {requests?.length || 0} {(requests?.length || 0) === 1 ? 'request' : 'requests'} found
          </p>
        </div>
        <Button 
          onClick={() => setShowRequestModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Request
        </Button>
      </div>

      {(requests?.length || 0) === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center"
        >
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No Blood Requests</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't made any blood requests yet. Click the button above to create your first request.
          </p>
          <Button 
            onClick={() => setShowRequestModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Create Your First Request
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((request, index) => (
            <motion.div 
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className={`overflow-hidden border-t-4 ${
                request.status === 'FULFILLED' ? 'border-t-green-500' :
                request.status === 'PENDING' ? 'border-t-yellow-500' :
                request.status === 'CANCELLED' ? 'border-t-gray-500' :
                request.urgency === 'CRITICAL' ? 'border-t-red-500' :
                request.urgency === 'HIGH' ? 'border-t-orange-500' :
                'border-t-blue-500'
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {request.quantity} unit{request.quantity > 1 ? 's' : ''} of {request.bloodType.replace('_', '')}
                      </CardTitle>
                      <CardDescription>
                        Created on {formatDate(request.createdAt)}
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'FULFILLED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      request.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {request.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{request.hospitalName}</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Urgency: <span className={`font-medium ${
                          request.urgency === 'CRITICAL' ? 'text-red-600 dark:text-red-400' :
                          request.urgency === 'HIGH' ? 'text-orange-600 dark:text-orange-400' :
                          'text-blue-600 dark:text-blue-400'
                        }`}>{request.urgency}</span>
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  {request.status === 'PENDING' && (
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                      onClick={() => handleCancelRequest(request.id)}
                    >
                      Cancel Request
                    </Button>
                  )}
                  {request.status === 'FULFILLED' && (
                    <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20">
                      View Details
                    </Button>
                  )}
                  {request.status === 'CANCELLED' && (
                    <Button 
                      variant="outline" 
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20"
                      onClick={() => setShowRequestModal(true)}
                    >
                      Create New Request
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">New Blood Request</h3>
                <button 
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateRequest}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Blood Type *
                    </label>
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A_POSITIVE">A+</option>
                      <option value="A_NEGATIVE">A-</option>
                      <option value="B_POSITIVE">B+</option>
                      <option value="B_NEGATIVE">B-</option>
                      <option value="AB_POSITIVE">AB+</option>
                      <option value="AB_NEGATIVE">AB-</option>
                      <option value="O_POSITIVE">O+</option>
                      <option value="O_NEGATIVE">O-</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity (Units) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Urgency *
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hospital Name *
                    </label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter hospital name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reason *
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Briefly explain the reason for this request"
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRequestModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
