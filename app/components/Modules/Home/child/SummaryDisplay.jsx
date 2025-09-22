import React, { useEffect, useRef, useState } from "react";
import { Loader, X, FileText, File, DockIcon } from "lucide-react";

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

  // Load jsPDF and docx libraries dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load jsPDF
    const jspdfScript = document.createElement("script");
    jspdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    jspdfScript.onload = () => {
      setLibrariesLoaded((prev) => ({ ...prev, jsPDF: true }));
    };
    jspdfScript.onerror = () => {
      console.error("Failed to load jsPDF");
      setLibrariesLoaded((prev) => ({ ...prev, jsPDF: false }));
    };
    document.head.appendChild(jspdfScript);

    // Load docx
    const docxScript = document.createElement("script");
    docxScript.src = "https://cdn.jsdelivr.net/npm/docx@9.0.0/build/index.min.js";
    docxScript.onload = () => {
      setLibrariesLoaded((prev) => ({ ...prev, docx: true }));
    };
    docxScript.onerror = () => {
      console.error("Failed to load docx");
      setLibrariesLoaded((prev) => ({ ...prev, docx: false }));
    };
    document.head.appendChild(docxScript);

    return () => {
      document.head.removeChild(jspdfScript);
      document.head.removeChild(docxScript);
    };
  }, []);

  // Auto-scroll to latest summary content
  useEffect(() => {
    if (summary && summaryContainerRef.current) {
      const container = summaryContainerRef.current;
      container.scrollTop = container.scrollHeight; // Auto-scroll to bottom
      setLastUpdated(new Date().toLocaleTimeString()); // Update timestamp
    }
  }, [summary]);

  // Export summary as .txt
  const exportToTxt = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export summary as .pdf
  const exportToPdf = () => {
    if (!summary || !window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    // Split text to fit within PDF margins (10mm left/right)
    const lines = doc.splitTextToSize(summary, 180);
    let yPosition = 10;
    lines.forEach((line) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 10;
      }
      doc.text(line, 10, yPosition);
      yPosition += 7;
    });

    doc.save("summary.pdf");
  };

  // Export summary as .docx
  const exportToDocx = () => {
    if (!summary || !window.docx) return;
    const { Document, Packer, Paragraph, TextRun } = window.docx;
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun(summary)],
            }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "summary.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="bg-gradient-to-br from-gray-100 to-blue-100 rounded-2xl p-8 shadow-xl border border-gray-200/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight drop-shadow-sm">
          AI-Generated Summary
        </h3>
        {extractedText && !isSummarizing && (
          <button
            onClick={summarizeText}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 animate-pulse-button"
          >
            <span>Generate Summary</span>
          </button>
        )}
      </div>

      {isSummarizing && (
        <div className="flex items-center gap-4 mb-6 bg-blue-200/50 p-4 rounded-lg border border-blue-300/50">
          <Loader className="h-7 w-7 text-blue-600 animate-spin" />
          <p className="text-blue-700 font-medium text-lg">
            Generating summary
            <span className="inline-block animate-pulse-dots">...</span>
          </p>
          <button
            onClick={cancelSummarization}
            className="ml-auto p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all duration-200 hover:scale-110 hover:shadow-md"
            title="Cancel summarization"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {summarizationError && (
        <p className="text-red-600 text-sm mb-6 bg-red-50/80 p-4 rounded-lg border border-red-200/50">
          {summarizationError}
        </p>
      )}

      {summary && (
        <div
          className="relative bg-white/90 p-6 rounded-xl shadow-md border border-gray-100/50 max-h-96 overflow-y-auto scroll-smooth"
          ref={summaryContainerRef}
        >
          <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap animate-text-fade-in">
            {summary}
          </p>
          {isSummarizing && (
            <span className="inline-block w-2 h-5 bg-indigo-600 animate-blink ml-1" />
          )}
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-2 italic">
              Last updated: {lastUpdated}
            </p>
          )}
          <div className="mt-4 flex gap-3 flex-wrap">
            <button
              onClick={exportToTxt}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
              disabled={!summary}
              title="Export as Text"
            >
              <FileText className="h-5 w-5" />
              <span>.txt</span>
            </button>
            <button
              onClick={exportToPdf}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
              disabled={!summary || !librariesLoaded.jsPDF}
              title={librariesLoaded.jsPDF ? "Export as PDF" : "PDF library not loaded"}
            >
              <File className="h-5 w-5" />
              <span>.pdf</span>
            </button>
            <button
              onClick={exportToDocx}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
              disabled={!summary || !librariesLoaded.docx}
              title={librariesLoaded.docx ? "Export as Word" : "Word library not loaded"}
            >
              <DockIcon className="h-5 w-5" />
              <span>.docx</span>
            </button>
          </div>
          {!librariesLoaded.jsPDF && summary && (
            <p className="text-yellow-600 text-sm mt-2 bg-yellow-50/80 p-2 rounded-lg">
              Warning: PDF export unavailable (library failed to load).
            </p>
          )}
          {!librariesLoaded.docx && summary && (
            <p className="text-yellow-600 text-sm mt-2 bg-yellow-50/80 p-2 rounded-lg">
              Warning: Word export unavailable (library failed to load).
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryDisplay;
