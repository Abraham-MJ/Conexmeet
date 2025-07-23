import { cn } from '@/lib/utils';
import React from 'react';

const loadingItems = Array.from({ length: 9 }, (_, i) => i);

const messages = [
  {
    type: 'me',
    text: '',
    sender_id: 1,
    time_stamp: '',
  },
  {
    type: 'date-separator',
    text: '',
    sender_id: 2,
    time_stamp: '',
  },
  {
    type: 'me',
    text: '',
    sender_id: 3,
    time_stamp: '',
  },
  {
    type: 'date-separator',
    text: '',
    sender_id: 4,
    time_stamp: '',
  },
  {
    type: 'chat',
    text: '',
    sender_id: 5,
    time_stamp: '',
  },
];

export const SkeletonLoadingMessagesList = () => {
  return (
    <>
      {loadingItems?.map((key) => {
        return (
          <div
            key={key}
            className={`flex cursor-pointer select-none items-center border-b px-4 py-3 hover:bg-gray-50`}
          >
            <div className="h-12 w-12 flex-shrink-0 animate-pulse overflow-hidden rounded-full bg-gray-300"></div>
            <div className="ml-3 flex-grow">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-300"></div>
                </div>
                <div className="flex flex-col-reverse items-center gap-1">
                  <span className="ml-1 text-xs text-gray-400">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300"></div>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export const SkeletonLoadingMessages = () => {
  return (
    <div className={`h-full space-y-2 overflow-hidden px-4`}>
      {messages.map((item) => {
        const isMyMessage = item.type === 'me';

        if (item.type === 'date-separator') {
          return (
            <div
              className="my-4 flex items-center justify-center"
              key={item.sender_id}
            >
              <div className="rounded-full px-3 py-1 text-xs font-semibold">
                <div className="h-8 w-24 flex-shrink-0 animate-pulse rounded-2xl bg-gray-200"></div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.sender_id}
            className={cn(
              'group flex items-center gap-2',
              isMyMessage ? 'justify-end' : 'justify-start',
            )}
          >
            <div className={cn('max-w-xs rounded-xl p-3 md:max-w-md')}>
              <div className={cn('break-words text-sm')}>
                <div className="h-12 w-full flex-shrink-0 animate-pulse overflow-hidden rounded-2xl bg-gray-300"></div>
              </div>
              <div className="mt-1 flex items-center justify-end gap-1">
                <span className="text-xs opacity-70">
                  <div className="h-24 w-52 flex-shrink-0 animate-pulse overflow-hidden rounded-2xl bg-gray-300"></div>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const SkeletonChatLoading = () => {
  return (
    <>
      {loadingItems.map((_) => {
        return (
          <div className="flex items-center border-b p-3" key={_}>
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
              <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gray-50/50 to-transparent" />
            </div>
            <div className="ml-4 flex-1 space-y-2">
              <div className="relative h-4 w-3/4 overflow-hidden rounded-md bg-gray-200">
                <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gray-50/50 to-transparent" />
              </div>
              <div className="relative h-3 w-5/12 overflow-hidden rounded-md bg-gray-200">
                <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gray-50/50 to-transparent" />
              </div>
            </div>
            <div className="ml-2 flex flex-col items-end space-y-2">
              <div className="relative h-3 w-12 overflow-hidden rounded-md bg-gray-200">
                <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gray-50/50 to-transparent" />
              </div>
              <div className="relative h-5 w-5 overflow-hidden rounded-full bg-gray-200">
                <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gray-50/50 to-transparent" />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
