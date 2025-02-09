import { CheckCircle, XCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import React from 'react';

export const AlertDanger = ({
  onPress,
  titleError,
  bodyError,
  footerText,
}: {
  onPress: () => void;
  titleError: string;
  bodyError: string;
  footerText: string;
}) => (
  <div className="text-center">
    <XCircle className="mx-auto h-16 w-16 animate-bounce text-red-500" />
    <h2 className="mt-4 font-latosans text-2xl font-bold text-red-500">
      {titleError}
    </h2>
    <p className="mt-2 font-latosans text-gray-600">{bodyError}</p>
    <button
      onClick={onPress}
      className="mt-6 inline-block rounded-md border border-transparent bg-red-600 px-6 py-3 text-base font-medium text-white transition duration-150 ease-in-out hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <span className="font-latosans">{footerText}</span>
    </button>
  </div>
);

export const AlertSuccess = ({
  onPress,
  title,
  body,
  footerText,
}: {
  onPress: () => void;
  title: string;
  body: string;
  footerText: string;
}) => (
  <div className="text-center">
    <CheckCircle className="mx-auto h-20 w-20 animate-bounce text-green-500" />
    <h2 className="mt-4 font-latosans text-2xl font-bold text-green-600">
      {title}
    </h2>
    <p className="mt-2 font-latosans text-gray-600">{body}</p>
    <button
      onClick={onPress}
      className="mt-6 inline-block rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white transition duration-150 ease-in-out hover:bg-green-700"
    >
      <span className="font-latosans">{footerText}</span>
    </button>
  </div>
);
