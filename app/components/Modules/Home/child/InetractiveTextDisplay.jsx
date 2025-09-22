import React from "react";

const InetractiveTextDisplay = ({
  currentChunkIndex,
  textChunks,
  textPreviewRef,
  isSpeaking,
  setCurrentPosition,
  stopSpeaking,
  speakTextEnhanced
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-300 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Interactive Reader</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-3 h-3 bg-purple-200 rounded-full"></div>
          <span>Currently reading</span>
          <div className="w-3 h-3 bg-gray-200 rounded-full ml-3"></div>
          <span>Completed</span>
        </div>
      </div>

      <div
        ref={textPreviewRef}
        className="bg-white rounded-lg p-4 h-96 overflow-y-auto border"
      >
        <div className="space-y-3">
          {textChunks.current.slice(0, 20).map((chunk, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg transition-all duration-300 cursor-pointer hover:shadow-sm ${
                index === currentChunkIndex.current && isSpeaking
                  ? "bg-purple-100 border-l-4 border-purple-500 font-medium shadow-sm"
                  : index < currentChunkIndex.current
                  ? "bg-gray-50 text-gray-600 border-l-4 border-gray-300"
                  : "bg-white hover:bg-gray-50 border-l-4 border-transparent"
              }`}
              onClick={() => {
                currentChunkIndex.current = index;
                setCurrentPosition(index);
                if (isSpeaking) {
                  stopSpeaking();
                  setTimeout(() => speakTextEnhanced(chunk), 100);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-400 font-mono mt-1 min-w-[2rem]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-relaxed flex-1">{chunk}</p>
              </div>
            </div>
          ))}

          {textChunks.current.length > 20 && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">
                ... and {textChunks.current.length - 20} more sentences
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InetractiveTextDisplay;
