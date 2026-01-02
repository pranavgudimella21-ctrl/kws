import React, { useState, useEffect } from 'react';
import './ResultsPage.css';

function ResultsPage({ sessionId, onReset }) {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      const data = await response.json();
      setSessionData(data.session);
      setAnswers(data.answers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await fetch(`/api/export-pdf/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview_results_${sessionId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const calculateAverageScore = () => {
    const scoredAnswers = answers.filter(a => a.score != null);
    if (scoredAnswers.length === 0) return 0;
    const sum = scoredAnswers.reduce((acc, a) => acc + a.score, 0);
    return (sum / scoredAnswers.length).toFixed(1);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'score-excellent';
    if (score >= 6) return 'score-good';
    if (score >= 4) return 'score-fair';
    return 'score-poor';
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="results-page">
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <p className="loading-text">Analyzing your interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-page">
        <div className="error-container">
          <div className="error-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
          </div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={onReset}>
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  const averageScore = calculateAverageScore();

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header fade-in">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>Interview Complete!</h1>
          <p>Here's your comprehensive performance analysis</p>
        </div>

        <div className="summary-section fade-in">
          <div className="summary-card card">
            <div className="score-display">
              <div className={`score-circle ${getScoreColor(averageScore)}`}>
                <div className="score-value">{averageScore}</div>
                <div className="score-max">/10</div>
              </div>
              <div className="score-info">
                <h2>Overall Performance</h2>
                <p className="score-label">{getScoreLabel(averageScore)}</p>
                <p className="score-description">
                  Based on {answers.length} question{answers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="stat-value">{answers.length}</div>
              <div className="stat-label">Questions Answered</div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="stat-value">{Math.round(sessionData.duration_seconds / 60)}</div>
              <div className="stat-label">Minutes</div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-value">
                {sessionData.interview_type === 'technical' ? 'Technical' : 'HR'}
              </div>
              <div className="stat-label">Interview Type</div>
            </div>
          </div>
        </div>

        <div className="actions-bar">
          <button
            className="btn btn-primary"
            onClick={downloadPDF}
            disabled={downloadingPDF}
          >
            {downloadingPDF ? (
              <>
                <span className="loading-spinner"></span>
                Generating PDF...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Download Full Report
              </>
            )}
          </button>
          <button className="btn btn-secondary" onClick={onReset}>
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M4 12L9 7M4 12L9 17M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Start New Interview
          </button>
        </div>

        <div className="answers-section">
          <h2 className="section-title">Detailed Question Analysis</h2>
          {answers.map((answer, index) => {
            const question = sessionData.questions.find(q => q.id === answer.question_id);
            return (
              <div key={answer.id} className="answer-card card fade-in">
                <div className="answer-header">
                  <div className="question-number">Q{index + 1}</div>
                  <h3 className="question-title">{question?.text || 'Question not found'}</h3>
                  {answer.score != null && (
                    <div className={`answer-score ${getScoreColor(answer.score)}`}>
                      {answer.score}/10
                    </div>
                  )}
                </div>

                <div className="answer-content">
                  <div className="answer-section">
                    <h4>Your Answer</h4>
                    <p className="answer-text">{answer.transcript || 'No transcript available'}</p>
                  </div>

                  {answer.feedback && answer.feedback.length > 0 && (
                    <div className="answer-section">
                      <h4>Feedback</h4>
                      <ul className="feedback-list">
                        {answer.feedback.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {answer.model_answer && (
                    <div className="answer-section model-answer">
                      <h4>
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Model Answer
                      </h4>
                      <p className="model-text">{answer.model_answer}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
