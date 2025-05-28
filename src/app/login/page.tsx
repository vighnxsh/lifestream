"use client";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto">
        <LoginForm />
      </div>
    </div>
  );
}
