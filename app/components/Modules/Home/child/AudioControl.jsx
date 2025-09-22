import Progress from "@/app/components/Elements/Progress";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
} from "lucide-react";
import React from "react";

const AudioControl = ({
  skipBackward,
  skipForward,
  startSpeaking,
  pauseSpeaking,
  stopSpeaking,
  isSpeaking,
  isPaused,
  currentChunkIndex,
  textChunks,
  progress,
  currentSentence,
  speechRate,
  setSpeechRate,
  speechVolume,
  setSpeechVolume,
  availableVoices,
  selectedVoice,
  setSelectedVoice,
}) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-gray-300 shadow-sm">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Volume2 className="h-6 w-6 text-indigo-600" />
        Audio Controls
      </h3>

      {/* Playback Buttons */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={skipBackward}
          disabled={currentChunkIndex.current <= 0}
          className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 transition-all"
        >
          <SkipBack className="h-5 w-5" />
        </button>

        <button
          onClick={isSpeaking && !isPaused ? pauseSpeaking : startSpeaking}
          className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
        >
          {isSpeaking && !isPaused ? (
            <Pause className="h-7 w-7" />
          ) : (
            <Play className="h-7 w-7" />
          )}
        </button>

        <button
          onClick={stopSpeaking}
          disabled={!isSpeaking && !isPaused}
          className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 transition-all"
        >
          <Square className="h-5 w-5" />
        </button>

        <button
          onClick={skipForward}
          disabled={currentChunkIndex.current >= textChunks.current.length - 1}
          className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 transition-all"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Progress */}
      <Progress
        progress={progress}
        currentChunkIndex={currentChunkIndex}
        textChunks={textChunks}
      />

      {/* Current Sentence */}
      {currentSentence && (
        <div className="bg-white rounded-lg p-3 mb-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Currently Reading:</p>
          <p className="text-gray-800 font-medium">{currentSentence}</p>
        </div>
      )}

      {/* Settings Panel */}
      <div className="bg-white rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Speed: {speechRate}x
            </label>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.25"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Volume: {Math.round(speechVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={speechVolume}
              onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(parseInt(e.target.value))}
            className="w-full p-2 text-sm border border-gray-300 rounded"
          >
            {availableVoices.map((voice, index) => (
              <option key={index} value={index}>
                {voice.name.length > 25
                  ? voice.name.substring(0, 25) + "..."
                  : voice.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AudioControl;
