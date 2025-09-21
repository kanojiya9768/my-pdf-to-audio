import { AlertTriangle, RefreshCw } from "lucide-react";

export function ExtractionError({ extractionError, retryExtraction }) {
  return (
    <div className="bg-red-50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-800 font-medium">Extraction Failed</p>
          <p className="text-red-600 text-sm mt-1">{extractionError}</p>
          <button
            onClick={retryExtraction}
            className="mt-2 flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
