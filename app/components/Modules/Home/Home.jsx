"use client";
import React from "react";
import { Loader, Download } from "lucide-react";
import Header from "./child/Header";
import FileUpload from "./child/FileUpload";
import AudioControl from "./child/AudioControl";
import DocumentAnalysis from "./child/DocumentAnalysis";
import { QUALITY_CONFIG } from "@/lib/constantJSON";
import { ExtractionError } from "./child/ExtrractionError";
import TextPreview from "./child/TextPreview";
import InetractiveTextDisplay from "./child/InetractiveTextDisplay";
import usePdfReader from "@/utils/hooks/usePdfReader";

const HomePage = () => {
  const {
    // state
    pdfFile,
    extractedText,
    isExtracting,
    extractionMethod,
    setExtractionMethod,
    extractionError,
    isSpeaking,
    isPaused,
    currentPage,
    totalPages,
    speechRate,
    setSpeechRate,
    speechVolume,
    setSpeechVolume,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
    setCurrentPosition,
    currentSentence,
    textQuality,

    // refs
    fileInputRef,
    textChunks,
    currentChunkIndex,
    textPreviewRef,

    // actions
    handleFileUpload,
    retryExtraction,
    startSpeaking,
    pauseSpeaking,
    stopSpeaking,
    skipForward,
    skipBackward,
    speakTextEnhanced,
    exportText,

    // derived
    progress,
  } = usePdfReader();

  return (
    <div className="h-full p-4">
      <div className="mx-auto">
        <div className="bg-white h-full overflow-auto shadow-md">
          {/* Header */}
          <Header />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Left Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* File Upload */}
              <FileUpload
                handleFileUpload={handleFileUpload}
                fileInputRef={fileInputRef}
                isExtracting={isExtracting}
                pdfFile={pdfFile}
                extractionMethod={extractionMethod}
                setExtractionMethod={setExtractionMethod}
              />

              {/* Status Messages */}
              {isExtracting && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Loader className="h-6 w-6 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-blue-800 font-medium">
                        Extracting Text...
                      </p>
                      <p className="text-blue-600 text-sm">
                        Using {extractionMethod} method
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {extractionError && (
                <ExtractionError
                  extractionError={extractionError}
                  retryExtraction={retryExtraction}
                />
              )}

              {/* Text Quality Indicator */}
              {QUALITY_CONFIG[textQuality] && (
                <div
                  className={`rounded-xl p-4 ${QUALITY_CONFIG[textQuality].color}`}
                >
                  <p className="font-medium">
                    Text Quality: {textQuality.toUpperCase()}
                  </p>
                  <p className="text-sm mt-1">
                    {QUALITY_CONFIG[textQuality].label}
                  </p>
                </div>
              )}

              {/* Audio Controls */}
              {extractedText && (
                <AudioControl
                  skipBackward={skipBackward}
                  skipForward={skipForward}
                  startSpeaking={startSpeaking}
                  pauseSpeaking={pauseSpeaking}
                  stopSpeaking={stopSpeaking}
                  isSpeaking={isSpeaking}
                  isPaused={isPaused}
                  currentChunkIndex={currentChunkIndex}
                  textChunks={textChunks}
                  progress={progress}
                  currentSentence={currentSentence}
                  speechRate={speechRate}
                  setSpeechRate={setSpeechRate}
                  speechVolume={speechVolume}
                  setSpeechVolume={setSpeechVolume}
                  availableVoices={availableVoices}
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                />
              )}

              {/* Export Button */}
              {extractedText && (
                <div className="bg-green-50 rounded-xl p-4">
                  <button
                    onClick={exportText}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    Export Clean Text
                  </button>
                </div>
              )}
            </div>

            {/* Right Panel - Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* PDF Information */}
              {pdfFile && (
                <DocumentAnalysis
                  totalPages={totalPages}
                  textChunks={textChunks}
                  pdfFile={pdfFile}
                  extractedText={extractedText}
                  textQuality={textQuality}
                />
              )}

              {/* Sample Text Preview */}
              {extractedText && <TextPreview extractedText={extractedText} />}

              {/* Interactive Text Display */}
              {extractedText && textChunks.current.length > 0 && (
                <InetractiveTextDisplay
                  currentChunkIndex={currentChunkIndex}
                  textChunks={textChunks}
                  textPreviewRef={textPreviewRef}
                  isSpeaking={isSpeaking}
                  setCurrentPosition={setCurrentPosition}
                  stopSpeaking={stopSpeaking}
                  speakTextEnhanced={speakTextEnhanced}
                />
              )}

              {/* Helpful Tips */}
              {!extractedText && !isExtracting && (
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">
                    Tips for Better Results
                  </h3>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>
                      • <strong>Image-based PDFs:</strong> This tool extracts
                      text, not images. For scanned PDFs, use OCR software
                      first.
                    </p>
                    <p>
                      • <strong>Garbled text:</strong> Try different extraction
                      methods if the auto-detect fails.
                    </p>
                    <p>
                      • <strong>Password-protected:</strong> Remove password
                      protection before uploading.
                    </p>
                    <p>
                      • <strong>Large files:</strong> Processing may take longer
                      for files over 10MB.
                    </p>
                    <p>
                      • <strong>Multiple languages:</strong> Works best with
                      English content.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Initialize PDF.js when component loads
if (typeof window !== "undefined") {
  // Dynamic import to avoid SSR issues
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  script.onload = () => {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
  };
  document.head.appendChild(script);
}

export default HomePage;
