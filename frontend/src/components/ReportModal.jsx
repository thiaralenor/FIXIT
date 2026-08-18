import React, { useState, useRef } from 'react';
import { useCivic } from '../context/CivicContext';
import CameraCaptureModal from './CameraCaptureModal';
import { 
  ArrowLeft, 
  UploadCloud, 
  Camera, 
  X, 
  Plus, 
  MapPin, 
  ShieldCheck, 
  Send, 
  Video,
  Navigation,
  Edit3
} from 'lucide-react';

export default function ReportModal() {
  const { isReportModalOpen, setIsReportModalOpen, addReport } = useCivic();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [locationType, setLocationType] = useState('current'); // 'current' or 'manual'
  const [locationText, setLocationText] = useState('Molyko, Buea');
  const [landmarkDetails, setLandmarkDetails] = useState('');
  const [mediaList, setMediaList] = useState([]); // [{ type: 'image'|'video', url }]
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isReportModalOpen) return null;

  // Handle File Selection (Photo / Video)
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      const isVid = file.type.startsWith('video');
      reader.onload = (event) => {
        setMediaList(prev => [...prev, {
          type: isVid ? 'video' : 'image',
          url: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = (captured) => {
    setMediaList(prev => [...prev, captured]);
  };

  const removeMedia = (index) => {
    setMediaList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !category) {
      alert('Please fill in the problem description and select a category.');
      return;
    }

    setSubmitting(true);
    
    // Auto title if left empty
    const reportTitle = title.trim() || `${category} report at ${locationText}`;

    await addReport({
      title: reportTitle,
      description,
      category,
      location: locationText,
      locationType,
      landmarkDetails,
      media: mediaList,
      latitude: locationType === 'current' ? 4.156 : 4.162,
      longitude: locationType === 'current' ? 9.241 : 9.278
    });

    setSubmitting(false);
  };

  return (
    <>
      <div className="report-modal-overlay">
        <div className="report-modal-content">
          {/* Header */}
          <div className="report-modal-header">
            <button 
              className="back-btn"
              onClick={() => setIsReportModalOpen(false)}
            >
              <ArrowLeft size={18} />
              <span>Upload / Report a Problem</span>
            </button>
          </div>

          <div className="report-modal-body">
            {/* Title section */}
            <div className="report-title-section">
              <h2>Report a Problem</h2>
              <p>Help us understand the issue by filling in the details below.</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* 1. Photos & Videos (optional) */}
              <div className="form-section">
                <label className="section-label">
                  1. Photos & Videos <span className="optional-tag">(optional)</span>
                </label>
                <p className="section-help-text">Add photos or videos to help us understand the problem better.</p>

                <div className="media-uploader-grid">
                  {/* Upload Dropzone Box */}
                  <div 
                    className="upload-dropzone-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud size={32} className="upload-icon" />
                    <p className="upload-main-text">Click to upload or drag and drop</p>
                    <p className="upload-sub-text">JPG, PNG, MP4, WEBM up to 20MB</p>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*,video/*" 
                    multiple 
                    style={{ display: 'none' }} 
                  />

                  {/* Camera Snap Direct Trigger */}
                  <button 
                    type="button" 
                    className="camera-trigger-box"
                    onClick={() => setIsCameraOpen(true)}
                  >
                    <Camera size={26} />
                    <span>Take Photo / Video</span>
                  </button>

                  {/* Uploaded Media Thumbnails */}
                  {mediaList.map((m, idx) => (
                    <div key={idx} className="media-preview-item">
                      {m.type === 'video' ? (
                        <div className="preview-video-thumb">
                          <video src={m.url} />
                          <Video size={20} className="preview-vid-badge" />
                        </div>
                      ) : (
                        <img src={m.url} alt={`Upload ${idx}`} />
                      )}
                      <button 
                        type="button" 
                        className="remove-media-btn"
                        onClick={() => removeMedia(idx)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Add More '+' box */}
                  <div 
                    className="add-more-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus size={24} />
                  </div>
                </div>
              </div>

              {/* 2. Describe the problem* */}
              <div className="form-section">
                <label className="section-label">
                  2. Describe the problem<span className="required-star">*</span>
                </label>
                
                {/* Title (Optional) */}
                <input 
                  type="text"
                  className="form-input-text"
                  placeholder="Short Title (e.g., Large pothole on Molyko road)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ marginBottom: '10px' }}
                />

                <div className="textarea-wrapper">
                  <textarea 
                    rows={4}
                    maxLength={500}
                    placeholder="Provide a clear description of the problem..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                  <div className="char-counter">{description.length}/500</div>
                </div>
              </div>

              {/* 3. Category* */}
              <div className="form-section">
                <label className="section-label">
                  3. Category<span className="required-star">*</span>
                </label>
                <div className="form-select-wrapper">
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Roads & Potholes">Roads & Potholes</option>
                    <option value="Water & Sanitation">Water & Sanitation</option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Street Lighting">Street Lighting</option>
                    <option value="Public Infrastructure">Public Infrastructure</option>
                    <option value="Traffic & Safety">Traffic & Safety</option>
                  </select>
                </div>
              </div>

              {/* 4. Location* */}
              <div className="form-section">
                <label className="section-label">
                  4. Location<span className="required-star">*</span>
                </label>
                <p className="section-help-text">Add the location of the problem.</p>

                {/* Location Selection Radios */}
                <div className="location-option-grid">
                  <div 
                    className={`location-option-card ${locationType === 'current' ? 'selected' : ''}`}
                    onClick={() => {
                      setLocationType('current');
                      setLocationText('Molyko, Buea (Auto-detected)');
                    }}
                  >
                    <div className="option-radio">
                      <div className="radio-inner" />
                    </div>
                    <div className="option-content">
                      <div className="option-title-row">
                        <Navigation size={16} className="loc-icon" />
                        <span className="option-title">Use my current location</span>
                      </div>
                      <p className="option-sub">Detect location automatically</p>
                    </div>
                  </div>

                  <div 
                    className={`location-option-card ${locationType === 'manual' ? 'selected' : ''}`}
                    onClick={() => setLocationType('manual')}
                  >
                    <div className="option-radio">
                      <div className="radio-inner" />
                    </div>
                    <div className="option-content">
                      <div className="option-title-row">
                        <Edit3 size={16} className="loc-icon" />
                        <span className="option-title">Enter location manually</span>
                      </div>
                      <p className="option-sub">Type the location description</p>
                    </div>
                  </div>
                </div>

                {/* Landmark input */}
                <div className="landmark-input-wrapper">
                  <input 
                    type="text"
                    placeholder="Add more details about the location (optional) e.g. Near Molyko market, beside the blue building"
                    value={landmarkDetails}
                    onChange={(e) => setLandmarkDetails(e.target.value)}
                  />
                </div>

                {/* Map Preview Box */}
                <div className="map-preview-box">
                  <div className="map-mock-canvas">
                    <div className="map-grid-pattern" />
                    <div className="map-landmark market">Molyko Market</div>
                    <div className="map-landmark uni">University of Buea</div>
                    <div className="map-pin-marker">
                      <MapPin size={32} fill="#ef4444" color="#ffffff" />
                      <div className="pin-pulse" />
                    </div>
                    <div className="map-control-btn" title="Center map">
                      <Navigation size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Privacy Note Banner */}
              <div className="privacy-note-banner">
                <ShieldCheck size={20} className="privacy-icon" />
                <div className="privacy-text">
                  <strong>Privacy Note</strong>
                  <p>Your information is safe with us. We only use it to address the reported problem.</p>
                </div>
              </div>

              {/* 6. Form Action Buttons */}
              <div className="form-action-buttons">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsReportModalOpen(false)}
                >
                  Cancel
                </button>

                <button 
                  type="submit" 
                  className="submit-report-btn"
                  disabled={submitting}
                >
                  <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Camera Stream Capture Popup */}
      <CameraCaptureModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
}
