'use client';
import { useState, useEffect, useRef } from 'react';

const VoiceRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [lastPoint, setLastPoint] = useState('');
    const [points, setPoints] = useState([]);
    const isRecognizingRef = useRef(false);
    const micRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const silenceTimeoutRef = useRef(null);

    useEffect(() => {
        if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        micRef.current = new SpeechRecognition();

        micRef.current.continuous = false;
        micRef.current.lang = 'es-ES';
        micRef.current.interimResults = false;
        micRef.current.maxAlternatives = 1;

        micRef.current.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const point = lastResult[0].transcript.toLowerCase().trim();

            if (point.includes('derecho') || point.includes('revés')) {
                setTranscription(point);
                setPoints((prevPoints) => {
                    const updatedPoints = [...prevPoints, point];
                    setLastPoint(updatedPoints[updatedPoints.length - 1]);
                    return updatedPoints;
                });
            }

            isRecognizingRef.current = false;
        };

        micRef.current.onend = () => {
            isRecognizingRef.current = false;
        };

        return () => {
            micRef.current.abort();
        };
    }, []);

    useEffect(() => {
        if (!isListening) return;

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

                    if (volume > 5 && !isRecognizingRef.current) {  // 🔹 Ajustado para mayor sensibilidad
                        isRecognizingRef.current = true;
                        micRef.current.start();
                    }

                    // Si hay silencio prolongado, genera el siguiente punto
                    clearTimeout(silenceTimeoutRef.current);
                    silenceTimeoutRef.current = setTimeout(() => {
                        if (!isRecognizingRef.current && points.length > 0) {
                            const nextPoint = lastPoint === 'derecho' ? 'revés' : 'derecho';
                            const utterance = new SpeechSynthesisUtterance(`El siguiente punto es: ${nextPoint}`);
                            utterance.lang = 'es-ES';
                            window.speechSynthesis.speak(utterance);
                        }
                    }, 2500); // 🔹 Espera 2.5s de silencio antes de generar un punto

                    requestAnimationFrame(detectSound);
                };

                detectSound();
            } catch (error) {
                console.error("Error accediendo al micrófono:", error);
            }
        };

        startAudioProcessing();

        return () => {
            clearTimeout(silenceTimeoutRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [isListening]);

    const toggleListening = () => {
        setIsListening((prev) => !prev);
    };

    return (
        <div className="max-w-lg mx-auto bg-white shadow-lg rounded-2xl p-6 space-y-4 text-center">
            <h2 className="text-xl font-bold text-gray-800">Reconocimiento de voz automático</h2>
            <button 
                onClick={toggleListening} 
                className={`px-4 py-2 w-full font-semibold rounded-lg shadow-md transition ${
                    isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
            >
                {isListening ? 'Detener escucha' : 'Comenzar a escuchar'}
            </button>
            <div className="bg-gray-100 p-4 rounded-lg shadow-inner space-y-2">
                <p className="text-gray-700 font-medium">
                    Estado del micrófono: <span className={`font-bold ${isListening ? 'text-green-600' : 'text-red-600'}`}>
                        {isListening ? 'Activo' : 'Desactivado'}
                    </span>
                </p>
                <p className="text-gray-700 font-medium">Último punto registrado: <span className="font-bold">{lastPoint}</span></p>
                <p className="text-gray-700 font-medium">Lo que dijiste: <span className="italic">{transcription}</span></p>
                <p className="text-gray-700 font-medium">Secuencia de puntos: <span className="font-mono">{points.join(', ')}</span></p>
            </div>
        </div>
    );
}

export default VoiceRecognition;
