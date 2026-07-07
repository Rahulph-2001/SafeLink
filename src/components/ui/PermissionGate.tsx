import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface PermissionGateProps {
  geoError: string | null;
  camError: string | null;
  children: ReactNode;
}

export const PermissionGate = ({ geoError, camError, children }: PermissionGateProps) => {
  if (geoError || camError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto text-center mt-12">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-900 mb-2">Permissions Denied</h3>
        <p className="text-red-700 text-sm mb-4">
          SafeLink requires access to your location and camera to function during an emergency.
        </p>
        <div className="text-left bg-white p-4 rounded text-sm text-gray-700">
          <ul className="list-disc pl-5 space-y-1">
            {geoError && <li><strong>Location:</strong> {geoError}</li>}
            {camError && <li><strong>Camera:</strong> {camError}</li>}
          </ul>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Please update your browser settings to allow these permissions and reload the page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
