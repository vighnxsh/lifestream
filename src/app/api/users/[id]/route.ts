import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validation
const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "DONOR", "RECIPIENT"]).optional(),
  bloodType: z.enum([
    "A_POSITIVE", "A_NEGATIVE", 
    "B_POSITIVE", "B_NEGATIVE", 
    "AB_POSITIVE", "AB_NEGATIVE", 
    "O_POSITIVE", "O_NEGATIVE"
  ]).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
});

// GET a specific user
export async function GET(
  request: Request
) {
  try {
    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Regular users can only view their own profile
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
      return NextResponse.json(
        { error: "Unauthorized. You can only view your own profile." },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bloodType: true,
        address: true,
        phone: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Error fetching user:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH (update) a specific user
export async function PATCH(
  request: Request
) {
  try {
    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Regular users can only update their own profile
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
      return NextResponse.json(
        { error: "Unauthorized. You can only update your own profile." },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Parse and validate the request body
    const validatedData = userUpdateSchema.parse(body);

    // Regular users cannot change their role
    if (session.user.role !== "ADMIN" && validatedData.role) {
      return NextResponse.json(
        { error: "Unauthorized. You cannot change your role." },
        { status: 403 }
      );
    }

    // If email is being updated, check if it's already in use
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bloodType: true,
        address: true,
        phone: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    console.error("Error updating user:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE a specific user (admin only)
export async function DELETE(
  request: Request
) {
  try {
    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Only admins can delete users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can delete users." },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete user
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
