"use client";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto">
        <RegisterForm />
      </div>
    </div>
  );
}
