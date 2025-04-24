// components/auto-job-modal/SavedConfigSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface SavedConfigSelectorProps {
  configs: Array<{
    id: string;
    name?: string;
  }>;
  currentConfigId: string | null;
  setCurrentConfigId: (id: string | null) => void;
  fetchConfigById: (id: string) => Promise<void>;
  deleteConfig: () => Promise<void>;
  loading: boolean;
}
export function SavedConfigSelector({ 
  configs, 
  currentConfigId, 
  setCurrentConfigId, 
  fetchConfigById,
  deleteConfig,
  loading
}: SavedConfigSelectorProps) {
  return (
    <div className="mb-4 p-3 border rounded-md bg-muted/10">
      <Label htmlFor="savedConfigs" className="mb-2 block">Load saved configuration:</Label>
      <div className="flex gap-2">
        <select 
          id="savedConfigs" 
          className="flex-1 h-10 px-3 border border-input rounded-md bg-background"
          onChange={(e) => {
            const configId = e.target.value;
            if (configId) {
              setCurrentConfigId(configId);
              fetchConfigById(configId);
            } else {
              setCurrentConfigId(null);
            }
          }}
          value={currentConfigId || ''}
        >
          <option value="">Select a configuration</option>
          {configs.map(config => (
            <option key={config.id} value={config.id}>
              {config.name || `Config #${config.id}`}
            </option>
          ))}
        </select>
        {currentConfigId && (
          <Button 
            variant="outline" 
            size="icon"
            onClick={deleteConfig}
            disabled={loading}
          >
            <X size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}