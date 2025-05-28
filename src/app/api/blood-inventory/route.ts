import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validation
const bloodInventorySchema = z.object({
  bloodType: z.enum([
    "A_POSITIVE", "A_NEGATIVE", 
    "B_POSITIVE", "B_NEGATIVE", 
    "AB_POSITIVE", "AB_NEGATIVE", 
    "O_POSITIVE", "O_NEGATIVE"
  ]),
  quantity: z.number().int().positive(),
  expiryDate: z.string().datetime(),
  status: z.enum(["AVAILABLE", "RESERVED", "USED", "EXPIRED"]).default("AVAILABLE"),
});

// GET all blood inventory
export async function GET() {
  try {
    const bloodInventory = await db.bloodInventory.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ bloodInventory });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch blood inventory" },
      { status: 500 }
    );
  }
}

// POST new blood inventory (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can add blood inventory" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bloodType, quantity, expiryDate, status } = bloodInventorySchema.parse(body);

    const bloodInventory = await db.bloodInventory.create({
      data: {
        bloodType,
        quantity,
        expiryDate: new Date(expiryDate),
        status,
      },
    });

    return NextResponse.json(
      { bloodInventory, message: "Blood inventory added successfully" },
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
