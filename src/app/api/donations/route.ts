import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validation
const donationSchema = z.object({
  donationDate: z.string().datetime(),
  quantity: z.number().int().positive().default(1),
  bloodType: z.enum([
    "A_POSITIVE", "A_NEGATIVE", 
    "B_POSITIVE", "B_NEGATIVE", 
    "AB_POSITIVE", "AB_NEGATIVE", 
    "O_POSITIVE", "O_NEGATIVE"
  ]).optional(),
});

// GET all donations (admin sees all, donors see only their own)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Admins can see all donations
    if (session.user.role === "ADMIN") {
      const donations = await db.donation.findMany({
        include: { 
          donor: { select: { id: true, name: true, email: true } },
          bloodInventory: true 
        },
        orderBy: { donationDate: "desc" },
      });
      return NextResponse.json({ donations });
    }

    // Donors can only see their own donations
    if (session.user.role === "DONOR") {
      const donations = await db.donation.findMany({
        where: { donorId: session.user.id },
        include: { bloodInventory: true },
        orderBy: { donationDate: "desc" },
      });
      return NextResponse.json({ donations });
    }

    // Recipients cannot see donations
    return NextResponse.json(
      { error: "You don't have permission to view donations" },
      { status: 403 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}

// POST new donation (admin only can record completed donations)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Only admins can record completed donations
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can record donations" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { donationDate, quantity, bloodType } = donationSchema.parse(body);
    
    // Ensure donorId is provided
    if (!body.donorId) {
      return NextResponse.json(
        { error: "Donor ID is required" },
        { status: 400 }
      );
    }

    // Check if the donor exists and is a donor
    const donor = await db.user.findUnique({
      where: { id: body.donorId },
    });

    if (!donor || donor.role !== "DONOR") {
      return NextResponse.json(
        { error: "Invalid donor ID" },
        { status: 400 }
      );
    }

    // Create the donation
    const donation = await db.donation.create({
      data: {
        donorId: body.donorId,
        donationDate: new Date(donationDate),
        quantity,
        status: "COMPLETED",
      },
    });

    // If blood type is provided, add to blood inventory
    if (bloodType) {
      // Calculate expiry date (typically 42 days for whole blood)
      const expiryDate = new Date(donationDate);
      expiryDate.setDate(expiryDate.getDate() + 42);

      // Add to blood inventory
      const bloodInventory = await db.bloodInventory.create({
        data: {
          bloodType,
          quantity,
          expiryDate,
          status: "AVAILABLE",
        },
      });

      // Link the donation to the blood inventory
      await db.donation.update({
        where: { id: donation.id },
        data: { bloodInventoryId: bloodInventory.id },
      });

      return NextResponse.json(
        { 
          donation, 
          bloodInventory,
          message: "Donation recorded and added to inventory successfully" 
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { donation, message: "Donation recorded successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
