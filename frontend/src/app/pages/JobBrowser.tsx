import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useData,Job } from '../contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';


export function JobBrowser() {
  const { fetchCandidateJobs, applyToJob } = useData();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const data = await fetchCandidateJobs();
    setJobs(data);
    setLoading(false);
  };

  const handleApply = async (jobId: string) => {
    await applyToJob(jobId);
    await loadJobs(); 
  };

  if (loading) return <Layout><div>Loading jobs...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Browse Jobs</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: any) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>
                  {job.department} • {job.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Type:</span>
                    <Badge>{job.type}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Applicants:</span>
                    <span>{job.applicants}</span>
                  </div>
                  <Button
                    className="w-full mt-4"
                    disabled={job.hasApplied}
                    onClick={() => handleApply(job.id)}
                  >
                    {job.hasApplied ? 'Already Applied' : 'Apply Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}