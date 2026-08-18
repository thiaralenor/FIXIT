import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, X, Check, RefreshCw, Square } from 'lucide-react';

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const [mode, setMode] = useState('photo'); // 'photo' or 'video'
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState(null); // { type, url }
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    if (isOpen && !capturedMedia) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, capturedMedia]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Could not access camera. Please allow camera permissions in your browser or select media file upload.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  // Snap Photo
  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    setCapturedMedia({ type: 'image', url: dataUrl });
  };

  // Start Video Recording
  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        stopCamera();
        setCapturedMedia({ type: 'video', url: videoUrl, blob });
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Auto stop after 10 seconds max clip
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 10000);
    } catch (err) {
      console.error('Video recording error:', err);
    }
  };

  // Stop Video Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRetake = () => {
    setCapturedMedia(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedMedia) {
      onCapture(capturedMedia);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="camera-modal">
        <div className="modal-header">
          <h3>
            {mode === 'photo' ? '📷 Take Photo' : '🎥 Record Video Clip'}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="camera-view-container">
          {cameraError ? (
            <div className="camera-error-box">
              <p>{cameraError}</p>
            </div>
          ) : capturedMedia ? (
            <div className="preview-container">
              {capturedMedia.type === 'image' ? (
                <img src={capturedMedia.url} alt="Captured preview" className="camera-preview-media" />
              ) : (
                <video src={capturedMedia.url} controls autoPlay className="camera-preview-media" />
              )}
            </div>
          ) : (
            <div className="live-stream-box">
              <video ref={videoRef} autoPlay playsInline muted className="live-video" />
              
              {/* Mode switch pills */}
              <div className="mode-switch-pills">
                <button 
                  className={`mode-pill ${mode === 'photo' ? 'active' : ''}`}
                  onClick={() => setMode('photo')}
                  disabled={isRecording}
                >
                  <Camera size={14} /> Photo
                </button>
                <button 
                  className={`mode-pill ${mode === 'video' ? 'active' : ''}`}
                  onClick={() => setMode('video')}
                  disabled={isRecording}
                >
                  <Video size={14} /> Video
                </button>
              </div>

              {isRecording && (
                <div className="recording-indicator">
                  <span className="rec-dot"></span> RECORDING (max 10s)...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="camera-controls">
          {capturedMedia ? (
            <div className="confirm-actions">
              <button className="retake-btn" onClick={handleRetake}>
                <RefreshCw size={16} /> Retake
              </button>
              <button className="use-media-btn" onClick={handleConfirm}>
                <Check size={16} /> Attach Media
              </button>
            </div>
          ) : (
            <div className="capture-trigger-box">
              {mode === 'photo' ? (
                <button className="shutter-btn photo" onClick={takePhoto} disabled={!isStreaming}>
                  <div className="shutter-inner"></div>
                </button>
              ) : isRecording ? (
                <button className="shutter-btn recording" onClick={stopRecording}>
                  <Square size={24} color="#ffffff" />
                </button>
              ) : (
                <button className="shutter-btn video" onClick={startRecording} disabled={!isStreaming}>
                  <Video size={24} color="#ffffff" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
