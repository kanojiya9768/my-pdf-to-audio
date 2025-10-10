'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Play, Pause, Download, Volume2, Loader2, Languages, X, Brain, Sparkles, Zap, Eye, MessageSquare, BarChart3, Send } from 'lucide-react';

const StreamingPDFAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en-US');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [analysisType, setAnalysisType] = useState('summary');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamingRef = useRef(null);
  const API_KEY = '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';

  // Language options with native names
  const languages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
    { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
    { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'hi-IN', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ar-SA', name: 'العربية', flag: '🇸🇦' }
  ];

  const analysisTypes = [
    { id: 'summary', label: 'Summary', icon: FileText, color: 'blue' },
    { id: 'insights', label: 'Key Insights', icon: Eye, color: 'purple' },
    { id: 'qa', label: 'Q&A Generation', icon: MessageSquare, color: 'indigo' },
    { id: 'analysis', label: 'Deep Analysis', icon: BarChart3, color: 'violet' }
  ];

  // Convert PDF to Base64
  const encodePDFToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(`data:application/pdf;base64,${base64String}`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Auto-scroll to bottom of streaming content
  useEffect(() => {
    if (streamingRef.current) {
      streamingRef.current.scrollTop = streamingRef.current.scrollHeight;
    }
  }, [streamingText]);

  // AI Analysis with Streaming Response
  const analyzeWithAI = async (base64PDF, analysisType,file) => {
    setIsAnalyzing(true);
    setIsStreaming(true);
    setStreamingText('');
    setAiAnalysis('');
    setStreamComplete(false);
    
    const prompts = {
      summary: 'Provide a comprehensive summary of this document, highlighting the main points and key information. Format your response with clear sections and bullet points where appropriate.',
      insights: 'Extract the most important insights, trends, and actionable information from this document. Present findings in a structured format with key takeaways.',
      qa: 'Generate 5-7 important questions and answers based on the content of this document. Format as Q: Question followed by A: Answer for each pair.',
      analysis: 'Perform a deep analysis of this document, including themes, implications, and recommendations. Structure your analysis with clear headings and detailed explanations.'
    };

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemma-3n-e4b-it:free',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompts[analysisType],
                },
                {
                  type: 'file',
                  file: {
                    filename: file.name,
                    file_data: base64PDF,
                  },
                },
              ],
            },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setStreamComplete(true);
          setIsStreaming(false);
          setAiAnalysis(fullResponse);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              setStreamComplete(true);
              setIsStreaming(false);
              setAiAnalysis(fullResponse);
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullResponse += content;
                setStreamingText(fullResponse);
              }
            } catch (e) {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      }

    } catch (error) {
      console.error('AI Analysis Error:', error);
      setStreamingText('Error analyzing document. Please try again.');
      setIsStreaming(false);
      setStreamComplete(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle file upload and AI analysis
  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile || uploadedFile.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    
    setFile(uploadedFile);
    setExtractedText('');
    setAiAnalysis('');
    setStreamingText('');
    
    try {
      setIsExtracting(true);
      const base64PDF = await encodePDFToBase64(uploadedFile);
      setIsExtracting(false);
      
      // Auto-analyze with default type
      await analyzeWithAI(base64PDF, analysisType,uploadedFile);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      setIsExtracting(false);
      alert('Error processing PDF file');
    }
  };

  // Re-analyze with different type
  const handleAnalysisTypeChange = async (newType) => {
    setAnalysisType(newType);
    if (file) {
      const base64PDF = await encodePDFToBase64(file);
      await analyzeWithAI(base64PDF, newType,file);
    }
  };

  // Generate audio from AI analysis
  const generateAudio = async () => {
    const textToSpeak = streamComplete ? aiAnalysis : streamingText;
    if (!textToSpeak.trim()) return;
    
    setIsGeneratingAudio(true);
    
    try {
      if (!window.speechSynthesis) {
        throw new Error('Speech synthesis not supported');
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => 
        voice.lang === currentLanguage || 
        voice.lang.startsWith(currentLanguage.split('-')[0])
      );
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.lang = currentLanguage;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsGeneratingAudio(false);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        setIsGeneratingAudio(false);
      };

      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Error generating audio:', error);
      setIsGeneratingAudio(false);
      alert('Error generating audio. Please try again.');
    }
  };

  // Play/Pause toggle
  const togglePlayback = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        generateAudio();
      }
    }
  };

  // Stop playback
  const stopPlayback = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Download analysis
  const downloadAnalysis = () => {
    const textToDownload = streamComplete ? aiAnalysis : streamingText;
    if (!textToDownload) return;
    
    const content = `AI Analysis Report - ${analysisTypes.find(t => t.id === analysisType)?.label}\n\n${textToDownload}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name || 'document'}_${analysisType}_analysis.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear everything
  const clearAll = () => {
    setFile(null);
    setExtractedText('');
    setAiAnalysis('');
    setStreamingText('');
    stopPlayback();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  return (
    <div className="min-h-screen bg-white bg-gradient-to-r from-blue-500 to-purple-500">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <Brain className="w-12 h-12 text-white drop-shadow-lg" />
              <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                AI PDF Analyzer Pro
              </h1>
              <p className="text-white/90 text-lg drop-shadow">Streaming AI analysis powered by Google Gemma</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Panel - Upload & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <div className="bg-white/90 backdrop-blur-lg border border-white/40 rounded-2xl p-6 shadow-xl">
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-purple-400 transition-all duration-300">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <div className="relative inline-block mb-4">
                    <Upload className="w-12 h-12 text-blue-600 mx-auto animate-bounce" />
                    {file && <Zap className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />}
                  </div>
                  <p className="text-xl font-medium text-gray-800 mb-2">
                    {file ? file.name : 'Upload PDF Document'}
                  </p>
                  <p className="text-gray-600">
                    Drag & drop or click to select your PDF for AI analysis
                  </p>
                </label>
                {file && (
                  <button
                    onClick={clearAll}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-300 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Analysis Type Selection */}
            {file && (
              <div className="bg-white/90 backdrop-blur-lg border border-white/40 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  AI Analysis Type
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {analysisTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleAnalysisTypeChange(type.id)}
                        disabled={isAnalyzing}
                        className={`p-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                          analysisType === type.id
                            ? `bg-gradient-to-r from-${type.color}-500 to-${type.color}-600 text-white shadow-lg`
                            : 'bg-white/50 border border-gray-200 text-gray-700 hover:bg-white/80'
                        } disabled:opacity-50`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="font-medium">{type.label}</span>
                        {analysisType === type.id && isAnalyzing && (
                          <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Language & Audio Controls */}
            {(streamingText || aiAnalysis) && (
              <div className="bg-white/90 backdrop-blur-lg border border-white/40 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-purple-600" />
                  Text-to-Speech
                </h3>
                
                {/* Language Grid */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {languages.slice(0, 6).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLanguage(lang.code);
                        stopPlayback();
                      }}
                      className={`p-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                        currentLanguage === lang.code
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Audio Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={togglePlayback}
                    disabled={isGeneratingAudio}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                  >
                    {isGeneratingAudio ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    {isGeneratingAudio ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
                  </button>

                  <button
                    onClick={downloadAnalysis}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>

                  <button
                    onClick={stopPlayback}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg"
                  >
                    <Volume2 className="w-4 h-4" />
                    Stop
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Streaming AI Analysis */}
          <div className="lg:col-span-3">
            {/* Processing Status */}
            {(isExtracting || isAnalyzing) && !streamingText && (
              <div className="bg-white/90 backdrop-blur-lg border border-white/40 rounded-2xl p-6 mb-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"></div>
                  </div>
                  <span className="text-gray-800 font-medium">
                    {isExtracting ? 'Extracting PDF content...' : 'Google Gemma AI is starting analysis...'}
                  </span>
                </div>
              </div>
            )}

            {/* Streaming Response Display */}
            {(streamingText || aiAnalysis || isStreaming) && (
              <div className="bg-white/95 backdrop-blur-lg border border-white/40 rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">
                        AI {analysisTypes.find(t => t.id === analysisType)?.label}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {isStreaming ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-sm">Generating...</span>
                        </div>
                      ) : streamComplete ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm">Complete</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                
                {/* Streaming Content */}
                <div 
                  ref={streamingRef}
                  className="p-6 max-h-96 overflow-y-auto bg-gray-50"
                >
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {streamingText || aiAnalysis}
                      {isStreaming && (
                        <span className="inline-block w-2 h-5 bg-blue-600 animate-pulse ml-1"></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Message */}
            {!file && !isExtracting && (
              <div className="bg-white/90 backdrop-blur-lg border border-white/40 rounded-2xl p-8 text-center shadow-xl">
                <div className="relative inline-block mb-6">
                  <FileText className="w-20 h-20 text-blue-600 mx-auto" />
                  <Sparkles className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Ready for Streaming AI Analysis</h3>
                <p className="text-gray-600 text-lg mb-8">
                  Upload a PDF document to experience real-time AI analysis with live streaming responses
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6 text-left">
                    <Send className="w-8 h-8 text-blue-600 mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">Live Streaming</h4>
                    <p className="text-gray-600 text-sm">
                      Watch AI responses generate in real-time, just like ChatGPT
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6 text-left">
                    <Volume2 className="w-8 h-8 text-purple-600 mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">Multi-Language Audio</h4>
                    <p className="text-gray-600 text-sm">
                      Convert streaming analysis to natural speech in 13+ languages
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingPDFAnalyzer;