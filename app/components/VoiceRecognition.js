'use client';
import { useState, useEffect, useRef } from 'react';

const VoiceRecognition = () => {
    const [transcription, setTranscription] = useState('');
    const [lastPoint, setLastPoint] = useState('');
    const [points, setPoints] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const micRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        micRef.current = new SpeechRecognition();

        micRef.current.continuous = false; // Para evitar que se quede activo todo el tiempo
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
        };

        micRef.current.onend = () => {
            if (isSpeaking) micRef.current.start();
        };

        return () => {
            micRef.current.stop();
        };
    }, [isSpeaking]);

    useEffect(() => {
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
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

                    if (volume > 10 && !isSpeaking) {
                        setIsSpeaking(true);
                        micRef.current.start();
                    } else if (volume <= 10 && isSpeaking) {
                        setIsSpeaking(false);
                        micRef.current.stop();
                    }

                    requestAnimationFrame(detectSound);
                };

                detectSound();
            } catch (error) {
                console.error("Error accediendo al micrófono:", error);
            }
        };

        startAudioProcessing();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return (
        <div className="max-w-lg mx-auto bg-white shadow-lg rounded-2xl p-6 space-y-4 text-center">
            <h2 className="text-xl font-bold text-gray-800">Reconocimiento de voz automático</h2>
            <div className="bg-gray-100 p-4 rounded-lg shadow-inner space-y-2">
                <p className="text-gray-700 font-medium">
                    Estado del micrófono: <span className={`font-bold ${isSpeaking ? 'text-green-600' : 'text-red-600'}`}>
                        {isSpeaking ? 'Escuchando...' : 'Silencioso'}
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
