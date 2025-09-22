import React, { useEffect, useRef, useState } from "react";
import {
  Loader,
  X,
  FileText,
  File,
  DockIcon,
  Sparkles,
  Play,
  Pause,
  Square,
  SkipForward,
} from "lucide-react";

const SummaryDisplay = ({
  summary,
  isSummarizing,
  summarizationError,
  summarizeText,
  cancelSummarization,
  extractedText,
}) => {
  const [librariesLoaded, setLibrariesLoaded] = useState({
    jsPDF: false,
    docx: false,
  });
  const summaryContainerRef = useRef(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // --- AUDIO STATES ---
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ index: 0, total: 0 });
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const utteranceRef = useRef(null);

  // --- AI CHAT STATES ---
  const [chatInput, setChatInput] = useState("");
  const [chatOutput, setChatOutput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (!selectedVoice && availableVoices.length)
        setSelectedVoice(availableVoices[0].name);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Auto-scroll summary
  useEffect(() => {
    if (summary && summaryContainerRef.current) {
      summaryContainerRef.current.scrollTop =
        summaryContainerRef.current.scrollHeight;
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [summary]);

  // --- AUDIO FUNCTIONS ---
  const playAudio = (textToSpeak = summary) => {
    if (!textToSpeak) return;
    stopAudio();
    const selected = voices.find((v) => v.name === selectedVoice);
    if (!selected) return;

    const sentences = textToSpeak.split(/([.!?])\s/).filter(Boolean);
    setProgress({ index: 0, total: sentences.length });

    let idx = 0;
    const speakSentence = () => {
      if (idx >= sentences.length) {
        setIsPlaying(false);
        return;
      }

      const utter = new SpeechSynthesisUtterance(sentences[idx]);
      utter.voice = selected;
      utter.lang = selected.lang;
      utter.rate = rate;
      utter.volume = volume;
      utter.onend = () => {
        idx++;
        setProgress({ index: idx, total: sentences.length });
        speakSentence();
      };

      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    };

    setIsPlaying(true);
    speakSentence();
  };

  const pauseAudio = () => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
  };

  const resumeAudio = () => {
    window.speechSynthesis.resume();
    setIsPlaying(true);
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setProgress({ index: 0, total: 0 });
  };

  // --- EXPORT FUNCTIONS ---
  const exportToTxt = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    if (!summary || !window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(summary, 180);
    let y = 10;
    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      doc.text(line, 10, y);
      y += 7;
    });
    doc.save("summary.pdf");
  };

  const exportToDocx = () => {
    if (!summary || !window.docx) return;
    const { Document, Packer, Paragraph, TextRun } = window.docx;
    const doc = new Document({
      sections: [
        { children: [new Paragraph({ children: [new TextRun(summary)] })] },
      ],
    });
    Packer.toBlob(doc).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "summary.docx";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // --- LOAD LIBRARIES ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const jspdfScript = document.createElement("script");
    jspdfScript.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    jspdfScript.onload = () =>
      setLibrariesLoaded((prev) => ({ ...prev, jsPDF: true }));
    document.head.appendChild(jspdfScript);

    const docxScript = document.createElement("script");
    docxScript.src =
      "https://cdn.jsdelivr.net/npm/docx@9.0.0/build/index.min.js";
    docxScript.onload = () =>
      setLibrariesLoaded((prev) => ({ ...prev, docx: true }));
    document.head.appendChild(docxScript);

    return () => {
      document.head.removeChild(jspdfScript);
      document.head.removeChild(docxScript);
    };
  }, []);

  // --- CHAT FUNCTIONS ---
  const sendChat = async () => {
    if (!chatInput.trim() || !summary) return;

    setIsChatLoading(true);
    setChatOutput("");
    const previous = chatMessages;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summarizedText: summary,
        userPrompt: chatInput,
        previousMessages: previous,
      }),
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode chunk
      const chunk = decoder.decode(value);

      // Parse each line (each line is usually a JSON object starting with "data: ")
      const lines = chunk.split("\n").filter(Boolean);
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(line.replace("data: ", ""));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              setChatOutput(result); // live update
            }
          } catch (err) {
            console.error("Failed to parse chunk", err);
          }
        }
      }
    }

    // Save final message
    setChatMessages([
      ...previous,
      { role: "user", content: chatInput },
      { role: "assistant", content: result },
    ]);

    setIsChatLoading(false);
    setChatInput("");
  };

  return (
    <div className="bg-gradient-to-br from-gray-100 to-blue-100 rounded-2xl p-8 shadow-xl border border-gray-200/50">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">AI Summary</h3>
        {extractedText && !isSummarizing && (
          <button
            onClick={()=>{
              summarizeText();
              setChatOutput("");
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
          >
            Generate Summary <Sparkles size={16} />
          </button>
        )}
      </div>

      {/* LOADING */}
      {isSummarizing && (
        <div className="flex items-center gap-4 mb-6 bg-blue-200/50 p-4 rounded-lg border border-blue-300/50">
          <Loader className="h-7 w-7 text-blue-600 animate-spin" />
          <p className="text-blue-700 font-medium text-lg">
            Generating summary<span className="animate-pulse">...</span>
          </p>
          <button
            onClick={cancelSummarization}
            className="ml-auto p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
            title="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {summarizationError && (
        <p className="text-red-600 text-sm mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
          {summarizationError}
        </p>
      )}

      {/* SUMMARY */}
      {summary && (
        <div
          ref={summaryContainerRef}
          className="bg-white/90 p-6 rounded-xl shadow-md border max-h-96 overflow-y-auto"
        >
          <p className="text-gray-800 whitespace-pre-wrap">{summary}</p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-2 italic">
              Last updated: {lastUpdated}
            </p>
          )}

          {/* EXPORT */}
          <div className="mt-4 flex gap-3 flex-wrap">
            <button
              onClick={exportToTxt}
              className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
            >
              <FileText size={18} /> .txt
            </button>
            <button
              onClick={exportToPdf}
              disabled={!librariesLoaded.jsPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <File size={18} /> .pdf
            </button>
            <button
              onClick={exportToDocx}
              disabled={!librariesLoaded.docx}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <DockIcon size={18} /> .docx
            </button>
          </div>
        </div>
      )}

      {/* CHAT */}
      {summary && (
        <div className="mt-6 p-6 bg-white rounded-xl shadow-md border">
          <h4 className="text-lg font-semibold mb-3">Interact with Summary</h4>
          <textarea
            rows={3}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask something or give instructions..."
            className="w-full p-3 border rounded mb-3"
          />
          <button
            onClick={sendChat}
            disabled={isChatLoading || !chatInput.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg mb-3"
          >
            {isChatLoading ? "Loading..." : "Send"}
          </button>

          {chatOutput && (
            <div className="mt-3 p-3 bg-gray-50 rounded border max-h-60 overflow-y-auto whitespace-pre-wrap">
              {chatOutput}
            </div>
          )}
        </div>
      )}

      {/* AUDIO */}
      {summary && (
        <div className="mt-6 p-6 bg-white rounded-xl shadow-md border">
          <h4 className="text-lg font-semibold mb-3">Audio Controls</h4>
          <div className="flex items-center gap-3 mb-3">
            {!isPlaying ? (
              <button
                onClick={() => playAudio(chatOutput || summary)}
                className="p-3 bg-indigo-600 text-white rounded-full"
              >
                <Play size={20} />
              </button>
            ) : (
              <button
                onClick={pauseAudio}
                className="p-3 bg-indigo-600 text-white rounded-full"
              >
                <Pause size={20} />
              </button>
            )}
            <button
              onClick={resumeAudio}
              className="p-3 bg-indigo-500 text-white rounded-full"
            >
              <SkipForward size={20} />
            </button>
            <button
              onClick={stopAudio}
              className="p-3 bg-red-500 text-white rounded-full"
            >
              <Square size={20} />
            </button>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{
                width: progress.total
                  ? `${(progress.index / progress.total) * 100}%`
                  : "0%",
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Sentence {progress.index} of {progress.total}
          </p>

          <div className="flex flex-col gap-3 mb-3">
            <label className="flex items-center gap-2">
              Speed:
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
              />
              {rate}x
            </label>
            <label className="flex items-center gap-2">
              Volume:
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
              />
              {Math.round(volume * 100)}%
            </label>
          </div>

          <label className="block">
            Voice:
            <select
              value={selectedVoice || ""}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="mt-1 p-2 border rounded w-full"
            >
              {voices.map((voice, i) => (
                <option key={i} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
};

export default SummaryDisplay;
