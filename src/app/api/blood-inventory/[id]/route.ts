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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch blood inventory" },
      { status: 500 }
    );
  }
}

// PATCH (update) a specific blood inventory item (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can update blood inventory" },
        { status: 403 }
      );
    }

    const id = params.id;
    const body = await req.json();
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
    const updatedData: any = {};
    if (bloodType) updatedData.bloodType = bloodType;
    if (quantity !== undefined) updatedData.quantity = quantity;
    if (expiryDate) updatedData.expiryDate = new Date(expiryDate);
    if (status) updatedData.status = status;

    const bloodInventory = await db.bloodInventory.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json({ 
      bloodInventory, 
      message: "Blood inventory updated successfully" 
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

// DELETE a specific blood inventory item (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can delete blood inventory" },
        { status: 403 }
      );
    }

    const id = params.id;

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

    return NextResponse.json({ 
      message: "Blood inventory deleted successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
