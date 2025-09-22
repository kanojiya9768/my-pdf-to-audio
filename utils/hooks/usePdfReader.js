import { useState, useRef, useEffect, useCallback } from "react";

/**
 * usePdfReader
 * - Handles PDF text extraction (multiple strategies)
 * - Handles intelligent chunking, TTS (speechSynthesis) controls
 * - Handles summarization via local API endpoint
 * - Exposes state, refs, and actions to drive a UI
 */
export default function usePdfReader(initialOptions = {}) {
  const {
    defaultExtractionMethod = "auto",
    defaultAutoScroll = true,
    defaultHighlight = true,
  } = initialOptions;

  // --- State
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState(
    defaultExtractionMethod
  );
  const [extractionError, setExtractionError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState(0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [autoScroll, setAutoScroll] = useState(defaultAutoScroll);
  const [highlightText, setHighlightText] = useState(defaultHighlight);
  const [currentSentence, setCurrentSentence] = useState("");
  const [textQuality, setTextQuality] = useState("unknown");
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizationError, setSummarizationError] = useState("");

  // --- Refs
  const fileInputRef = useRef(null);
  const utteranceRef = useRef(null);
  const textChunks = useRef([]);
  const currentChunkIndex = useRef(0);
  const textPreviewRef = useRef(null);
  const controllerRef = useRef(new AbortController());

  // --- Utilities
  const cleanTextItem = (text) => {
    return text
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
      .replace(/[^\w\s.,!?;:()\-'"]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const reconstructText = (textItems) => {
    if (!textItems.length) return "";
    let result = "";
    let currentLine = [];
    let lastY = textItems[0].y;
    const lineThreshold = 5;

    textItems.forEach((item) => {
      if (Math.abs(item.y - lastY) > lineThreshold) {
        if (currentLine.length > 0) {
          result += currentLine.join(" ") + " ";
          currentLine = [];
        }
        lastY = item.y;
      }
      if (item.text.length > 0) {
        currentLine.push(item.text);
      }
    });

    if (currentLine.length > 0) {
      result += currentLine.join(" ");
    }
    return result.replace(/\s+/g, " ").trim();
  };

  const extractWithPatterns = async (arrayBuffer) => {
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    let text = "";
    const pdfText = decoder.decode(uint8Array);
    const btPattern = /BT\s+.*?ET/g;
    const matches = pdfText.match(btPattern);

    if (matches) {
      matches.forEach((match) => {
        const textPattern = /\((.*?)\)/g;
        let textMatch;
        while ((textMatch = textPattern.exec(match)) !== null) {
          const extractedText = textMatch[1]
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\\\/g, "\\")
            .replace(/\\(.)/g, "$1");
          if (extractedText.length > 2 && /[a-zA-Z]/.test(extractedText)) {
            text += extractedText + " ";
          }
        }
      });
    }
    return text.trim();
  };

  const extractOCRLike = async (arrayBuffer) => {
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const content = decoder.decode(uint8Array);
    let text = "";
    const lines = content.split(/[\r\n]+/);

    lines.forEach((line) => {
      const readableText = line.match(/[a-zA-Z0-9\s.,!?;:()\-'"]{4,}/g);
      if (readableText) {
        readableText.forEach((match) => {
          if (match.trim().length > 3) {
            text += match.trim() + " ";
          }
        });
      }
    });
    return text.trim();
  };

  const extractRawText = async (arrayBuffer) => {
    const uint8Array = new Uint8Array(arrayBuffer);
    let text = "";
    for (let i = 0; i < uint8Array.length; i++) {
      const char = uint8Array[i];
      if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
        text += String.fromCharCode(char);
      } else if (char === 0 && text.endsWith(" ")) {
        continue;
      } else if (char > 126) {
        try {
          const slice = uint8Array.slice(i, i + 4);
          const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
            slice
          );
          if (decoded.length > 0 && /[a-zA-Z0-9\s]/.test(decoded)) {
            text += decoded[0];
          }
        } catch (e) {}
      }
    }
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const validateAndCleanText = (text) => {
    if (!text || typeof text !== "string") return "";
    let cleaned = text
      .replace(/[#\d+][A-Za-z0-9+/=_:;,(){}\[\]!"'?.-]+\s*/g, "")
      .replace(/stream.*?endstream/g, "")
      .replace(/obj.*?endobj/g, "")
      .replace(/xref.*?trailer/gs, "")
      .replace(/\b[A-Za-z0-9+/=]{20,}\b/g, "")
      .replace(/\b[0-9]{10,}\b/g, "")
      .replace(/[^\w\s.,!?;:()\-'"]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length > 0) {
      const sentences = cleaned.match(/[A-Z][^.!?]*[.!?]/g);
      if (sentences && sentences.length > 0) {
        cleaned = sentences.join(" ");
      }
    }
    return cleaned;
  };

  const intelligentTextChunking = (text) => {
    if (!text) return [];
    const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
    return sentences
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 5 && /[a-zA-Z]/.test(sentence))
      .map((sentence) =>
        sentence.endsWith(".") ||
        sentence.endsWith("!") ||
        sentence.endsWith("?")
          ? sentence
          : sentence + "."
      );
  };

  // --- Summarization function
  const PdfSummarizeAiApiFn = useCallback(
    async (PDFExtracterText, onChunkReceived) => {
      setIsSummarizing(true);
      setSummarizationError("");
      let buffer = "";
      try {
        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: PDFExtracterText }),
          signal: controllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! Status: ${response.status}`
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let result = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("Client: Stream complete");
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Split by SSE message boundary (\n\n)
          const lines = buffer.split("\n\n");
          buffer = lines.pop(); // Keep incomplete data in buffer

          for (const line of lines) {
            if (line.trim() === "" || !line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              break;
            }
            if (!data) continue;
            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content && content.trim()) {
                result += content;
                onChunkReceived(content);
              }
            } catch (error) {
              console.error(
                "Client: Error parsing chunk:",
                error,
                "Raw data:",
                data
              );
            }
          }
        }
        return result;
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Client: Summarization canceled");
          setSummarizationError("Summarization canceled");
        } else {
          console.error("Client: Error in streaming request:", error);
          setSummarizationError(error.message || "Failed to summarize text");
        }
        throw error;
      } finally {
        setIsSummarizing(false);
      }
    },
    []
  );

  // --- Cancel summarization
  const cancelSummarization = useCallback(() => {
    controllerRef.current.abort();
    controllerRef.current = new AbortController(); // Reset controller for future requests
  }, []);

  // --- Main extraction function
  const extractTextFromPDFRobust = useCallback(
    async (file) => {
      setIsExtracting(true);
      setExtractionError("");
      setTextQuality("unknown");

      try {
        const arrayBuffer = await file.arrayBuffer();
        let extractedContent = "";
        let method = extractionMethod;

        if (method === "auto") {
          const sampleSize = Math.min(arrayBuffer.byteLength, 10000);
          const sample = new Uint8Array(arrayBuffer, 0, sampleSize);
          const sampleText = new TextDecoder("utf-8", { fatal: false }).decode(
            sample
          );
          if (
            sampleText.includes("stream") &&
            sampleText.includes("endstream")
          ) {
            method = "advanced";
          } else if (
            sampleText.includes("/Filter") ||
            sampleText.includes("/FlateDecode")
          ) {
            method = "ocr-like";
          } else {
            method = "pdfjs";
          }
        }

        if (method === "pdfjs" || method === "auto") {
          try {
            if (!window.pdfjsLib) {
              const script = document.createElement("script");
              script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
              document.head.appendChild(script);
              await new Promise((res) => (script.onload = res));
              if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
              }
            }

            if (window.pdfjsLib) {
              const loadingTask = window.pdfjsLib.getDocument({
                data: arrayBuffer,
              });
              const pdf = await loadingTask.promise;
              setTotalPages(pdf.numPages);

              let pageContent = "";
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                const textItems = textContent.items
                  .filter((item) => item.str && item.str.trim().length > 0)
                  .map((item, index) => ({
                    text: cleanTextItem(item.str),
                    x: item.transform[4],
                    y: item.transform[5],
                    width: item.width,
                    height: item.height,
                    fontSize: item.height,
                    index: index,
                  }));

                textItems.sort((a, b) => {
                  const yDiff = Math.abs(a.y - b.y);
                  if (yDiff < 5) return a.x - b.x;
                  return b.y - a.y;
                });

                const pageText = reconstructText(textItems);
                if (pageText.trim()) {
                  pageContent += `\n\nPage ${pageNum}:\n${pageText}`;
                }
              }

              if (pageContent.trim()) {
                extractedContent = pageContent;
                setTextQuality("good");
              }
            }
          } catch (pdfError) {
            console.warn("PDF.js method failed:", pdfError);
          }
        }

        if (
          (method === "advanced" || method === "auto") &&
          !extractedContent.trim()
        ) {
          try {
            const content = await extractWithPatterns(arrayBuffer);
            if (content.trim()) {
              extractedContent = content;
              setTextQuality("fair");
            }
          } catch (err) {
            console.warn("Advanced method failed:", err);
          }
        }

        if (
          (method === "ocr-like" || method === "auto") &&
          !extractedContent.trim()
        ) {
          try {
            const content = await extractOCRLike(arrayBuffer);
            if (content.trim()) {
              extractedContent = content;
              setTextQuality("basic");
            }
          } catch (err) {
            console.warn("OCR-like method failed:", err);
          }
        }

        if (!extractedContent.trim()) {
          try {
            const content = await extractRawText(arrayBuffer);
            extractedContent = content;
            setTextQuality("raw");
          } catch (err) {
            console.warn("Raw extraction failed:", err);
          }
        }

        const finalText = validateAndCleanText(extractedContent);
        if (finalText.length < 10) {
          throw new Error(
            "Insufficient text extracted. The PDF might be image-based, password-protected, or corrupted."
          );
        }

        setExtractedText(finalText);
        const sentences = intelligentTextChunking(finalText);
        textChunks.current = sentences;
      } catch (error) {
        console.error("Error extracting text from PDF:", error);
        setExtractionError(
          error.message || "Failed to extract readable text from PDF"
        );
        setTextQuality("failed");
        setExtractedText("");
        textChunks.current = [];
      } finally {
        setIsExtracting(false);
      }
    },
    [extractionMethod]
  );

  // --- Summarization action
  const summarizeText = useCallback(async () => {
    if (!extractedText) {
      setSummarizationError(
        "No text available to summarize. Please upload and extract text from a PDF first."
      );
      return;
    }

    setSummary("");
    setIsSummarizing(true);
    setSummarizationError("");

    try {
      const maxLength = 10000;
      const textToSummarize = extractedText.slice(0, maxLength);
      if (extractedText.length > maxLength) {
        console.warn(
          "Text truncated to",
          maxLength,
          "characters for summarization"
        );
      }
      const result = await PdfSummarizeAiApiFn(textToSummarize, (chunk) => {
        setSummary((prev) => prev + chunk);
      });
      setSummary(result);
    } catch (error) {
      if (error.name !== "AbortError") {
        setSummarizationError(error.message || "Failed to summarize text");
      }
    } finally {
      setIsSummarizing(false);
    }
  }, [extractedText, PdfSummarizeAiApiFn]);

  // --- Voices loading
  useEffect(() => {
    const loadVoices = () => {
      if (!("speechSynthesis" in window)) return;
      const voices = speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.startsWith("en") || voice.default);
      setAvailableVoices(voices);

      const defaultVoice = voices.findIndex(
        (voice) => voice.default || voice.lang === "en-US"
      );
      if (defaultVoice !== -1) {
        setSelectedVoice(defaultVoice);
      }
    };

    loadVoices();
    if ("speechSynthesis" in window) {
      speechSynthesis.addEventListener("voiceschanged", loadVoices);
      return () =>
        speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    }
  }, []);

  // --- TTS handler
  const speakTextEnhanced = useCallback(
    (text, startFromIndex = 0) => {
      if (!text || !("speechSynthesis" in window)) {
        alert("Text-to-speech is not supported in your browser.");
        return;
      }

      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance();
      utterance.text = text;
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      utterance.volume = speechVolume;

      if (availableVoices[selectedVoice]) {
        utterance.voice = availableVoices[selectedVoice];
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentSentence(
          text.length > 100 ? text.substring(0, 100) + "..." : text
        );
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentSentence("");
        currentChunkIndex.current++;
        if (currentChunkIndex.current < textChunks.current.length) {
          setTimeout(() => {
            speakTextEnhanced(textChunks.current[currentChunkIndex.current]);
          }, 300);
        }
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentSentence("");
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [speechRate, speechPitch, speechVolume, selectedVoice, availableVoices]
  );

  // --- Controls
  const startSpeaking = () => {
    if (textChunks.current.length === 0) {
      alert("Please upload and extract text from a PDF first.");
      return;
    }
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    } else {
      currentChunkIndex.current = Math.max(0, currentPosition);
      speakTextEnhanced(textChunks.current[currentChunkIndex.current]);
    }
  };

  const pauseSpeaking = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSentence("");
  };

  const skipForward = () => {
    if (currentChunkIndex.current < textChunks.current.length - 1) {
      stopSpeaking();
      currentChunkIndex.current++;
      setCurrentPosition(currentChunkIndex.current);
      if (isSpeaking || isPaused) {
        setTimeout(() => {
          speakTextEnhanced(textChunks.current[currentChunkIndex.current]);
        }, 100);
      }
    }
  };

  const skipBackward = () => {
    if (currentChunkIndex.current > 0) {
      stopSpeaking();
      currentChunkIndex.current--;
      setCurrentPosition(currentChunkIndex.current);
      if (isSpeaking || isPaused) {
        setTimeout(() => {
          speakTextEnhanced(textChunks.current[currentChunkIndex.current]);
        }, 100);
      }
    }
  };

  const exportText = () => {
    if (!extractedText) {
      alert("No text available to export.");
      return;
    }
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pdfFile?.name || "extracted"}_text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const retryExtraction = () => {
    if (pdfFile) extractTextFromPDFRobust(pdfFile);
  };

  const handleFileUpload = (eventOrFile) => {
    const file =
      eventOrFile && eventOrFile.target
        ? eventOrFile.target.files[0]
        : eventOrFile;

    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setExtractedText("");
      setExtractionError("");
      setSummary("");
      setSummarizationError("");
      setCurrentPage(1);
      setCurrentPosition(0);
      currentChunkIndex.current = 0;
      setCurrentSentence("");
      setTextQuality("unknown");
      extractTextFromPDFRobust(file);
    } else {
      alert("Please select a valid PDF file.");
    }
  };

  // --- Derived values
  const progress =
    textChunks.current.length > 0
      ? ((currentChunkIndex.current + 1) / textChunks.current.length) * 100
      : 0;

  return {
    // State
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
    speechPitch,
    setSpeechPitch,
    speechVolume,
    setSpeechVolume,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
    currentPosition,
    setCurrentPosition,
    autoScroll,
    setAutoScroll,
    highlightText,
    setHighlightText,
    currentSentence,
    textQuality,
    summary,
    isSummarizing,
    summarizationError,

    // Refs
    fileInputRef,
    utteranceRef,
    textChunks,
    currentChunkIndex,
    textPreviewRef,

    // Actions
    handleFileUpload,
    extractTextFromPDFRobust,
    retryExtraction,
    startSpeaking,
    pauseSpeaking,
    stopSpeaking,
    skipForward,
    skipBackward,
    speakTextEnhanced,
    exportText,
    summarizeText,
    cancelSummarization,
    progress,
  };
}
