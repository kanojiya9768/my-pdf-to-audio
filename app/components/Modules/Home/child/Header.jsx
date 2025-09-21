import { FileText } from "lucide-react";
import React from "react";

const Header = () => {
  return (
    <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6">
      <h1 className="text-4xl font-bold text-white flex items-center gap-3">
        <FileText className="h-10 w-10" />
        Robust PDF to Audio Converter
      </h1>
      <p className="text-purple-100 mt-2">
        Advanced multi-method PDF text extraction with intelligent cleanup
      </p>
    </div>
  );
};

export default Header;
