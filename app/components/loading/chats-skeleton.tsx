import React from 'react';

const loadingItems = Array.from({ length: 10 }, (_, i) => i);

const messages = [
  {
    type: 'me',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'chat',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'me',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'chat',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'me',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'chat',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'me',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'chat',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'chat',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'me',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'chat',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'me',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'chat',
    text: '',
    sender_id: '',
    time_stamp: '',
  },
  {
    type: 'me',
    text: '',
    sender_id: '',
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
    <div className="flex h-screen w-full flex-col lg:flex">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center">
          <div className="h-12 w-12 flex-shrink-0 animate-pulse overflow-hidden rounded-full bg-gray-300"></div>
          <div className="ml-3">
            <span className="font-medium text-gray-800">
              <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-300"></div>
            </span>
          </div>
        </div>
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300"></div>
      </div>
      <div className="max-h-1/2 flex-1 overflow-y-auto bg-white p-4">
        <div className="mx-auto flex max-w-[850px] flex-col space-y-4">
          <div className={`h-full space-y-3 overflow-y-auto pb-24`}>
            {messages.map((message) => (
              <div
                className={`flex ${message.type === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="min-w-[40%] max-w-[70%]">
                  <div
                    className={`relative h-9 animate-pulse rounded-xl py-2 pl-3 ${
                      message.type === 'me'
                        ? 'bg-[#5466ff] pr-16 text-white'
                        : 'bg-gray-300 pr-9 text-gray-800'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonChatLoading = () => {
  return (
    <div className="h-full w-full overflow-hidden lg:grid lg:grid-cols-[360px_1fr]">
      <div className="overflow-hidden lg:grid lg:grid-cols-[360px_1fr]">
        <div className="h-full w-full border-r bg-white">
          <div className="sticky top-0 border-b bg-white p-4">
            <h2 className="text-xl font-semibold">Messages</h2>
          </div>
          <div className="h-[calc(100vh-141px)] w-full overflow-auto">
            {loadingItems.map((_) => {
              return (
                <div
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
          </div>
        </div>
      </div>

      <div className="flex h-screen w-full flex-col lg:flex">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
          <div className="flex items-center">
            <div className="h-12 w-12 flex-shrink-0 animate-pulse overflow-hidden rounded-full bg-gray-300"></div>
            <div className="ml-3">
              <span className="font-medium text-gray-800">
                <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-300"></div>
              </span>
            </div>
          </div>
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300"></div>
        </div>
        <div className="max-h-1/2 flex-1 overflow-y-auto bg-white p-4">
          <div className="mx-auto flex max-w-[850px] flex-col space-y-4">
            <div className={`h-full space-y-3 overflow-y-auto pb-24`}>
              {messages.map((message) => (
                <div
                  className={`flex ${message.type === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="min-w-[40%] max-w-[70%]">
                    <div
                      className={`relative h-9 animate-pulse rounded-xl py-2 pl-3 ${
                        message.type === 'me'
                          ? 'bg-[#5466ff] pr-16 text-white'
                          : 'bg-gray-300 pr-9 text-gray-800'
                      }`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
