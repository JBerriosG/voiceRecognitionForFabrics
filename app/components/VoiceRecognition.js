'use client'
import { useState, useEffect } from 'react';

const VoiceRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [lastPoint, setLastPoint] = useState('');
    const [points, setPoints] = useState([]);

    useEffect(() => {
        const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const mic = new speechRecognition();

        mic.continuous = true;
        mic.lang = 'es-ES';
        mic.interimResults = false;
        mic.maxAlternatives = 1;

        mic.onstart = () => {
            setIsListening(true);
        };

        mic.onend = () => {
            setIsListening(false);
        };

        mic.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const point = lastResult[0].transcript.toLowerCase();

            if (point.includes('derecho') || point.includes('revés')) {
                setTranscription(point);
                setPoints((prevPoints) => {
                    const updatedPoints = [...prevPoints, point];
                    setLastPoint(updatedPoints[updatedPoints.length - 1]);
                    return updatedPoints;
                });
            };

            if (isListening) {
                mic.start();
            } else {
                mic.stop();
            }

            return () => {
                mic.stop();
            };

        }

    }, [isListening]);

    const toggleListening = () => {
        setIsListening(!isListening);
    };

    useEffect(() => {
        if (!isListening && points > 0) {
            const timer = setTimeout(() => {
                if (!transcription) {
                    const nextPoint = lastPoint === 'derecho' ? 'revés' : 'derecho';
                    const utterance = new SpeechSynthesisUtterance(`El siguiente punto es: ${nextPoint}`);
                    utterance.lang = 'es-ES';
                    window.speechSynthesis.speak(utterance);
                }
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [transcription, isListening, lastPoint, points]);

    return (
        <div className="max-w-lg mx-auto bg-white shadow-lg rounded-2xl p-6 space-y-4 text-center">
    <h2 className="text-xl font-bold text-gray-800">Reconocimiento de voz para tejido</h2>
    <button 
        onClick={toggleListening} 
        className="px-4 py-2 w-full bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
    >
        {isListening ? 'Detener escucha' : 'Comenzar a escuchar'}
    </button>
    <div className="bg-gray-100 p-4 rounded-lg shadow-inner space-y-2">
        <p className="text-gray-700 font-medium">Último punto registrado: <span className="font-bold">{lastPoint}</span></p>
        <p className="text-gray-700 font-medium">Lo que dijiste: <span className="italic">{transcription}</span></p>
        <p className="text-gray-700 font-medium">Secuencia de puntos: <span className="font-mono">{points.join(', ')}</span></p>
    </div>
</div>);
}

export default VoiceRecognition;