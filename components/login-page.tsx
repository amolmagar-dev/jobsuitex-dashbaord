"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { BriefcaseBusiness, EyeIcon, EyeOffIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const { login, googleAuth, loading, error, clearError } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await login(email, password);
      // The router navigation is handled in the auth context
    } catch (err) {
      // Error is handled in the auth context
    }
  };

  const handleGoogleLogin = async (response: any) => {
    try {
      await googleAuth(response.credential);
    } catch (err) {
      console.error("Google login error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Form section - always full height */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 mb-12">
              <BriefcaseBusiness className="h-5 w-5 text-zinc-800" />
              <h1 className="font-medium">JobSuiteX</h1>
            </div>

            <h2 className="text-xl font-medium mb-6">Sign in</h2>

            {error && (
              <div className="border-l-2 border-red-500 bg-red-50 px-3 py-2 mb-6 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-zinc-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                  }}
                  className={`h-10 border ${formErrors.email ? "border-red-500" : "border-zinc-200"} rounded-md focus:border-zinc-400 focus:ring-0`}
                />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm text-zinc-700">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-zinc-600 hover:text-zinc-900"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formErrors.password) setFormErrors({ ...formErrors, password: undefined });
                    }}
                    className={`h-10 border ${formErrors.password ? "border-red-500" : "border-zinc-200"} rounded-md focus:border-zinc-400 focus:ring-0`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </button>
                </div>
                {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-10 bg-zinc-900 hover:bg-black text-white rounded-md"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Signing in...
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>

            <div className="my-6 flex items-center">
              <div className="flex-grow h-px bg-zinc-100"></div>
              <span className="px-3 text-xs text-zinc-400 font-medium">OR</span>
              <div className="flex-grow h-px bg-zinc-100"></div>
            </div>

            <div className="w-full mb-6">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => console.error('Google login failed')}
                useOneTap
                shape="rectangular"
                text="signin_with"
                width="100%"
              />
            </div>

            <p className="text-sm text-center text-zinc-600">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="text-zinc-900 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Marketing section - only visible on medium screens and larger */}
        <div className="hidden md:block md:w-1/2 bg-zinc-50">
          <div className="h-full p-12 flex items-center justify-center">
            <div className="max-w-sm">
              <h2 className="text-xl font-medium mb-6">JobSuiteX helps you secure 5x more interviews</h2>
              <p className="text-zinc-600 text-sm mb-8">Upload your resume, set your job preferences, and JobSuiteX will automatically apply to matching positions.</p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-4 w-4 text-zinc-800 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium">Smart Job Matching</h3>
                    <p className="text-xs text-zinc-500">Our AI algorithm matches your skills with job openings across multiple platforms.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-4 w-4 text-zinc-800 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium">Automated Applications</h3>
                    <p className="text-xs text-zinc-500">Apply to multiple jobs with a single click using your profile information.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-4 w-4 text-zinc-800 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium">Resume Optimization</h3>
                    <p className="text-xs text-zinc-500">Our AI optimizes your resume for each application to maximize your chances.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-zinc-200 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xl font-medium">10+</p>
                  <p className="text-xs text-zinc-500">Hours saved weekly</p>
                </div>
                <div>
                  <p className="text-xl font-medium">100+</p>
                  <p className="text-xs text-zinc-500">Jobs daily</p>
                </div>
                <div>
                  <p className="text-xl font-medium">ATS</p>
                  <p className="text-xs text-zinc-500">Optimized</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}