"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    donations: number;
    appointments: number;
    bloodRequests: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        setError("Error loading users. Please try again later.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowAddUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowAddUserModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Remove the user from the list
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      alert("Error deleting user. Please try again.");
      console.error(error);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "DONOR":
        return "bg-green-100 text-green-800";
      case "RECIPIENT":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        <span className="ml-2">Loading users...</span>
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={handleAddUser}>Add New User</Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {user.role === "DONOR" && (
                        <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                          {user._count.donations} donations
                        </span>
                      )}
                      {user.role === "RECIPIENT" && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {user._count.bloodRequests} requests
                        </span>
                      )}
                      <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded">
                        {user._count.appointments} appointments
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={user.role === "ADMIN"}
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

      {/* Add/Edit User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedUser ? "Edit User" : "Add New User"}
            </h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData = {
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                role: formData.get("role") as "ADMIN" | "DONOR" | "RECIPIENT",
                ...(selectedUser ? {} : { password: formData.get("password") as string }),
              };
              
              try {
                const url = selectedUser 
                  ? `/api/users/${selectedUser.id}` 
                  : "/api/users";
                  
                const method = selectedUser ? "PATCH" : "POST";
                
                const response = await fetch(url, {
                  method,
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(userData),
                });
                
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || "Failed to save user");
                }
                
                const data = await response.json();
                
                if (selectedUser) {
                  // Update existing user in the list
                  setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...data.user } : u));
                } else {
                  // Add new user to the list with empty counts
                  setUsers([{ 
                    ...data.user, 
                    _count: { donations: 0, appointments: 0, bloodRequests: 0 } 
                  }, ...users]);
                }
                
                setShowAddUserModal(false);
              } catch (error) {
                alert(error instanceof Error ? error.message : "An error occurred");
                console.error(error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={selectedUser?.name || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={selectedUser?.email || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                {!selectedUser && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                      minLength={8}
                    />
                  </div>
                )}
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue={selectedUser?.role || "RECIPIENT"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="DONOR">Donor</option>
                    <option value="RECIPIENT">Recipient</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedUser ? "Save Changes" : "Add User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
