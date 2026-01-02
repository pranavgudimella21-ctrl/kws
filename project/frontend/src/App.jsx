import React, { useState } from 'react';
import SetupPage from './components/SetupPage';
import InterviewPage from './components/InterviewPage';
import ResultsPage from './components/ResultsPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('setup');
  const [sessionData, setSessionData] = useState(null);

  const startInterview = (data) => {
    setSessionData(data);
    setCurrentPage('interview');
  };

  const finishInterview = () => {
    setCurrentPage('results');
  };

  const resetInterview = () => {
    setSessionData(null);
    setCurrentPage('setup');
  };

  return (
    <div className="app">
      {currentPage === 'setup' && (
        <SetupPage onStart={startInterview} />
      )}
      {currentPage === 'interview' && sessionData && (
        <InterviewPage
          sessionData={sessionData}
          onFinish={finishInterview}
        />
      )}
      {currentPage === 'results' && sessionData && (
        <ResultsPage
          sessionId={sessionData.session_id}
          onReset={resetInterview}
        />
      )}
    </div>
  );
}

export default App;
