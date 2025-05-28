import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod";

// Schema for validation
const userUpdateSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).optional(),
  role: z.enum(["ADMIN", "DONOR", "RECIPIENT"]).optional(),
});

// GET a specific user
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
    
    // Users can view their own profile, admins can view any profile
    if (session.user.id !== id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to view this user" },
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
        createdAt: true,
        updatedAt: true,
        // Include related records if admin
        ...(session.user.role === "ADMIN" ? {
          donations: {
            select: {
              id: true,
              donationDate: true,
              status: true,
            },
            orderBy: { donationDate: "desc" },
            take: 5,
          },
          appointments: {
            select: {
              id: true,
              appointmentDate: true,
              status: true,
            },
            orderBy: { appointmentDate: "desc" },
            take: 5,
          },
          bloodRequests: {
            select: {
              id: true,
              bloodType: true,
              status: true,
              requestDate: true,
            },
            orderBy: { requestDate: "desc" },
            take: 5,
          },
        } : {}),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH (update) a specific user
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

    const id = params.id;
    
    // Users can update their own profile, admins can update any profile
    if (session.user.id !== id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to update this user" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role } = userUpdateSchema.parse(body);

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

    // Regular users cannot change their role
    if (role && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to change roles" },
        { status: 403 }
      );
    }

    // If email is being updated, check if it's already in use
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedData: any = {};
    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    if (password) updatedData.password = await hash(password, 10);
    if (role) updatedData.role = role;

    const user = await db.user.update({
      where: { id },
      data: updatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ 
      user, 
      message: "User updated successfully" 
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

// DELETE a specific user (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can delete users
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can delete users" },
        { status: 403 }
      );
    }

    const id = params.id;

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

    // Prevent deleting your own account
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: "User deleted successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
