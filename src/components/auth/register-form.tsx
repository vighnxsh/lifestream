import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { roleOptions } from "@/lib/utils";

// Form validation schema
const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  role: z.enum(["DONOR", "RECIPIENT"]),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "RECIPIENT",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Redirect to login page on successful registration
      router.push("/login?registered=true");
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Register for Lifestream
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Name"
          htmlFor="name"
          error={errors.name?.message}
        >
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            {...register("name")}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Email"
          htmlFor="email"
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            {...register("password")}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Confirm Password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            {...register("confirmPassword")}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Register as"
          htmlFor="role"
          error={errors.role?.message}
        >
          <select
            id="role"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            {...register("role")}
            disabled={isLoading}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register"}
        </Button>
      </form>
    </div>
  );
}
