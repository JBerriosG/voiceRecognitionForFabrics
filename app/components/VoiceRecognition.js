'use client'
import { useState, useEffect, useRef } from 'react';

const VoiceRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [lastWord, setLastWord] = useState('');
    const micRef = useRef(null);

    useEffect(() => {
        if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        micRef.current = new SpeechRecognition();

        micRef.current.continuous = true; // Mantiene la escucha activa
        micRef.current.lang = 'es-ES';
        micRef.current.interimResults = false;
        micRef.current.maxAlternatives = 1;

        micRef.current.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const word = lastResult[0].transcript.toLowerCase().trim();

            if (word === 'derecho' || word === 'revés') {
                setLastWord(word);
            }
        };

        micRef.current.onend = () => {
            if (isListening) {
                micRef.current.start(); // 🔄 Reactiva la escucha automáticamente
            }
        };

        return () => micRef.current.abort(); // Detener al desmontar el componente
    }, []);

    useEffect(() => {
        if (isListening) {
            micRef.current.start();
        } else {
            micRef.current.abort(); // Detiene completamente la sesión
        }
    }, [isListening]);

    const toggleListening = () => {
        setIsListening((prev) => !prev);
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
