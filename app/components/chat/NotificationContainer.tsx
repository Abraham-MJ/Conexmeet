'use client';

import { useChat } from '@/app/context/useChatContext';
import ChatNotificationComponent from './ChatNotification';

export default function NotificationContainer() {
  const { state, removeNotification } = useChat();

  if (state.notifications.length === 0) {
    return null;
  }

  return (
    <>
      <div className="sm:hidden fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
        <div className="flex flex-col space-y-2 p-4 pt-safe-top">
          {state.notifications.slice(-2).map((notification, index) => (
            <div
              key={notification.id}
              className="pointer-events-auto"
              style={{
                zIndex: 9999 - index,
              }}
            >
              <ChatNotificationComponent
                notification={notification}
                onRemove={removeNotification}
                autoRemoveDelay={4000}
              />
            </div>
          ))}
        </div>

        {state.notifications.length > 2 && (
          <div className="absolute top-4 right-4 z-[9998] pointer-events-none">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
              +{state.notifications.length - 2}
            </div>
          </div>
        )}
      </div>

      <div className="hidden sm:block fixed top-0 right-0 z-[9999] pointer-events-none">
        <div className="flex flex-col space-y-3 p-6">
          {state.notifications.slice(-3).map((notification, index) => (
            <div
              key={notification.id}
              className="pointer-events-auto"
              style={{
                zIndex: 9999 - index,
              }}
            >
              <ChatNotificationComponent
                notification={notification}
                onRemove={removeNotification}
                autoRemoveDelay={4000}
              />
            </div>
          ))}
        </div>

        {state.notifications.length > 3 && (
          <div className="absolute top-6 right-6 z-[9998] pointer-events-none">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
              +{state.notifications.length - 3} más
            </div>
          </div>
        )}
      </div>
    </>
  );
}