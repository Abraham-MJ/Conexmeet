import React, { useState, useEffect } from 'react';

interface AvatarImageProps {
  primarySrc?: string | null;
  defaultPlaceholderSrc: string;
  errorPlaceholderSrc: string;
  alt: string;
  className?: string;
}

const AvatarImage: React.FC<AvatarImageProps> = ({
  primarySrc,
  defaultPlaceholderSrc,
  errorPlaceholderSrc,
  alt,
  className,
}) => {
  const [currentImgSrc, setCurrentImgSrc] = useState(
    primarySrc ?? defaultPlaceholderSrc,
  );
  const [hasErrored, setHasErrored] = useState(false);

  useEffect(() => {
    if (primarySrc) {
      setCurrentImgSrc(primarySrc);
    } else {
      setCurrentImgSrc(defaultPlaceholderSrc);
    }
    setHasErrored(false);
  }, [primarySrc, defaultPlaceholderSrc]);

  const handleError = () => {
    if (!hasErrored) {
      setCurrentImgSrc(errorPlaceholderSrc);
      setHasErrored(true);
    }
  };

  return (
    <img
      src={currentImgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

export default AvatarImage;
