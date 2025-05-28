import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET dashboard statistics (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can access dashboard statistics" },
        { status: 403 }
      );
    }

    // Get user statistics
    const userStats = await db.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    const totalUsers = await db.user.count();
    
    // Format user stats
    const userCounts = {
      total: totalUsers,
      donors: 0,
      recipients: 0,
    };
    
    userStats.forEach((stat: { role: string; _count: { id: number } }) => {
      if (stat.role === 'DONOR') {
        userCounts.donors = stat._count.id;
      } else if (stat.role === 'RECIPIENT') {
        userCounts.recipients = stat._count.id;
      }
    });

    // Get blood inventory statistics
    const bloodInventoryTotal = await db.bloodInventory.count();
    const bloodInventoryAvailable = await db.bloodInventory.count({
      where: { status: 'AVAILABLE' },
    });

    const bloodTypeStats = await db.bloodInventory.groupBy({
      by: ['bloodType'],
      _count: {
        id: true,
      },
      where: { status: 'AVAILABLE' },
    });

    // Format blood type stats
    const bloodTypeCounts: Record<string, number> = {
      A_POSITIVE: 0,
      A_NEGATIVE: 0,
      B_POSITIVE: 0,
      B_NEGATIVE: 0,
      AB_POSITIVE: 0,
      AB_NEGATIVE: 0,
      O_POSITIVE: 0,
      O_NEGATIVE: 0,
    };

    bloodTypeStats.forEach((stat: { bloodType: string; _count: { id: number } }) => {
      bloodTypeCounts[stat.bloodType] = stat._count.id;
    });

    // Get donation statistics
    const donationTotal = await db.donation.count();
    const donationCompleted = await db.donation.count({
      where: { status: 'COMPLETED' },
    });
    const donationScheduled = await db.donation.count({
      where: { status: 'SCHEDULED' },
    });

    // Get appointment statistics
    const appointmentTotal = await db.appointment.count();
    const appointmentScheduled = await db.appointment.count({
      where: { status: 'SCHEDULED' },
    });
    
    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const appointmentToday = await db.appointment.count({
      where: {
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
        status: 'SCHEDULED',
      },
    });

    // Get blood request statistics
    const requestTotal = await db.bloodRequest.count();
    const requestPending = await db.bloodRequest.count({
      where: { status: 'PENDING' },
    });
    const requestFulfilled = await db.bloodRequest.count({
      where: { status: 'FULFILLED' },
    });

    // Compile all statistics
    const stats = {
      users: userCounts,
      bloodInventory: {
        total: bloodInventoryTotal,
        available: bloodInventoryAvailable,
        byType: bloodTypeCounts,
      },
      donations: {
        total: donationTotal,
        completed: donationCompleted,
        scheduled: donationScheduled,
      },
      appointments: {
        total: appointmentTotal,
        scheduled: appointmentScheduled,
        today: appointmentToday,
      },
      requests: {
        total: requestTotal,
        pending: requestPending,
        fulfilled: requestFulfilled,
      },
    };

    return NextResponse.json({ stats });
  } catch (err) {
    console.error("Error fetching dashboard statistics:", err);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
