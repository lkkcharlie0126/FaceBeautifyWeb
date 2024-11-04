import React, { useEffect, useState } from 'react';

const ImageDisplay = ({ image }) => {
  const [dimensions, setDimensions] = useState({ width: 'auto', height: 'auto' });

  useEffect(() => {
    const img = new window.Image();
    img.onload = function () {
      // Determine whether width or height is larger
      if (this.width > this.height) {
        setDimensions({ width: 512, height: 'auto' });
      } else {
        setDimensions({ width: 'auto', height: 512 });
      }
    };
    img.src = image;
  }, [image]);

  return <img src={image} alt="Uploaded" style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }} />;
};

export default ImageDisplay;