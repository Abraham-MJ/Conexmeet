import React from 'react';

const BackgroundImage = ({ avatar }: { avatar: string }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-hidden">
      <img
        src={avatar}
        alt="avatar-img"
        className="h-full w-full object-cover opacity-100 blur-lg filter transition-opacity duration-300 ease-in-out"
      />
      <div className="absolute inset-0 bg-[#000000a3]"></div>
    </div>
  );
};

export default BackgroundImage;
