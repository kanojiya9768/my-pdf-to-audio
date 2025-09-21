import React from "react";

const Progress = ({ progress, currentChunkIndex, textChunks }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Sentence {currentChunkIndex.current + 1}</span>
        <span>of {textChunks.current.length}</span>
      </div>
    </div>
  );
};

export default Progress;
