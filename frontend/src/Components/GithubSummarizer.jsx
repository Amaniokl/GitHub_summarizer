import { useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProjectSummary from './ProjectSummary';

export default function GitHubSummarizer() {
  const [repoUrl, setRepoUrl] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSummaryData(null);

    try {
      const res = await axios.post('http://localhost:5000/api/repos/clone', 
        {  repoUrl },
        {
            headers: {
              'Content-Type': 'application/json'
            }
          }
      );
      console.log(res);
      setSummaryData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze the repository. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <Input
          placeholder="Enter GitHub repo URL..."
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </form>

      {error && <p className="text-red-500">{error}</p>}
      {summaryData && <ProjectSummary data={summaryData} />}
    </div>
  );
}
