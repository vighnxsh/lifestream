import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validation
const donationUpdateSchema = z.object({
  donationDate: z.string().datetime().optional(),
  quantity: z.number().int().positive().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  bloodInventoryId: z.string().optional().nullable(),
});

// GET a specific donation
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const id = params.id;
    
    const donation = await db.donation.findUnique({
      where: { id },
      include: { 
        donor: { select: { id: true, name: true, email: true } },
        bloodInventory: true 
      },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // Regular donors can only view their own donations
    if (session.user.role !== "ADMIN" && donation.donorId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to view this donation" },
        { status: 403 }
      );
    }

    return NextResponse.json({ donation });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch donation" },
      { status: 500 }
    );
  }
}

// PATCH (update) a specific donation (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Only admins can update donations
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can update donations" },
        { status: 403 }
      );
    }

    const id = params.id;
    const body = await req.json();
    const { donationDate, quantity, status, bloodInventoryId } = donationUpdateSchema.parse(body);

    // Check if donation exists
    const existingDonation = await db.donation.findUnique({
      where: { id },
      include: { bloodInventory: true },
    });

    if (!existingDonation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // Update donation
    const updatedData: any = {};
    if (donationDate) updatedData.donationDate = new Date(donationDate);
    if (quantity !== undefined) updatedData.quantity = quantity;
    if (status) updatedData.status = status;
    if (bloodInventoryId !== undefined) updatedData.bloodInventoryId = bloodInventoryId;

    const donation = await db.donation.update({
      where: { id },
      data: updatedData,
      include: { bloodInventory: true },
    });

    return NextResponse.json({ 
      donation, 
      message: "Donation updated successfully" 
    });
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

// DELETE a specific donation (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Only admins can delete donations
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete donations" },
        { status: 403 }
      );
    }

    const id = params.id;

    // Check if donation exists
    const existingDonation = await db.donation.findUnique({
      where: { id },
      include: { bloodInventory: true },
    });

    if (!existingDonation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // If donation is linked to blood inventory, update or delete the inventory
    if (existingDonation.bloodInventoryId) {
      // Option: Delete the blood inventory if it's solely from this donation
      await db.bloodInventory.delete({
        where: { id: existingDonation.bloodInventoryId },
      });
    }

    // Delete donation
    await db.donation.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: "Donation deleted successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
