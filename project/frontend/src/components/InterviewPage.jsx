import React, { useState, useEffect, useRef } from 'react';
import './InterviewPage.css';

function InterviewPage({ sessionData, onFinish }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isReading, setIsReading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const speechSynthRef = useRef(null);

  const currentQuestion = sessionData.questions[currentQuestionIndex];
  const totalQuestions = sessionData.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  useEffect(() => {
    startCamera();
    readQuestionAloud();

    return () => {
      stopCamera();
      stopSpeech();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const readQuestionAloud = () => {
    setIsReading(true);
    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(currentQuestion.text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsReading(false);
      startRecordingTimer();
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
  };

  const startRecordingTimer = () => {
    const questionTime = currentQuestion.estimated_seconds || 90;
    setTimeLeft(questionTime);
    startRecording();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await uploadAnswer(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordedChunks(chunks);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const uploadAnswer = async (audioBlob) => {
    setUploadStatus('uploading');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.webm');

      const response = await fetch(
        `/api/upload-answer/${sessionData.session_id}/${currentQuestion.id}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadStatus('success');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    }
  };

  const handleNextQuestion = () => {
    stopRecording();
    stopSpeech();

    if (isLastQuestion) {
      handleFinishInterview();
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setUploadStatus('');
      }, 1000);
    }
  };

  const handleFinishInterview = async () => {
    stopRecording();
    stopCamera();
    stopSpeech();

    try {
      const response = await fetch(`/api/analyze/${sessionData.session_id}`, {
        method: 'POST',
      });

      if (response.ok) {
        onFinish();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      onFinish();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="interview-page">
      <div className="interview-header">
        <div className="header-content">
          <div className="progress-info">
            <span className="question-counter">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
          <button
            className="btn btn-error finish-btn"
            onClick={handleFinishInterview}
          >
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <rect x="6" y="6" width="12" height="12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Finish Interview
          </button>
        </div>
      </div>

      <div className="interview-container">
        <div className="interview-content">
          <div className="video-section">
            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="video-feed"
              />
              {isReading && (
                <div className="reading-overlay">
                  <div className="avatar-container pulse">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" fill="currentColor"/>
                      <path d="M6 21V19C6 17.3431 7.34315 16 9 16H15C16.6569 16 18 17.3431 18 19V21" fill="currentColor"/>
                    </svg>
                  </div>
                  <p className="reading-text">Listening to question...</p>
                  <div className="audio-wave">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              {isRecording && (
                <div className="recording-indicator">
                  <div className="rec-dot pulse"></div>
                  <span>Recording</span>
                </div>
              )}
            </div>

            <div className="timer-display">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className={timeLeft <= 10 ? 'time-warning' : ''}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="question-section">
            <div className="question-card card">
              <div className="question-header">
                <div className="question-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="8" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <h2>Current Question</h2>
              </div>
              <p className="question-text">{currentQuestion.text}</p>

              {uploadStatus && (
                <div className={`upload-status status-${uploadStatus}`}>
                  {uploadStatus === 'uploading' && (
                    <>
                      <span className="loading-spinner"></span>
                      Saving answer...
                    </>
                  )}
                  {uploadStatus === 'success' && (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Answer saved
                    </>
                  )}
                  {uploadStatus === 'error' && (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Upload failed
                    </>
                  )}
                </div>
              )}

              <div className="action-buttons">
                <button
                  className="btn btn-primary next-btn"
                  onClick={handleNextQuestion}
                  disabled={isReading}
                >
                  {isLastQuestion ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Complete Interview
                    </>
                  ) : (
                    <>
                      Next Question
                      <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="tips-card">
              <h3>Tips for a Great Answer</h3>
              <ul>
                <li>Speak clearly and at a moderate pace</li>
                <li>Use specific examples from your experience</li>
                <li>Structure your response with clear points</li>
                <li>Stay focused on the question asked</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewPage;
