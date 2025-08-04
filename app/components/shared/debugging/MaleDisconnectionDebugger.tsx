'use client';

import React, { useState, useEffect } from 'react';
import { useAgoraContext } from '@/app/context/useAgoraContext';

const MaleDisconnectionDebugger: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [heartbeatData, setHeartbeatData] = useState<any>(null);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const { state } = useAgoraContext();

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [...prev.slice(-10), `${timestamp}: ${message}`]);
    };

    // Verificar heartbeats cada 5 segundos
    useEffect(() => {
        if (!isVisible) return;

        const checkHeartbeats = async () => {
            try {
                const response = await fetch('/api/agora/channels/heartbeat');
                const data = await response.json();
                setHeartbeatData(data);

                // Log de heartbeats activos
                if (data.heartbeats) {
                    const maleHeartbeats = data.heartbeats.filter((hb: any) => hb.role === 'male');
                    const femaleHeartbeats = data.heartbeats.filter((hb: any) => hb.role === 'female');

                    addLog(`Heartbeats: ${femaleHeartbeats.length} females, ${maleHeartbeats.length} males`);

                    // Verificar females in_call sin male heartbeat
                    const femalesInCall = state.onlineFemalesList.filter(f => f.status === 'in_call');
                    femalesInCall.forEach(female => {
                        const hasMaleHeartbeat = maleHeartbeats.some((hb: any) => hb.channel_name === female.host_id);
                        if (!hasMaleHeartbeat) {
                            addLog(`⚠️ Female ${female.user_name} in_call sin male heartbeat en ${female.host_id}`);
                        }
                    });
                }
            } catch (error) {
                addLog(`❌ Error checking heartbeats: ${error}`);
            }
        };

        checkHeartbeats();
        const interval = setInterval(checkHeartbeats, 20000); // Cada 20 segundos

        return () => clearInterval(interval);
    }, [isVisible, state.onlineFemalesList]);

    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-16 right-4 z-50 bg-red-500 text-white px-3 py-2 rounded text-xs"
            >
                🐛 Male Debug
            </button>
        );
    }

    const femalesInCall = state.onlineFemalesList.filter(f => f.status === 'in_call');
    const maleHeartbeats = heartbeatData?.heartbeats?.filter((hb: any) => hb.role === 'male') || [];

    return (
        <div className="fixed bottom-16 right-4 z-50 w-96 bg-white border rounded-lg shadow-lg p-4 text-xs max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">🐛 Male Disconnection Debug</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>

            {/* Females in Call */}
            <div className="mb-3 p-2 bg-pink-50 rounded">
                <div className="font-semibold">👩 Females in_call ({femalesInCall.length}):</div>
                {femalesInCall.map((female, index) => (
                    <div key={index} className="ml-2 text-xs">
                        {female.user_name} → {female.host_id}
                    </div>
                ))}
            </div>

            {/* Male Heartbeats */}
            <div className="mb-3 p-2 bg-blue-50 rounded">
                <div className="font-semibold">👨 Male Heartbeats ({maleHeartbeats.length}):</div>
                {maleHeartbeats.map((hb: any, index: number) => (
                    <div key={index} className="ml-2 text-xs">
                        {hb.user_id} → {hb.channel_name} ({hb.secondsSinceLastSeen}s ago)
                    </div>
                ))}
            </div>

            {/* Problem Detection */}
            <div className="mb-3 p-2 bg-yellow-50 rounded">
                <div className="font-semibold">⚠️ Problemas Detectados:</div>
                {femalesInCall.map((female, index) => {
                    const hasMaleHeartbeat = maleHeartbeats.some((hb: any) => hb.channel_name === female.host_id);
                    if (!hasMaleHeartbeat) {
                        return (
                            <div key={index} className="ml-2 text-xs text-red-600">
                                {female.user_name} sin male en {female.host_id}
                            </div>
                        );
                    }
                    return null;
                })}
            </div>

            {/* Debug Logs */}
            <div className="mb-3 p-2 bg-gray-50 rounded">
                <div className="font-semibold">📝 Debug Logs:</div>
                <div className="max-h-32 overflow-y-auto">
                    {debugLogs.map((log, index) => (
                        <div key={index} className="text-xs">
                            {log}
                        </div>
                    ))}
                </div>
            </div>

            {/* Manual Test Button */}
            <button
                onClick={() => {
                    addLog('🧪 Forzando verificación de zombie detector...');
                    // Trigger manual check
                    window.dispatchEvent(new CustomEvent('forceZombieCheck'));
                }}
                className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs"
            >
                🧪 Force Check
            </button>
        </div>
    );
};

export default MaleDisconnectionDebugger;