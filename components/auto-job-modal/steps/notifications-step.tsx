// components/auto-job-modal/steps/notifications-step.tsx
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

// Country code list - a simplified version with common codes
const countryCodes = [
  { code: "91", country: "India" },
  { code: "1", country: "USA/Canada" },
  { code: "44", country: "UK" },
  { code: "61", country: "Australia" },
  { code: "65", country: "Singapore" },
  { code: "971", country: "UAE" },
  { code: "49", country: "Germany" },
  { code: "33", country: "France" },
  { code: "966", country: "Saudi Arabia" },
  { code: "81", country: "Japan" },
  { code: "86", country: "China" },
];

interface NotificationsStepProps {
  state: {
    emailNotifications: boolean;
    setEmailNotifications: (checked: boolean) => void;
    whatsappNotifications: boolean;
    setWhatsappNotifications: (checked: boolean) => void;
    mobileNumber: string;
    setMobileNumber: (number: string) => void;
  };
}

export function NotificationsStep({ state }: NotificationsStepProps) {
  const { 
    emailNotifications, 
    setEmailNotifications, 
    whatsappNotifications, 
    setWhatsappNotifications,
    mobileNumber,
    setMobileNumber
  } = state;

  // Local state for UI handling
  const [countryCode, setCountryCode] = useState("91"); // Default to India
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Extract country code and phone number from the stored mobile number on component mount
  React.useEffect(() => {
    if (mobileNumber) {
      // Try to match the country code from our list
      const matchedCountry = countryCodes.find(c => mobileNumber.startsWith(c.code));
      if (matchedCountry) {
        setCountryCode(matchedCountry.code);
        setPhoneNumber(mobileNumber.substring(matchedCountry.code.length));
      } else {
        // If no match, assume the first 2 digits might be the country code
        setCountryCode(mobileNumber.substring(0, 2));
        setPhoneNumber(mobileNumber.substring(2));
      }
    }
  }, []);

  // Validate phone number and update the combined value
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow digits
    if (/^[0-9]*$/.test(value)) {
      setPhoneNumber(value);
      
      // Validate phone number length (usually between 8-12 digits without country code)
      if (value.length < 8 && value.length > 0) {
        setPhoneError("Phone number is too short");
      } else if (value.length > 12) {
        setPhoneError("Phone number is too long");
      } else {
        setPhoneError("");
      }
      
      // Update the combined mobile number (without + symbol)
      setMobileNumber(countryCode + value);
    }
  };

  // Handle country code change
  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    
    // Update the combined mobile number with new country code
    setMobileNumber(newCode + phoneNumber);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between py-2 sm:py-3 border-b">
          <div>
            <h3 className="font-medium text-sm sm:text-base">Email Notifications</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Receive application status updates via email</p>
          </div>
          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>

        <div className="flex items-center justify-between py-2 sm:py-3 border-b">
          <div>
            <h3 className="font-medium text-sm sm:text-base">WhatsApp Notifications</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Receive application status updates via WhatsApp
            </p>
          </div>
          <Switch checked={whatsappNotifications} onCheckedChange={setWhatsappNotifications} />
        </div>
        
        {/* Show mobile number input only when WhatsApp notifications are enabled */}
        {whatsappNotifications && (
          <div className="space-y-1 sm:space-y-2 py-2 sm:py-3 border-b">
            <Label htmlFor="mobileNumber" className="text-sm sm:text-base">WhatsApp Number</Label>
            <div className="flex gap-2">
              <div className="w-24 sm:w-32">
                <select
                  id="countryCode"
                  value={countryCode}
                  onChange={handleCountryCodeChange}
                  className="w-full h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm border border-input rounded-md bg-background"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      +{country.code} {country.country}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="Enter your mobile number"
                className="text-sm sm:text-base h-9 sm:h-10 flex-1"
              />
            </div>
            {phoneError && (
              <p className="text-xs text-red-500 flex items-center mt-1">
                <AlertCircle size={12} className="mr-1" />
                {phoneError}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Enter your WhatsApp number without any spaces or special characters
            </p>
          </div>
        )}

        <div className="mt-3 sm:mt-6">
          <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Notify me about:</h3>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex gap-2">
              <Checkbox id="notify-applied" defaultChecked />
              <div className="grid gap-0.5 sm:gap-1.5">
                <Label htmlFor="notify-applied" className="font-medium text-sm sm:text-base">
                  Successful Applications
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When your profile is successfully submitted</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Checkbox id="notify-interview" defaultChecked />
              <div className="grid gap-0.5 sm:gap-1.5">
                <Label htmlFor="notify-interview" className="font-medium text-sm sm:text-base">
                  Interview Invitations
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When you receive an interview request</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Checkbox id="notify-errors" defaultChecked />
              <div className="grid gap-0.5 sm:gap-1.5">
                <Label htmlFor="notify-errors" className="font-medium text-sm sm:text-base">
                  Errors & Issues
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When there are problems with the automation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}