"use client";

import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/supabaseClient";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signupSchema } from "@/utils/validation-schemas/authSchemas";

export default function SignupForm({ onToggle }) {
  const [showPassword, setShowPassword] = useState(false);
  const { replace } = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  const handleSignup = async (data) => {
    const { email, password, name, phone } = data;

    const { data: signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone_number: phone } },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your inbox. Please verify your email.!");
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSignup)} className="space-y-6">
      {/* Name */}
      <div>
        <div className="relative">
          <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Full Name"
            {...register("name")}
            className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {errors.name && (
          <p className="text-red-600 text-xs">{errors.name.message}</p>
        )}
      </div>

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
        {errors.email && (
          <p className="text-red-600 text-xs">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <PhoneInput
          country={"in"}
          value={watch("phone")}
          onChange={(value) => setValue("phone", value)}
          inputClass="!w-full pl-12 pr-3 !py-6 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {errors.phone && (
          <p className="text-red-600 text-xs">{errors.phone.message}</p>
        )}
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
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-600 text-xs">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600"
      >
        {isSubmitting ? "Processing..." : "Sign up"}
      </button>

      {/* Toggle */}
      <div className="text-center">
        <button
          type="button"
          className="text-sm text-blue-600"
          onClick={onToggle}
        >
          Already have an account? Sign in
        </button>
      </div>
    </form>
  );
}
