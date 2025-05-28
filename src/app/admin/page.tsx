"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bloodTypeLabels } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  users: {
    total: number;
    donors: number;
    recipients: number;
  };
  bloodInventory: {
    total: number;
    available: number;
    byType: Record<string, number>;
  };
  donations: {
    total: number;
    completed: number;
    scheduled: number;
  };
  appointments: {
    total: number;
    scheduled: number;
    today: number;
  };
  requests: {
    total: number;
    pending: number;
    fulfilled: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch real data from the API
        const response = await fetch("/api/admin/dashboard");
        
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        
        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        // Fallback to mock data if the API call fails
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard statistics. Using sample data instead.");
        
        // Mock data as fallback
        const fallbackStats: DashboardStats = {
          users: {
            total: 0,
            donors: 0,
            recipients: 0,
          },
          bloodInventory: {
            total: 0,
            available: 0,
            byType: {
              A_POSITIVE: 0,
              A_NEGATIVE: 0,
              B_POSITIVE: 0,
              B_NEGATIVE: 0,
              AB_POSITIVE: 0,
              AB_NEGATIVE: 0,
              O_POSITIVE: 0,
              O_NEGATIVE: 0,
            },
          },
          donations: {
            total: 0,
            completed: 0,
            scheduled: 0,
          },
          appointments: {
            total: 0,
            scheduled: 0,
            today: 0,
          },
          requests: {
            total: 0,
            pending: 0,
            fulfilled: 0,
          },
        };
        
        setStats(fallbackStats);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        <span className="mt-4 text-gray-600 dark:text-black font-medium">Loading dashboard data...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-3xl mx-auto my-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error || "Failed to load dashboard data"}
          </div>
        </div>
        
        {stats && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-black mb-4">Showing fallback data. Some features may be limited.</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-2 text-gray-900 dark:text-white"
        >
          Admin Dashboard
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-600 dark:text-black"
        >
          Overview of blood bank operations, inventory, and user statistics
        </motion.p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="overflow-hidden border-t-4 border-t-blue-500 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{stats.users.total}</p>
                  <p className="text-sm text-gray-500 dark:text-black">Total Users</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-black mr-2">Donors:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.users.donors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-black mr-2">Recipients:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{stats.users.recipients}</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full" 
                  style={{ width: `${(stats.users.donors / stats.users.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-black mt-1">
                <span>Donors: {Math.round((stats.users.donors / stats.users.total) * 100)}%</span>
                <span>Recipients: {Math.round((stats.users.recipients / stats.users.total) * 100)}%</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Link href="/admin/users" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium inline-flex items-center">
                View all users
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="overflow-hidden border-t-4 border-t-red-500 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Blood Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{stats.bloodInventory.available}</p>
                  <p className="text-sm text-gray-500 dark:text-black">Available Units</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-black">Total: {stats.bloodInventory.total} units</p>
                  <div className="flex items-center justify-end mt-1">
                    <div className="w-3 h-3 rounded-full mr-1 bg-red-500"></div>
                    <p className="text-xs text-gray-500 dark:text-black">
                      {Math.round((stats.bloodInventory.available / stats.bloodInventory.total) * 100)}% available
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${(stats.bloodInventory.available / stats.bloodInventory.total) * 100}%` }}
                ></div>
              </div>
              
              {/* Blood type mini chart */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {Object.entries(stats.bloodInventory.byType).slice(0, 4).map(([type, count]) => (
                  <div key={type} className="text-center">
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">{bloodTypeLabels[type]}</div>
                    <div className="text-xs text-gray-600 dark:text-black">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Link href="/admin/blood-inventory" className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium inline-flex items-center">
                Manage inventory
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="overflow-hidden border-t-4 border-t-purple-500 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Requests & Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-black">Pending Requests</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{stats.requests.pending}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full mt-1">
                      <div 
                        className="bg-red-500 h-1 rounded-full" 
                        style={{ width: `${(stats.requests.pending / stats.requests.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-black">Today&apos;s Appointments</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.appointments.today}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full mt-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full" 
                        style={{ width: `${(stats.appointments.today / stats.appointments.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-black">Scheduled Donations</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{stats.donations.scheduled}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full mt-1">
                      <div 
                        className="bg-green-500 h-1 rounded-full" 
                        style={{ width: `${(stats.donations.scheduled / stats.donations.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              <Link href="/admin/requests" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium inline-flex items-center">
                View requests
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link href="/admin/appointments" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium inline-flex items-center">
                View appointments
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      
      {/* Blood Inventory by Type */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-8"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Blood Inventory by Type
            </CardTitle>
            <CardDescription>
              Current inventory levels for each blood type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.keys(stats.bloodInventory.byType).map((bloodType, index) => (
                <motion.div 
                  key={bloodType} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  className={`p-4 rounded-lg shadow-sm border ${stats.bloodInventory.byType[bloodType] > 10 ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900' : stats.bloodInventory.byType[bloodType] > 0 ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900' : 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {bloodTypeLabels[bloodType]}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${stats.bloodInventory.byType[bloodType] > 10 ? 'bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300' : stats.bloodInventory.byType[bloodType] > 0 ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {stats.bloodInventory.byType[bloodType] > 10 ? 'Adequate' : stats.bloodInventory.byType[bloodType] > 0 ? 'Low' : 'Critical'}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {stats.bloodInventory.byType[bloodType]} units
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${stats.bloodInventory.byType[bloodType] > 10 ? 'bg-green-500' : stats.bloodInventory.byType[bloodType] > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${Math.min((stats.bloodInventory.byType[bloodType] / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Recent Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600 dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions and events in the blood bank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* This would be populated with real data in a production app */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">New donation recorded</p>
                  <p className="text-sm text-gray-600 dark:text-black">John Doe donated 1 unit of O+ blood</p>
                  <div className="flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black dark:text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-black dark:text-gray-500">10 minutes ago</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">Appointment scheduled</p>
                  <p className="text-sm text-gray-600 dark:text-black">Jane Smith scheduled a donation for tomorrow</p>
                  <div className="flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black dark:text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-black dark:text-gray-500">1 hour ago</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">Blood request received</p>
                  <p className="text-sm text-gray-600 dark:text-black">Memorial Hospital requested 3 units of AB-</p>
                  <div className="flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black dark:text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-black dark:text-gray-500">3 hours ago</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-start p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">New user registered</p>
                  <p className="text-sm text-gray-600 dark:text-black">Michael Johnson registered as a donor</p>
                  <div className="flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black dark:text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-black dark:text-gray-500">5 hours ago</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full text-sm">
              View All Activity
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
