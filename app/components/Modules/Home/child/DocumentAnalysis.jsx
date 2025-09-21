import { getQualityColor } from "@/lib/constantJSON";
import React from "react";

const DocumentAnalysis = ({
  totalPages,
  textChunks,
  pdfFile,
  extractedText,
  textQuality,
}) => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
      <h3 className="text-lg font-bold text-green-800 mb-4">
        Document Analysis
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {totalPages || "?"}
          </p>
          <p className="text-sm text-green-700">Pages</p>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            {textChunks.current.length}
          </p>
          <p className="text-sm text-blue-700">Sentences</p>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-2xl font-bold text-purple-600">
            {(pdfFile.size / 1024 / 1024).toFixed(1)}MB
          </p>
          <p className="text-sm text-purple-700">File Size</p>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-2xl font-bold text-indigo-600">
            {extractedText ? Math.round(extractedText.length / 1000) : 0}K
          </p>
          <p className="text-sm text-indigo-700">Characters</p>
        </div>
      </div>

      {/* Quality Indicator */}
      {textQuality !== "unknown" && (
        <div className="mt-4 p-3 bg-white rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Extraction Quality:
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(
                textQuality
              )}`}
            >
              {textQuality.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAnalysis;
