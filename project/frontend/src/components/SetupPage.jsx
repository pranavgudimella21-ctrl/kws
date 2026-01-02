import React, { useState } from 'react';
import './SetupPage.css';

function SetupPage({ onStart }) {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState(null);
  const [duration, setDuration] = useState(5);
  const [interviewType, setInterviewType] = useState('technical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResume(file);
      setError('');
    } else {
      setError('Please upload a PDF file');
      setResume(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    if (!resume) {
      setError('Please upload your resume');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('job_description', jobDescription);
      formData.append('resume', resume);
      formData.append('duration', duration * 60);
      formData.append('interview_type', interviewType);

      const response = await fetch('/api/create-session', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      onStart(data);
    } catch (err) {
      setError(err.message || 'Failed to create interview session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="setup-header fade-in">
          <div className="logo-container">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="setup-title">AI Interview Assistant</h1>
          </div>
          <p className="setup-subtitle">Prepare for your next interview with AI-powered practice sessions</p>
        </div>

        <div className="setup-card card fade-in">
          <form onSubmit={handleSubmit} className="setup-form">
            <div className="input-group">
              <label className="input-label">Interview Type</label>
              <div className="interview-type-selector">
                <button
                  type="button"
                  className={`type-btn ${interviewType === 'technical' ? 'active' : ''}`}
                  onClick={() => setInterviewType('technical')}
                >
                  <div className="type-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M8 9L12 5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M8 15L12 19L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="type-content">
                    <div className="type-title">Technical Interview</div>
                    <div className="type-description">Coding, algorithms, system design</div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`type-btn ${interviewType === 'hr' ? 'active' : ''}`}
                  onClick={() => setInterviewType('hr')}
                >
                  <div className="type-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="type-content">
                    <div className="type-title">HR Interview</div>
                    <div className="type-description">Behavioral, soft skills, culture fit</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Job Description</label>
              <textarea
                className="textarea-field"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Upload Resume (PDF)</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  id="resume-upload"
                  className="file-input"
                />
                <label htmlFor="resume-upload" className="file-upload-label">
                  <svg className="upload-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="upload-text">
                    {resume ? resume.name : 'Choose file or drag here'}
                  </span>
                  <span className="upload-hint">PDF only, max 10MB</span>
                </label>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Interview Duration</label>
              <div className="duration-selector">
                {[5, 10, 15, 20, 30].map((min) => (
                  <button
                    key={min}
                    type="button"
                    className={`duration-btn ${duration === min ? 'active' : ''}`}
                    onClick={() => setDuration(min)}
                  >
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating Interview...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Start Interview
                </>
              )}
            </button>
          </form>
        </div>

        <div className="setup-features">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Real-time Feedback</h3>
            <p>Get instant analysis of your responses</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Detailed Reports</h3>
            <p>Download comprehensive interview analysis</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 11L12 14L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Flexible Practice</h3>
            <p>Custom duration and question types</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetupPage;
