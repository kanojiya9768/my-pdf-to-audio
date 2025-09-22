"use client";
import { X } from "lucide-react";
import React from "react";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-4xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X />
        </button>

        <div className="p-6 overflow-y-auto max-h-[90vh]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
