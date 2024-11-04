import React, { useState } from 'react';

const ImageUploader = ({ onUpload }) => {
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleSubmit = () => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        onUpload(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div style={{textAlign: "center"}}>
        <input type="file" onChange={handleChange} />
        <button onClick={handleSubmit}>Upload</button>
      </div>
    </div>
  );
};

export default ImageUploader;
