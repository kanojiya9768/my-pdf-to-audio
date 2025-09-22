"use client";

import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/supabaseClient";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { loginSchema } from "@/utils/validation-schemas/authSchemas";

export default function LoginForm({ onToggle }) {
  const [showPassword, setShowPassword] = useState(false);
  const { replace } = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const handleLogin = async (data) => {
    const { email, password } = data;
    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      localStorage.setItem("auth", "true");
      localStorage.setItem("user", JSON.stringify(loginData.user));
      toast.success(`Welcome back, ${loginData.user.email}!`);
      replace("/");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
      {/* Email */}
      <div>
        <div className="relative">
          <Mail className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
          <input
            type="email"
            placeholder="Email address"
            {...register("email")}
            className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {errors.email && <p className="text-red-600 text-xs">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <div className="relative">
          <Lock className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            {...register("password")}
            className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            className="absolute right-3 top-3.5"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-600 text-xs">{errors.password.message}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600"
      >
        {isSubmitting ? "Processing..." : "Sign in"}
      </button>

      {/* Toggle */}
      <div className="text-center">
        <button type="button" className="text-sm text-blue-600" onClick={onToggle}>
          Don’t have an account? Sign up
        </button>
      </div>
    </form>
  );
}
