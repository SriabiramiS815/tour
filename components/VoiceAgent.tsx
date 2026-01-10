import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { VOICE_MODEL, SYSTEM_INSTRUCTION, TOOLS } from '../constants';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';

interface VoiceAgentProps {
  apiKey: string;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({ apiKey }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // AI Session Ref
  const sessionRef = useRef<Promise<any> | null>(null);
  const mountedRef = useRef(true);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 5));

  const cleanupAudio = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    sourceNodesRef.current.forEach(node => node.stop());
    sourceNodesRef.current.clear();

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const stopSession = async () => {
    if (!sessionRef.current && !isConnected && !isConnecting) return;
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    cleanupAudio();
    if (sessionRef.current) {
      try {
        const session = await sessionRef.current;
        await session.close();
        addLog("Call ended");
      } catch (e) {
        console.error("Error closing session:", e);
      }
      sessionRef.current = null;
    }
  };

  const startSession = async () => {
    await stopSession();
    setError(null);
    setIsConnecting(true);
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass(); // Use system default sample rate
      await ctx.resume(); // Ensure context is running (fixes autoplay policy issues)
      audioContextRef.current = ctx;
      nextStartTimeRef.current = ctx.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 }
      });

      addLog("Connecting...");

      const currentAi = new GoogleGenAI({ apiKey });
      const sessionPromise = currentAi.live.connect({
        model: VOICE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: TOOLS }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
        callbacks: {
          onopen: () => {
            if (!mountedRef.current) return;
            setIsConnected(true);
            setIsConnecting(false);
            addLog("Connected. Speak now!");

            const inputCtx = new AudioContextClass({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
              if (!sessionRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData, 16000);
              sessionPromise.then(session => {
                if (sessionRef.current) session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
            inputSourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (!mountedRef.current) return;
            const { serverContent, toolCall } = msg;

            const audioData = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              setIsSpeaking(true);
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

              const audioBuffer = await decodeAudioData(
                base64ToUint8Array(audioData),
                ctx,
                24000,
                1
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourceNodesRef.current.add(source);
              source.onended = () => {
                sourceNodesRef.current.delete(source);
                if (sourceNodesRef.current.size === 0) setIsSpeaking(false);
              };
            }

            if (serverContent?.interrupted) {
              sourceNodesRef.current.forEach(node => node.stop());
              sourceNodesRef.current.clear();
              if (audioContextRef.current) nextStartTimeRef.current = audioContextRef.current.currentTime;
              setIsSpeaking(false);
            }

            if (toolCall) {
              const functionResponses = await Promise.all(toolCall.functionCalls.map(async (fc) => {
                if (fc.name === 'submit_booking_request') {
                  addLog("Processing Booking...");
                  try {
                    const response = await fetch('http://localhost:3001/api/create-booking', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(fc.args),
                    });

                    const data = await response.json();

                    if (data.success) {
                      addLog("Booking Confirmed & Email Sent!");
                      return {
                        id: fc.id,
                        name: fc.name,
                        response: { result: "Booking processed successfully. Email sent." }
                      };
                    } else {
                      addLog("Booking Failed");
                      return {
                        id: fc.id,
                        name: fc.name,
                        response: { result: `Error: ${data.message}` }
                      };
                    }
                  } catch (err) {
                    addLog("Server Error");
                    return {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "Failed to connect to server." }
                    };
                  }
                }

                // Fallback for form display (Voice Mode usually doesn't show forms, but just in case)
                if (fc.name === 'display_booking_form') {
                  addLog("Form requested (Voice Mode)");
                  return {
                    id: fc.id,
                    name: fc.name,
                    response: { result: "Tell the user you can just take the details verbally." }
                  };
                }

                return {
                  id: fc.id,
                  name: fc.name,
                  response: { status: "unknown tool" }
                };
              }));
              sessionPromise.then(session => session.sendToolResponse({ functionResponses }));
            }
          },
          onclose: () => {
            if (!mountedRef.current) return;
            setIsConnected(false);
            setIsConnecting(false);
            addLog("Call Ended");
          },
          onerror: (err) => {
            if (!mountedRef.current) return;
            setError("Connection Error");
            setIsConnected(false);
            setIsConnecting(false);
            stopSession();
          }
        }
      });
      sessionRef.current = sessionPromise;
    } catch (e: any) {
      setError(e.message || "Microphone Error");
      setIsConnecting(false);
      stopSession();
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopSession();
    };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-between p-8 bg-gradient-to-b from-indigo-600 to-indigo-900 text-white relative overflow-hidden">

      {/* Background Visuals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl"></div>
        {isConnected && (
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 via-transparent to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
        )}
      </div>

      <div className="z-10 w-full text-center mt-4">
        <h2 className="text-2xl font-semibold tracking-tight text-white drop-shadow-md">Sri Voice Assistant</h2>
        <p className="text-indigo-200 text-sm mt-1">Speak in Hindi, English, Tamil...</p>
      </div>

      {/* Main Visualizer */}
      <div className="z-10 flex flex-col items-center justify-center flex-1 w-full relative">

        <div className="relative flex items-center justify-center">

          {/* Connecting Spinner */}
          {isConnecting && (
            <div className="absolute w-52 h-52 rounded-full border-2 border-white/20 border-t-white animate-spin duration-1000"></div>
          )}

          {/* Ripple Effects when Speaking */}
          {isSpeaking && (
            <>
              <div className="absolute w-full h-full rounded-full bg-white/10 animate-pulse-ring"></div>
              <div className="absolute w-full h-full rounded-full bg-indigo-400/20 animate-pulse-ring delay-150"></div>
              <div className="absolute w-full h-full rounded-full bg-teal-400/10 animate-pulse-ring delay-300"></div>
            </>
          )}

          {/* Breathing Ring when Connected & Silent */}
          {isConnected && !isSpeaking && (
            <div className="absolute w-44 h-44 rounded-full border border-white/10 animate-pulse"></div>
          )}

          {/* Main Orb */}
          <div className={`
              relative w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500
              ${isConnected
              ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 shadow-[0_0_50px_rgba(99,102,241,0.5)]'
              : 'bg-white/10 backdrop-blur-md border border-white/20'
            }
              ${isSpeaking ? 'scale-105' : 'scale-100'}
            `}>
            {isConnected ? (
              /* Dynamic Waveform */
              <div className="flex items-end justify-center space-x-1.5 h-16 w-full px-8 pb-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-2 bg-white rounded-full transition-all duration-150 ease-in-out ${isSpeaking ? 'opacity-100' : 'opacity-60'}`}
                    style={{
                      height: isSpeaking ? `${Math.max(20, Math.random() * 100)}%` : '20%',
                      animation: isSpeaking ? `bounce 0.8s infinite ${i * 0.1}s` : 'none'
                    }}
                  />
                ))}
              </div>
            ) : (
              /* Mic Icon */
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-12 h-12 text-white/70 ${isConnecting ? 'animate-pulse' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            )}
          </div>
        </div>

        <div className="mt-8 h-6">
          <span className={`text-sm font-medium tracking-wide transition-opacity duration-300 ${isConnected ? 'text-teal-300 opacity-100' : 'text-indigo-300 opacity-0'}`}>
            {isSpeaking ? "Sri is speaking..." : isConnected ? "Listening..." : ""}
          </span>
        </div>
      </div>

      {/* Controls & Logs */}
      <div className="z-10 w-full space-y-6 flex flex-col items-center max-w-md mx-auto">
        {/* Log Output */}
        <div className="h-24 w-full flex flex-col items-center justify-start overflow-hidden pointer-events-none space-y-1 mask-linear-fade">
          {error ? (
            <div className="mt-2 animate-bounce">
              <p className="text-white text-sm font-medium bg-red-600/80 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">{error}</p>
            </div>
          ) : log.length > 0 ? (
            log.map((msg, i) => (
              <p
                key={i}
                className={`text-center transition-all duration-500 ${i === 0
                  ? 'text-white font-medium text-sm transform scale-100 drop-shadow-md'
                  : 'text-indigo-200/60 text-xs'
                  }`}
                style={{ opacity: Math.max(0, 1 - i * 0.25) }}
              >
                {msg}
              </p>
            ))
          ) : (
            <p className="text-indigo-300/50 text-sm mt-4">Press Start to begin</p>
          )}
        </div>

        {/* Call Button */}
        {!isConnected && !isConnecting ? (
          <button
            onClick={startSession}
            className="group relative w-full max-w-xs bg-white hover:bg-indigo-50 text-indigo-900 font-bold py-4 rounded-full shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-3 overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-indigo-100/50 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-indigo-600">
              <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6V4.5Z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10 text-lg">Start Call</span>
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="w-16 h-16 bg-red-500 text-white rounded-full shadow-xl hover:bg-red-600 hover:scale-105 transform transition-all active:scale-95 flex items-center justify-center ring-4 ring-red-500/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M13.414 12l5.293 5.293a1 1 0 0 1-1.414 1.414L12 13.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L10.586 12 5.293 6.707a1 1 0 0 1 1.414-1.414L12 10.586l5.293-5.293a1 1 0 0 1 1.414 1.414L13.414 12z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};