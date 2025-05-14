import React from 'react';

const FeaturesSkeleton = () => {
  const loadingItems = Array.from({ length: 4 }, (_, i) => i);

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {loadingItems.map((item) => (
        <div
          key={item}
          className="relative aspect-[3/4] md:aspect-square animate-pulse overflow-hidden rounded-xl bg-gray-100"
        >
          <div className="absolute left-2 top-2 h-10 w-10 rounded-full bg-gray-200"></div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-200 to-transparent p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-300"></div>
              <div className="space-y-1">
                <div className="h-3 w-20 rounded bg-gray-300"></div>
                <div className="h-2 w-12 rounded bg-gray-300"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeaturesSkeleton;
