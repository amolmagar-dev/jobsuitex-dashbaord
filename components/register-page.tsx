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
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { register, googleAuth, loading, error, clearError } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error for this field when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({ 
        ...formErrors, 
        [name]: undefined 
      });
    }
  };

  const validateForm = () => {
    const errors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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

    if (!acceptTerms) {
      alert("Please accept the terms and conditions");
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      // Router navigation handled in auth context
    } catch (err) {
      // Error handled in auth context
    }
  };

  const handleGoogleSignup = async (response: any) => {
    try {
      await googleAuth(response.credential);
    } catch (err) {
      console.error("Google signup error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Form section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 mb-12">
              <BriefcaseBusiness className="h-5 w-5 text-zinc-800" />
              <h1 className="font-medium">JobSuiteX</h1>
            </div>

            <h2 className="text-xl font-medium mb-6">Create account</h2>

            {error && (
              <div className="border-l-2 border-red-500 bg-red-50 px-3 py-2 mb-6 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm text-zinc-700">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`h-10 border ${formErrors.firstName ? "border-red-500" : "border-zinc-200"} rounded-md focus:border-zinc-400 focus:ring-0`}
                  />
                  {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm text-zinc-700">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`h-10 border ${formErrors.lastName ? "border-red-500" : "border-zinc-200"} rounded-md focus:border-zinc-400 focus:ring-0`}
                  />
                  {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-zinc-700">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`h-10 border ${formErrors.email ? "border-red-500" : "border-zinc-200"} rounded-md focus:border-zinc-400 focus:ring-0`}
                />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-zinc-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm text-zinc-700">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`h-10 border ${formErrors.confirmPassword ? "border-red-500" : "border-zinc-200"} rounded-md focus:border-zinc-400 focus:ring-0`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                  </button>
                </div>
                {formErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => 
                    setAcceptTerms(checked as boolean)
                  }
                  className="h-4 w-4 rounded-sm"
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-zinc-600"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-zinc-900 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-zinc-900 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-10 bg-zinc-900 hover:bg-black text-white rounded-md"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Creating account...
                  </span>
                ) : (
                  "Create account"
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
                onSuccess={handleGoogleSignup}
                onError={() => console.error('Google signup failed')}
                useOneTap
                shape="rectangular"
                text="signup_with"
                width="100%"
              />
            </div>

            <p className="text-sm text-center text-zinc-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-zinc-900 hover:underline"
              >
                Sign in
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