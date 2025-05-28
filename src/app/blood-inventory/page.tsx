"use client";

import { useEffect, useState } from "react";
import { bloodTypeLabels } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

interface BloodInventory {
  id: string;
  bloodType: string;
  quantity: number;
  expiryDate: string;
  status: string;
}

export default function BloodInventoryPage() {
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Group inventory by blood type for better display
  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.bloodType]) {
      acc[item.bloodType] = [];
    }
    acc[item.bloodType].push(item);
    return acc;
  }, {} as Record<string, BloodInventory[]>);

  // Calculate total available quantity for each blood type
  const bloodTypeTotals = Object.keys(groupedInventory).reduce((acc, bloodType) => {
    acc[bloodType] = groupedInventory[bloodType]
      .filter(item => item.status === "AVAILABLE")
      .reduce((sum, item) => sum + item.quantity, 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto py-16 px-4 max-w-6xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Blood Inventory</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Current blood supply levels and availability. Our inventory is updated in real-time to reflect donations and usage.
        </p>
      </div>
      
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading inventory data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-sm my-8">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        </div>
      ) : (
        <>
          {/* Blood Availability Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Current Blood Availability
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {Object.keys(bloodTypeLabels).map((bloodType) => {
                const quantity = bloodTypeTotals[bloodType] || 0;
                return (
                  <motion.div 
                    key={bloodType}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`p-6 rounded-lg shadow-sm text-center ${
                      quantity > 10 ? "bg-green-50 border border-green-100" : 
                      quantity > 0 ? "bg-yellow-50 border border-yellow-100" : 
                      "bg-red-50 border border-red-100"
                    }`}
                  >
                    <div className="text-3xl font-bold mb-2 text-red-600">
                      {bloodTypeLabels[bloodType]}
                    </div>
                    <div className="text-lg font-medium">
                      {quantity} {quantity === 1 ? "unit" : "units"}
                    </div>
                    <div className={`text-sm mt-2 py-1 px-2 rounded-full inline-block ${
                      quantity > 10 ? "bg-green-200 text-green-800" : 
                      quantity > 0 ? "bg-yellow-200 text-yellow-800" : 
                      "bg-red-200 text-red-800"
                    }`}>
                      {quantity > 10 ? "Well Stocked" : quantity > 0 ? "Available" : "Critical"}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Request and Donation Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Blood Donation Request */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-red-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-xl shadow-md"
            >
              <div className="mb-6 flex items-start">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Need Blood?</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    If you or someone you know needs blood, please register as a recipient and submit a blood request.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Register as Recipient
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Login to Request
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Become a Donor */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-xl shadow-md"
            >
              <div className="mb-6 flex items-start">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Become a Donor</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your donation can save up to 3 lives! Healthy individuals who are at least 18 years old and weigh at least 110 pounds may be eligible to donate blood.
                  </p>
                </div>
              </div>
              
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold mb-3 text-gray-900 dark:text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Benefits of Donating Blood:
                </h3>
                <ul className="space-y-2">
                  {[
                    "Free health screening",
                    "Reduced risk of heart disease",
                    "Stimulates blood cell production",
                    "Burns calories",
                    "Satisfaction of saving lives"
                  ].map((benefit, index) => (
                    <motion.li 
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (index * 0.1) }}
                      className="flex items-center text-gray-700 dark:text-gray-300"
                    >
                      <svg className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              <Link href="/register">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Register as Donor
                </Button>
              </Link>
            </motion.div>
          </div>
          
          {/* Blood Facts Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-8"
          >
            <h2 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-white">Blood Donation Facts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-red-600 text-4xl font-bold mb-2">4.5M</div>
                <p className="text-gray-600 dark:text-gray-400">Americans need blood transfusions each year</p>
              </div>
              <div className="text-center">
                <div className="text-red-600 text-4xl font-bold mb-2">3</div>
                <p className="text-gray-600 dark:text-gray-400">Lives saved with each donation</p>
              </div>
              <div className="text-center">
                <div className="text-red-600 text-4xl font-bold mb-2">10-12</div>
                <p className="text-gray-600 dark:text-gray-400">Minutes is all it takes to donate</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
