import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageDisplay from './components/ImageDisplay';
// import './App.css';

import './AirbnbStyle.css';

const App = () => {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(null); // Countdown starts from 120 seconds
    const [api3Status, setApi3Status] = useState(null);
    const [api3StatusMessage, setApi3StatusMessage] = useState('');
    const [endpoint, setEndpoint] = useState(null);
    const [serviceStatus, setServiceStatus] = useState('');
    const [status, setStatus] = useState('');

    const startRemoteInstance = () => {
        setServiceStatus('Waiting for service to be ready...');
        fetch('http://57.181.37.242:3001/api/start_ec2/', {
          method: 'POST',
          // Add any necessary headers or body data here
        })
        .then((response) => {
          if (response.ok) {
            console.log('Remote instance started');
            setServiceStatus(''); // Clear the service status
          } else {
            console.error('Failed to start remote instance');
            setServiceStatus('Failed to start service');
          }
        })
        .catch((error) => {
            console.error('Error:', error);
            setServiceStatus('Error starting service');
        });
      };
  
    const checkApi3Status = () => {
        fetch('http://57.181.37.242:3001/api/check_ec2_status')
        .then((response) => response.json())
        .then((data) => {
            console.log(data.status);
            if (data.status === 'running') {
            setApi3Status(200);
            setEndpoint(data.ip_address);
            setApi3StatusMessage('');
            setServiceStatus(''); // Clear the service status
            setTimeout(checkApi3Status, 5000);
            } else if (data.status === 'stopping') {
                setApi3Status(503);
                setApi3StatusMessage('');
                setServiceStatus('Remote service is stopping...');
                setTimeout(checkApi3Status, 5000);
            } else {
                setApi3Status(503);
                setApi3StatusMessage('');
                setServiceStatus(''); // Set the service status to 'Service is not running'
                setTimeout(checkApi3Status, 5000); // Retry after 5 seconds if not running
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            setApi3Status(503);
            setApi3StatusMessage('');
            setServiceStatus('Error checking service status'); // Set the service status to 'Error checking service status'
            setTimeout(checkApi3Status, 5000); // Retry after 5 seconds if there's an error
        });
    };

    useEffect(() => {
        let timer;
        if (countdown > 0) {
          timer = setTimeout(() => {
            setCountdown(countdown - 1); // Decrement countdown every second
          }, 1000);
        }
    
        // Clear the timer when component unmounts or when countdown reaches 0
        return () => clearTimeout(timer);
      }, [countdown]);

    useEffect(() => {
        checkApi3Status();
    }, []);

    const fetchWithTimeout = (url, options, timeout = 150000) => {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), timeout)
          )
        ]);
      };

    const handleUpload = (base64Image) => {
        if (!endpoint) {
            console.error('Endpoint is not set');
            return;
          }

        setLoading(true);
        setCountdown(150);
        setUploadedImage(null);
        setProcessedImage(null);

        let img = new Image();
        img.src = base64Image;

        img.onload = () => {
            // Create a canvas element
            let canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
        
            // Set the larger dimension to 512 and adjust the other dimension to maintain the aspect ratio
            const pixels = 1480;
            if (img.width > img.height) {
              canvas.width = pixels;
              canvas.height = pixels * (img.height / img.width);
            } else {
              canvas.height = pixels;
              canvas.width = pixels * (img.width / img.height);
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const resizedImage = canvas.toDataURL();
            const base64WithoutPrefix = resizedImage.replace(/^data:image\/[a-z]+;base64,/, '');

            setCountdown(100);
            fetchWithTimeout('http://57.181.37.242:3001/api/face_beautify/',{
                method: 'POST',
                body: JSON.stringify({
                    ip_address: endpoint,
                    image: base64WithoutPrefix 
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 150000,
            })
            .then((response) => response.json())
            .then((data) => {
                const processedImageWithPrefix = 'data:image/png;base64,' + data.image;
                setProcessedImage(processedImageWithPrefix);
                setLoading(false);
                setCountdown(null);
                setStatus('Done');
            })
            .catch((error) => {
                console.error('Error:', error);
                setLoading(false);
            });
            setUploadedImage(base64Image);
        }
    };
    return (
      <div className="app">
        <header className="app-header">
          <h1>Face Beautifier</h1>
        </header>
        <div className="container">
            {api3Status === 200 ? (
                <>
                {!loading && <ImageUploader onUpload={handleUpload} />}
                <div className="status-message">
                  {countdown > 0 ? <p>Processing image. Please wait for {countdown} seconds</p> : 
                    (countdown === null ? <p>{status}</p> : <p>Almost done...</p>)}
                </div>
                {uploadedImage && 
                  <div className="card">
                    <img className="image-display" src={uploadedImage} alt="Uploaded" />
                  </div>
                }
                {processedImage && 
                  <div className="card">
                    <img className="image-display" src={processedImage} alt="Processed" />
                  </div>
                }
                </>
            ) : (
                <div className="service-status">
                    <div className="start-button">
                        {serviceStatus !== 'Waiting for service to be ready...' && serviceStatus !== 'Remote service is stopping...' && <button onClick={startRemoteInstance}>Start Remote Instance</button>}
                    </div>
                    <p>{serviceStatus}</p>
                    <p>{api3StatusMessage}</p>
                </div>
            )}
        </div>
        <footer className="app-footer">
            <p>© 2024 Face Beautifier</p>
        </footer>
      </div>
    );
  };

export default App;
