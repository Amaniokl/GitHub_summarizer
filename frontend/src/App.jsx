import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GitHubSummarizer from './Components/GithubSummarizer.jsx'; // adjust the path if needed

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to /summarize */}
        <Route path="/" element={<Navigate to="/summarize" replace />} />

        {/* GitHub Summarizer Page */}
        <Route path="/summarize" element={<GitHubSummarizer />} />
      </Routes>
    </Router>
  );
}

export default App;
