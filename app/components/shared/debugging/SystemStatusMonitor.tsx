'use client';

import React, { useState, useEffect } from 'react';
import { useAgoraContext } from '@/app/context/useAgoraContext';

const SystemStatusMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [heartbeatStatus, setHeartbeatStatus] = useState<any>(null);
  
  const {
    state,
    lastHeartbeat,
    isHeartbeatActive,
  } = useAgoraContext();

  // Verificar estado de heartbeats cada 10 segundos
  useEffect(() => {
    if (!isVisible) return;

    const checkHeartbeats = async () => {
      try {
        const response = await fetch('/api/agora/channels/heartbeat');
        const data = await response.json();
        setHeartbeatStatus(data);
      } catch (error) {
        console.error('Error checking heartbeats:', error);
      }
    };

    checkHeartbeats();
    const interval = setInterval(checkHeartbeats, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [isVisible]);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-3 py-2 rounded text-xs"
      >
        📊 Monitor
      </button>
    );
  }

  const heartbeatAge = lastHeartbeat ? Math.floor((Date.now() - lastHeartbeat) / 1000) : null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white border rounded-lg shadow-lg p-4 text-xs">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">🔍 System Status</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Usuario Local */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <div className="font-semibold">👤 Usuario Local:</div>
        <div>Role: {state.localUser?.role || 'N/A'}</div>
        <div>Status: {state.localUser?.status || 'N/A'}</div>
        <div>Channel: {state.channelName || 'N/A'}</div>
        <div>RTC Joined: {state.isRtcJoined ? '✅' : '❌'}</div>
        <div>RTM Joined: {state.isRtmChannelJoined ? '✅' : '❌'}</div>
      </div>

      {/* Heartbeat Status */}
      {(state.localUser?.role === 'female' || (state.localUser?.role === 'male' && state.isRtcJoined)) && (
        <div className="mb-3 p-2 bg-green-50 rounded">
          <div className="font-semibold">❤️ Heartbeat ({state.localUser?.role}):</div>
          <div>Active: {isHeartbeatActive ? '✅' : '❌'}</div>
          <div>Last: {heartbeatAge ? `${heartbeatAge}s ago` : 'N/A'}</div>
          <div>Backend Count: {heartbeatStatus?.active_heartbeats || 'N/A'}</div>
          {heartbeatStatus?.heartbeats && (
            <div className="mt-1 text-xs">
              <div>Details:</div>
              {heartbeatStatus.heartbeats.map((hb: any, index: number) => (
                <div key={index} className="ml-2">
                  {hb.role}: {hb.channel_name} ({hb.secondsSinceLastSeen}s ago)
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Online Females */}
      <div className="mb-3 p-2 bg-pink-50 rounded">
        <div className="font-semibold">👩 Females Online:</div>
        <div>Total: {state.onlineFemalesList.length}</div>
        <div>Available: {state.onlineFemalesList.filter(f => f.status === 'available_call').length}</div>
        <div>In Call: {state.onlineFemalesList.filter(f => f.status === 'in_call').length}</div>
        <div>Online: {state.onlineFemalesList.filter(f => f.status === 'online').length}</div>
      </div>

      {/* Remote Users */}
      <div className="mb-3 p-2 bg-blue-50 rounded">
        <div className="font-semibold">👥 Remote Users:</div>
        <div>Count: {state.remoteUsers.length}</div>
        {state.remoteUsers.map((user, index) => (
          <div key={index}>
            {user.role}: {user.hasAudio ? '🎤' : '🔇'} {user.hasVideo ? '📹' : '📷'}
          </div>
        ))}
      </div>

      {/* Timestamp */}
      <div className="text-gray-500 text-center">
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SystemStatusMonitor;