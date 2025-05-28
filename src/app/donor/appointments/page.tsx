"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface Appointment {
  id: string;
  userId: string;
  appointmentDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DonorAppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated or not a donor
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && session.user.role !== "DONOR") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!session?.user.id) return;

      try {
        const response = await fetch("/api/appointments");
        
        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }
        
        const data = await response.json();
        setAppointments(data.appointments);
      } catch (error) {
        setError("Error loading appointments. Please try again later.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user.id) {
      fetchAppointments();
    }
  }, [session?.user.id]);

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time
      const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);
      
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentDate: dateTime.toISOString(),
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule appointment");
      }

      const data = await response.json();
      
      // Add the new appointment to the list
      setAppointments([...appointments, data.appointment]);
      
      // Reset form and close modal
      setAppointmentDate("");
      setAppointmentTime("");
      setNotes("");
      setShowScheduleModal(false);
    } catch (error) {
      setError("Error scheduling appointment. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel appointment");
      }

      // Update the appointment in the list
      setAppointments(appointments.map(appointment => 
        appointment.id === id ? { ...appointment, status: "CANCELLED" } : appointment
      ));
    } catch (error) {
      setError("Error cancelling appointment. Please try again.");
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

  const isToday = (date: string) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    return (
      appointmentDate.getDate() === today.getDate() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getFullYear() === today.getFullYear()
    );
  };

  const isFuture = (date: string) => {
    return new Date(date) > new Date();
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

  // Filter appointments
  const upcomingAppointments = appointments.filter(a => 
    a.status === "SCHEDULED" && isFuture(a.appointmentDate)
  );
  const pastAppointments = appointments.filter(a => 
    a.status === "COMPLETED" || (a.status === "SCHEDULED" && !isFuture(a.appointmentDate))
  );
  const cancelledAppointments = appointments.filter(a => 
    a.status === "CANCELLED"
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <Button onClick={() => setShowScheduleModal(true)}>Schedule Donation</Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Upcoming Appointments</h2>
        {upcomingAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">You don&apos;t have any upcoming appointments.</p>
            <p className="mt-2">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Schedule a donation
              </button>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingAppointments.map((appointment) => (
                    <tr key={appointment.id} className={`hover:bg-gray-50 ${
                      isToday(appointment.appointmentDate) ? "bg-yellow-50" : ""
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {isToday(appointment.appointmentDate) && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Today
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {appointment.notes || "No notes"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Past Appointments</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pastAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {appointment.notes || "No notes"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Appointments */}
      {cancelledAppointments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Cancelled Appointments</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cancelledAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {appointment.notes || "No notes"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Appointment Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Schedule Donation Appointment</h2>
            <form onSubmit={handleScheduleAppointment}>
              <div className="mb-4">
                <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="appointmentDate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  id="appointmentTime"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Scheduling..." : "Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
