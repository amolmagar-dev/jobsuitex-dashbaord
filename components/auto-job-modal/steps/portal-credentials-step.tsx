// components/auto-job-modal/steps/PortalCredentialsStep.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, Lock, EyeOff, Eye, Save, 
  RotateCw, CheckCircle, AlertCircle 
} from 'lucide-react';

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
    verifyConnection: () => Promise<void>;
  };
}

export default function PortalCredentialsStep({ state }: PortalCredentialsStepProps) {
  const {
    selectedPortal, setSelectedPortal,
    username, setUsername,
    password, setPassword,
    credentialsSaved,
    showPassword, setShowPassword,
    portalData,
    loading,
    saveCredentials,
    verifyConnection
  } = state;

  return (
    <div className="space-y-6">
      <div className="portal-selector flex flex-wrap gap-3">
        {portalData.map(portal => (
          <div
            key={portal.id}
            className={`flex items-center p-3 border rounded-lg ${portal.id === 'N' ? 'border-primary bg-primary/5' : ''} ${!portal.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
            onClick={() => {
              if (portal.available) {
                setSelectedPortal(portal.name.toLowerCase());
              }
            }}
          >
            <div className="portal-letter bg-primary/10 text-primary font-semibold w-10 h-10 rounded-full flex items-center justify-center mr-3">
              {portal.id}
            </div>
            <div className="portal-info">
              <div className="font-medium">{portal.name}</div>
              <div className={`text-xs ${portal.available ? 'text-green-600' : 'text-muted-foreground'}`}>
                {portal.status}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            <User size={16} className="inline mr-2" />
            Username / Email
          </Label>
          <Input
            id="email"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your Naukri email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            <Lock size={16} className="inline mr-2" />
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={credentialsSaved ? "Enter new password only if you want to change it" : "Enter your Naukri password"}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          {credentialsSaved && (
            <div className="text-sm flex items-center text-green-600 mt-1">
              <CheckCircle size={14} className="mr-1" />
              <span>Credentials saved</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button onClick={saveCredentials} disabled={loading}>
            {loading ? (
              <RotateCw size={16} className="mr-2 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save Credentials
          </Button>
          <Button variant="outline" onClick={verifyConnection} disabled={loading}>
            <RotateCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Verify Connection
          </Button>
        </div>
        
        <div className="flex items-start mt-4 p-3 text-sm bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5" />
          <p className="text-amber-700">
            For security reasons, use a dedicated email that isn't linked to sensitive accounts. Passwords are encrypted during transmission and storage.
          </p>
        </div>
      </div>
    </div>
  );
}






