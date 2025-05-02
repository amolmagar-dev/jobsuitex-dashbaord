import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface NotificationsStepProps {
  state: {
    emailNotifications: boolean;
    setEmailNotifications: (checked: boolean) => void;
    whatsappNotifications: boolean;
    setWhatsappNotifications: (checked: boolean) => void;
  };
}

export function NotificationsStep({ state }: NotificationsStepProps) {
  const { emailNotifications, setEmailNotifications, whatsappNotifications, setWhatsappNotifications } = state;

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