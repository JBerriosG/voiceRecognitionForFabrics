'use client'
import { useState, useEffect, useRef } from 'react';

const VoiceRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [lastPoint, setLastPoint] = useState('');
    const [points, setPoints] = useState([]);
    const [hasTranscribed, setHasTranscribed] = useState(false);
    const micRef = useRef(null);

    useEffect(() => {
        if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        micRef.current = new SpeechRecognition();

        micRef.current.continuous = true;
        micRef.current.lang = 'es-ES';
        micRef.current.interimResults = false;
        micRef.current.maxAlternatives = 1;

        micRef.current.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const point = lastResult[0].transcript.toLowerCase().trim();

            if (point.includes('derecho') || point.includes('revés')) {
                setTranscription(point);
                setHasTranscribed(true);
                setPoints((prevPoints) => {
                    const updatedPoints = [...prevPoints, point];
                    setLastPoint(updatedPoints[updatedPoints.length - 1]);
                    return updatedPoints;
                });
            }
        };

        micRef.current.onend = () => {
            if (isListening) {
                setTimeout(() => micRef.current.start(), 500); // Espera medio segundo antes de reiniciar
            }
        };

        return () => {
            micRef.current.stop();
        };
    }, []);

    useEffect(() => {
        if (isListening) {
            setHasTranscribed(false);
            micRef.current.start();
        } else {
            micRef.current.stop();
        }
    }, [isListening]);

    useEffect(() => {
        if (!isListening && points.length > 0) {
            const timer = setTimeout(() => {
                if (!hasTranscribed) {
                    const nextPoint = lastPoint === 'derecho' ? 'revés' : 'derecho';
                    const utterance = new SpeechSynthesisUtterance(`El siguiente punto es: ${nextPoint}`);
                    utterance.lang = 'es-ES';
                    window.speechSynthesis.speak(utterance);
                }
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [hasTranscribed, isListening, lastPoint, points]);

    const toggleListening = () => {
        setIsListening((prev) => !prev);
    };

    return (
        <div className="max-w-lg mx-auto bg-white shadow-lg rounded-2xl p-6 space-y-4 text-center">
            <h2 className="text-xl font-bold text-gray-800">Reconocimiento de voz para tejido</h2>
            <button 
                onClick={toggleListening} 
                className={`px-4 py-2 w-full font-semibold rounded-lg shadow-md transition ${
                    isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
            >
                {isListening ? 'Detener escucha' : 'Comenzar a escuchar'}
            </button>
            <div className="bg-gray-100 p-4 rounded-lg shadow-inner space-y-2">
                <p className="text-gray-700 font-medium">Último punto registrado: <span className="font-bold">{lastPoint}</span></p>
                <p className="text-gray-700 font-medium">Lo que dijiste: <span className="italic">{transcription}</span></p>
                <p className="text-gray-700 font-medium">Secuencia de puntos: <span className="font-mono">{points.join(', ')}</span></p>
            </div>
        </div>
    );
}

export default VoiceRecognition;
