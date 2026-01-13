import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';
import { TEXT_MODEL, TRANSCRIPTION_MODEL, SYSTEM_INSTRUCTION, TOOLS } from '../constants';
import { arrayBufferToBase64 } from '../utils/audioUtils';
import { BookingForm } from './BookingForm';

interface ChatAgentProps {
  apiKey: string;
  initialMessage?: string;
}

export const ChatAgent: React.FC<ChatAgentProps> = ({ apiKey, initialMessage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize AI logic
  const ai = useRef(new GoogleGenAI({ apiKey })).current;
  const [chatSession, setChatSession] = useState<any>(null);
  const initialized = useRef(false);

  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initChat = async () => {
      try {
        const session = ai.chats.create({
          model: TEXT_MODEL,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: TOOLS }],
            generationConfig: { temperature: 0.4 },
          },
        });
        setChatSession(session);

        const startMsg = initialMessage || "Namaste! Vanakkam! I am Sri, your multilingual travel guide.\n\n🇮🇳 Namaste! Main Sri hoon. Bataiye aaj main aapki kaise madad kar sakta hoon?\n🙏 Vanakkam! Naan Sri. Ungal payanathai thittamida eppadi udava mudiyum?\n\nI speak English, Hindi, Tamil, Telugu, Malayalam, Kannada, and Bengali. How can I help you plan your trip today?";

        setMessages([
          {
            id: 'init',
            role: 'model',
            text: startMsg,
            timestamp: new Date()
          }
        ]);
      } catch (error) {
        console.error("Failed to start chat", error);
      }
    };
    initChat();
  }, [apiKey, initialMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Voice Input Logic ---
  const handleFunctionCalls = async (result: any) => {
    // Handle Function Calling Loop
    let currentResult = result;
    while (currentResult.functionCalls && currentResult.functionCalls.length > 0) {
      const functionResponses = await Promise.all(currentResult.functionCalls.map(async (fc: any) => {
        console.log(`Calling tool: ${fc.name}`, fc.args);

        let responseData = { result: "Success" };

        if (fc.name === 'display_booking_form') {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '_form',
            role: 'form',
            text: "Please fill out the booking details below:",
            timestamp: new Date(),
            formData: { destination: fc.args.prefill_destination || '' },
            formSubmitted: false
          }]);
          responseData = { result: "Booking form displayed to user. Waiting for submission." };
        }
        else if (fc.name === 'submit_booking_request') {
          // Unified Booking & Email Tool
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '_sys_loading',
            role: 'system',
            text: "Processing your booking... ⏳",
            timestamp: new Date()
          }]);

          try {
            // Call our new unified backend endpoint
            const response = await fetch('http://localhost:3001/api/create-booking', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fc.args),
            });

            const data = await response.json();

            if (data.success) {
              const bookingDetails = `✅ Booking Confirmed & Email Sent!\n\nDestination: ${fc.args.destination}\nName: ${fc.args.customer_name}\nStatus: ${data.dbStatus === 'saved' ? 'Saved to DB' : 'Processed'}`;

              // Remove loading message and add success
              setMessages(prev => prev.filter(m => !m.text.includes('Processing')).concat({
                id: Date.now().toString() + '_sys',
                role: 'system',
                text: bookingDetails,
                timestamp: new Date()
              }));

              responseData = { result: "Booking processed successfully. Email sent to customer." };

            } else {
              responseData = { result: `Error: ${data.message}` };
              setMessages(prev => prev.filter(m => !m.text.includes('Processing')).concat({
                id: Date.now().toString() + '_err',
                role: 'system',
                text: `❌ Error: ${data.message}`,
                timestamp: new Date(),
                isError: true
              }));
            }
          } catch (e) {
            console.error("Booking API Error", e);
            responseData = { result: "Failed to connect to server." };
            setMessages(prev => prev.filter(m => !m.text.includes('Processing')).concat({
              id: Date.now().toString() + '_err',
              role: 'system',
              text: "❌ Network Error: Could not connect to server.",
              timestamp: new Date(),
              isError: true
            }));
          }
        }

        // IMPORTANT: Must include the 'id' of the function call in the response
        return {
          functionResponse: {
            name: fc.name,
            id: fc.id, // Include the ID from the call
            response: responseData
          }
        };
      }));

      // Send tool results back to the model
      console.log("Sending function responses:", functionResponses);
      currentResult = await chatSession.sendMessage(functionResponses);
    }

    const modelText = currentResult.text;

    if (modelText) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: modelText,
        timestamp: new Date()
      }]);
    }
  };

  const handleFormSubmit = async (data: any) => {
    // 1. Show form submitted UI
    setMessages(prev => prev.map(msg =>
      msg.role === 'form' && !msg.formSubmitted ? { ...msg, formSubmitted: true } : msg
    ));

    // 2. Add visual confirmation of details
    const submissionText = `✅ Booking Form Submitted:
Destination: ${data.destination}
Duration: ${data.duration}
Package: ${data.packageType}
Date: ${data.travelDate}
Name: ${data.customerName}
Mobile: ${data.customerMobile}
Email: ${data.customerEmail}

Please confirm these details to proceed with the booking.`;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: submissionText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // 3. Send to Gemini so it "knows" the details and can call submit_booking_request
    try {
      if (chatSession) {
        // We send the form data text. The model (per system instructions) should see this 
        // and either ask for confirmation or call submit_booking_request if it feels confident.
        const result = await chatSession.sendMessage({ message: submissionText });
        await handleFunctionCalls(result);
      }
    } catch (e) {
      console.error("Form submission error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = async () => {
    if (isRecording) {
      // Stop Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start Recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Stop all tracks to release mic
          stream.getTracks().forEach(track => track.stop());

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          setIsLoading(true);
          try {
            const buffer = await audioBlob.arrayBuffer();
            const base64Audio = arrayBufferToBase64(buffer);

            // Transcribe using Gemini
            const response = await ai.models.generateContent({
              model: TRANSCRIPTION_MODEL,
              contents: {
                parts: [
                  { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
                  { text: "Transcribe the spoken language in this audio to text exactly as spoken. Return ONLY the text, no other commentary." }
                ]
              }
            });

            const transcript = response.text;
            if (transcript) {
              setInputText(prev => (prev ? prev + ' ' : '') + transcript.trim());
            }
          } catch (error) {
            console.error("Transcription error:", error);
            // Optionally show error in UI or just console
          } finally {
            setIsLoading(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone. Please allow permissions.");
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !chatSession) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      let result = await chatSession.sendMessage({ message: userMsg.text });
      await handleFunctionCalls(result);

    } catch (error) {
      console.error("Chat Error", error);
      console.error("Chat Error Detailed:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `I'm having trouble connecting to the network. Error: ${(error as any).message || 'Unknown error'}. Please check your internet connection.`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
          >
            {msg.role === 'system' ? (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-6 py-4 text-sm font-medium shadow-sm whitespace-pre-wrap text-center max-w-[85%] animate-fadeIn border-l-4 border-l-emerald-500">
                {msg.text}
              </div>
            ) : (
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm text-sm md:text-base leading-relaxed ${msg.role === 'user'
                  ? 'bg-teal-600 text-white rounded-br-none'
                  : msg.isError
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-bl-none'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className={`text-[10px] block mt-1.5 opacity-70 ${msg.role === 'user' ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {/* Render Form if role is 'form' */}
            {msg.role === 'form' && !msg.formSubmitted && (
              <div className="w-full max-w-md my-2">
                <BookingForm
                  onSubmit={handleFormSubmit}
                  initialDestination={msg.formData?.destination}
                  isSubmitting={isLoading}
                />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex space-x-1 items-center">
              {isRecording ? (
                <span className="text-xs text-red-500 font-semibold animate-pulse mr-2">Transcribing...</span>
              ) : (
                <>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex space-x-2 max-w-4xl mx-auto">
          {/* Voice Input Button */}
          <button
            onClick={handleMicToggle}
            className={`rounded-full w-12 h-12 transition-all flex items-center justify-center shadow-md ${isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-300 dark:border-slate-700 hover:border-teal-500'
              }`}
            title="Voice Input"
          >
            {isRecording ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
              </svg>
            )}
          </button>

          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : "Type in English, Hindi, Tamil..."}
            className={`flex-1 border border-slate-300 dark:border-slate-700 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 shadow-sm ${isRecording ? 'bg-red-50 dark:bg-red-900/20 placeholder-red-400' : ''}`}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full w-12 h-12 transition-colors flex items-center justify-center shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};