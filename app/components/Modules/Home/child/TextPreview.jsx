import React from "react";

const TextPreview = ({ extractedText }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-300 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Extracted Content Preview</h3>
        <span className="text-sm text-gray-500">
          Showing first 500 characters
        </span>
      </div>

      <div className="bg-white rounded-lg p-4 border">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-mono text-sm">
            {extractedText.length > 500
              ? extractedText.substring(0, 500) +
                "...\n\n[Content continues...]"
              : extractedText}
          </p>
        </div>
      </div>

      {extractedText.length > 500 && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Total: {extractedText.length.toLocaleString()} characters • Estimated
          reading time: {Math.ceil(extractedText.split(" ").length / 200)}{" "}
          minutes
        </p>
      )}
    </div>
  );
};

export default TextPreview;
