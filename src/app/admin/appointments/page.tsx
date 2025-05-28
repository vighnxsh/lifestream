"use client";

import { useEffect, useState } from "react";
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
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
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

    fetchAppointments();
  }, []);

  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setShowAddModal(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAddModal(true);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update appointment status");
      }

      const responseData = await response.json(); // Store response data
      
      // Update the appointment in the list
      setAppointments(appointments.map(appointment => 
        appointment.id === id ? { ...appointment, status: newStatus } : appointment
      ));
    } catch (error) {
      alert("Error updating appointment status. Please try again.");
      console.error(error);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }

      // Remove the appointment from the list
      setAppointments(appointments.filter(appointment => appointment.id !== id));
    } catch (error) {
      alert("Error deleting appointment. Please try again.");
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

  // Function to check if date is in the past - used for future implementation
  // const isPast = (date: string) => {
  //   return new Date(date) < new Date() && !isToday(date);
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        <span className="ml-2">Loading appointments...</span>
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

  // Calculate appointment statistics
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(a => isToday(a.appointmentDate) && a.status === "SCHEDULED").length;
  const upcomingAppointments = appointments.filter(a => isFuture(a.appointmentDate) && a.status === "SCHEDULED").length;
  const completedAppointments = appointments.filter(a => a.status === "COMPLETED").length;
  const cancelledAppointments = appointments.filter(a => a.status === "CANCELLED").length;

  // Sort appointments by date (most recent first)
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Appointment Management</h1>
        <Button onClick={handleAddAppointment}>Schedule Appointment</Button>
      </div>

      {/* Appointment Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold">{totalAppointments}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Today</div>
          <div className="text-2xl font-bold text-blue-600">{todayAppointments}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Upcoming</div>
          <div className="text-2xl font-bold text-yellow-600">{upcomingAppointments}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">{completedAppointments}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Cancelled</div>
          <div className="text-2xl font-bold text-red-600">{cancelledAppointments}</div>
        </div>
      </div>

      {/* Today's Appointments */}
      {todayAppointments > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Today&apos;s Appointments</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
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
                  {sortedAppointments
                    .filter(a => isToday(a.appointmentDate) && a.status === "SCHEDULED")
                    .map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{appointment.user.name}</div>
                          <div className="text-sm text-gray-500">{appointment.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, "COMPLETED")}
                            className="text-green-600 hover:text-green-900 mr-2"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, "CANCELLED")}
                            className="text-red-600 hover:text-red-900 mr-2"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditAppointment(appointment)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All Appointments */}
      <div>
        <h2 className="text-xl font-bold mb-4">All Appointments</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donor
                  </th>
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
                {sortedAppointments.map((appointment) => (
                  <tr key={appointment.id} className={`hover:bg-gray-50 ${
                    isToday(appointment.appointmentDate) && appointment.status === "SCHEDULED" 
                      ? "bg-yellow-50" 
                      : ""
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{appointment.user.name}</div>
                      <div className="text-sm text-gray-500">{appointment.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      {appointment.status === "SCHEDULED" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, "COMPLETED")}
                            className="text-green-600 hover:text-green-900 mr-2"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, "CANCELLED")}
                            className="text-red-600 hover:text-red-900 mr-2"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEditAppointment(appointment)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAppointment(appointment.id)}
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

      {/* Add/Edit Appointment Modal would be implemented here */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedAppointment ? "Edit Appointment" : "Schedule Appointment"}
            </h2>
            <p className="text-gray-500 mb-4">
              Form would be implemented here with fields for donor, date, time, and notes.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button>
                {selectedAppointment ? "Update" : "Schedule"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
