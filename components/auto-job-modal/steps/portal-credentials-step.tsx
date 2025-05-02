import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, EyeOff, Eye, Save, RotateCw, CheckCircle, AlertCircle } from "lucide-react";

interface PortalCredentialsStepProps {
  state: {
    selectedPortal: string;
    setSelectedPortal: (portal: string) => void;
    username: string;
    setUsername: (username: string) => void;
    password: string;
    setPassword: (password: string) => void;
    credentialsSaved: boolean;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    portalData: any[]; // Refine this type later
    loading: boolean;
    saveCredentials: () => Promise<void>;
  };
}

export default function PortalCredentialsStep({ state }: PortalCredentialsStepProps) {
  const {
    selectedPortal,
    setSelectedPortal,
    username,
    setUsername,
    password,
    setPassword,
    credentialsSaved,
    showPassword,
    setShowPassword,
    portalData,
    loading,
    saveCredentials
  } = state;

  // Local state to track if the password field has been changed
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Watch for password changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Only mark as changed if there's actually content
    if (newPassword.trim().length > 0) {
      setPasswordChanged(true);
    } else {
      setPasswordChanged(false);
    }
  };

  // Handle save credentials with direct call to parent function
  const handleSave = async () => {
    await saveCredentials();
  };

  // Determine what the button should say
  const getButtonText = () => {
    if (loading) {
      return "Processing...";
    }
    
    if (!credentialsSaved) {
      return "Save Credentials";
    }
    
    if (passwordChanged) {
      return "Update Password";
    }
    
    return "Save Credentials";
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="portal-selector grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {portalData.map((portal) => (
          <div
            key={portal.id}
            className={`flex items-center p-2 sm:p-3 border rounded-lg text-sm sm:text-base ${
              portal.id === "N" ? "border-primary bg-primary/5" : ""
            } ${!portal.available ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}`}
            onClick={() => {
              if (portal.available) {
                setSelectedPortal(portal.name.toLowerCase());
              }
            }}
          >
            <div className="portal-letter bg-primary/10 text-primary font-semibold w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3">
              {portal.id}
            </div>
            <div className="portal-info">
              <div className="font-medium">{portal.name}</div>
              <div className={`text-[10px] sm:text-xs ${portal.available ? "text-green-600" : "text-muted-foreground"}`}>
                {portal.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="email" className="text-sm sm:text-base">
            <User size={14} className="inline mr-2" />
            Username / Email
          </Label>
          <Input
            id="email"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your Naukri email"
            className="w-full text-sm sm:text-base h-9 sm:h-10"
          />
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="password" className="text-sm sm:text-base">
            <Lock size={14} className="inline mr-2" />
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              placeholder={
                credentialsSaved ? "Enter new password only if you want to change it" : "Enter your Naukri password"
              }
              className="w-full text-sm sm:text-base h-9 sm:h-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          {credentialsSaved && !passwordChanged && (
            <div className="text-xs sm:text-sm flex items-center text-green-600 mt-1">
              <CheckCircle size={12} className="mr-1" />
              <span>Credentials saved</span>
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading || !username || (!password && !credentialsSaved)}
          className="w-full mt-2 text-sm sm:text-base h-9 sm:h-10"
        >
          {loading ? (
            <RotateCw size={14} className="mr-2 animate-spin" />
          ) : (
            <Save size={14} className="mr-2" />
          )}
          {getButtonText()}
        </Button>

        <div className="flex items-start mt-3 p-2 sm:p-3 text-xs sm:text-sm bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle size={14} className="text-amber-500 mr-2 shrink-0 mt-0.5" />
          <p className="text-amber-700">
            For security reasons, use a dedicated email that isn't linked to sensitive accounts. Passwords are encrypted
            during transmission and storage.
          </p>
        </div>
      </div>
    </div>
  );
}