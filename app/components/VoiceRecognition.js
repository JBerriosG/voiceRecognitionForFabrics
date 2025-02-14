'use client'
import { useState, useEffect, useRef } from 'react';

const VoiceRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [lastWord, setLastWord] = useState('');
    const micRef = useRef(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const isRecognizingRef = useRef(false);

    useEffect(() => {
        if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        micRef.current = new SpeechRecognition();

        micRef.current.continuous = false; // Se activa manualmente cuando detectamos sonido
        micRef.current.lang = 'es-ES';
        micRef.current.interimResults = false;
        micRef.current.maxAlternatives = 1;

        micRef.current.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const word = lastResult[0].transcript.toLowerCase().trim();

            if (word === 'derecho' || word === 'revés') {
                setLastWord(word);
            }

            isRecognizingRef.current = false; // Permitir que se reactive con sonido
        };

        micRef.current.onend = () => {
            isRecognizingRef.current = false; // Permitir nueva detección por sonido
        };

        return () => micRef.current.abort();
    }, []);

    const startAudioProcessing = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();

            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

            const detectSound = () => {
                if (!isListening) return;

                analyserRef.current.getByteFrequencyData(dataArray);
                const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

                if (volume >= 1 && !isRecognizingRef.current) { // 🔹 Sensibilidad ajustable
                    isRecognizingRef.current = true;
                    micRef.current.start();
                }

                requestAnimationFrame(detectSound);
            };

            detectSound();
        } catch (error) {
            console.error("Error accediendo al micrófono:", error);
        }
    };

    const stopAudioProcessing = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };

    const toggleListening = () => {
        setIsListening((prev) => {
            if (!prev) {
                startAudioProcessing();
            } else {
                stopAudioProcessing();
            }
            return !prev;
        });
    };

    return (
        <div className="max-w-lg mx-auto bg-white shadow-lg rounded-2xl p-6 space-y-4 text-center">
            <h2 className="text-xl font-bold text-gray-800">Reconocimiento de voz</h2>
            <button 
                onClick={toggleListening} 
                className={`px-4 py-2 w-full font-semibold rounded-lg shadow-md transition ${
                    isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
            >
                {isListening ? 'Detener escucha' : 'Comenzar a escuchar'}
            </button>
            <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
                <p className="text-gray-700 font-medium text-2xl">{lastWord || "Aún no has dicho nada"}</p>
            </div>
        </div>
    );
}

export default VoiceRecognition;
