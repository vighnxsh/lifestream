import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validation
const bloodInventoryUpdateSchema = z.object({
  bloodType: z.enum([
    "A_POSITIVE", "A_NEGATIVE", 
    "B_POSITIVE", "B_NEGATIVE", 
    "AB_POSITIVE", "AB_NEGATIVE", 
    "O_POSITIVE", "O_NEGATIVE"
  ]).optional(),
  quantity: z.number().int().positive().optional(),
  expiryDate: z.string().datetime().optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "USED", "EXPIRED"]).optional(),
});

// GET a specific blood inventory item
export async function GET(
  request: Request
) {
  try {
    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const bloodInventory = await db.bloodInventory.findUnique({
      where: { id },
    });

    if (!bloodInventory) {
      return NextResponse.json(
        { error: "Blood inventory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ bloodInventory });
  } catch (err) {
    console.error("Error fetching blood inventory:", err);
    return NextResponse.json(
      { error: "Failed to fetch blood inventory" },
      { status: 500 }
    );
  }
}

// PATCH (update) a specific blood inventory item (admin only)
export async function PATCH(
  request: Request
) {
  try {
    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can update blood inventory" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bloodType, quantity, expiryDate, status } = bloodInventoryUpdateSchema.parse(body);

    // Check if blood inventory exists
    const existingInventory = await db.bloodInventory.findUnique({
      where: { id },
    });

    if (!existingInventory) {
      return NextResponse.json(
        { error: "Blood inventory not found" },
        { status: 404 }
      );
    }

    // Update blood inventory
    const updatedInventory = await db.bloodInventory.update({
      where: { id },
      data: {
        ...(bloodType && { bloodType }),
        ...(quantity !== undefined && { quantity }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ bloodInventory: updatedInventory });
  } catch (err) {
    console.error("Error updating blood inventory:", err);
    return NextResponse.json(
      { error: "Failed to update blood inventory" },
      { status: 500 }
    );
  }
}

// DELETE a specific blood inventory item (admin only)
export async function DELETE(
  request: Request
) {
  try {
    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can delete blood inventory" },
        { status: 403 }
      );
    }

    // Check if blood inventory exists
    const existingInventory = await db.bloodInventory.findUnique({
      where: { id },
    });

    if (!existingInventory) {
      return NextResponse.json(
        { error: "Blood inventory not found" },
        { status: 404 }
      );
    }

    // Delete blood inventory
    await db.bloodInventory.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Blood inventory deleted successfully" });
  } catch (err) {
    console.error("Error deleting blood inventory:", err);
    return NextResponse.json(
      { error: "Failed to delete blood inventory" },
      { status: 500 }
    );
  }
}
