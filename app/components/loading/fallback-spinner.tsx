import React from 'react';

const FallBackSpinner = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="relative">
        <div className="h-24 w-24 animate-spin rounded-full border-4 border-b-transparent border-l-transparent border-r-[#ff00ff] border-t-[#ff00ff]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/images/logo.png" alt="Conexmeet" className="h-auto w-16" />
        </div>
      </div>
    </div>
  );
};

export default FallBackSpinner;
