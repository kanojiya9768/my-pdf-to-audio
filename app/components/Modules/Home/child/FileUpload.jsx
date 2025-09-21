import { Upload } from "lucide-react";
import React from "react";

const FileUpload = ({
  handleFileUpload,
  fileInputRef,
  isExtracting,
  pdfFile,
  extractionMethod,
  setExtractionMethod,
}) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        ref={fileInputRef}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isExtracting}
        className="w-full border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50"
      >
        <Upload className="h-10 w-10 text-purple-500 mx-auto mb-3" />
        <p className="text-lg font-medium text-gray-700">
          {isExtracting ? "Processing PDF..." : "Upload PDF File"}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {pdfFile
            ? `Selected: ${pdfFile.name}`
            : "Supports corrupted & encoded PDFs"}
        </p>
      </button>

      {/* Extraction Method Selector */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Extraction Method
        </label>
        <select
          value={extractionMethod}
          onChange={(e) => setExtractionMethod(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          disabled={isExtracting}
        >
          <option value="auto">Auto-detect (Recommended)</option>
          <option value="pdfjs">PDF.js (Standard)</option>
          <option value="advanced">Pattern-based (Advanced)</option>
          <option value="ocr-like">OCR-like (Text Recovery)</option>
          <option value="raw">Raw Extraction (Last Resort)</option>
        </select>
      </div>
    </div>
  );
};

export default FileUpload;
