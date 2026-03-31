import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useData, Job } from '../contexts/DataContext';
import { StatusBadge } from '../components/StatusBadge';
import { Search, ArrowRight, Users } from 'lucide-react';

export function JobBrowser() {
  const { fetchCandidateJobs, applyToJob } = useData();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    setLoading(true);
    const data = await fetchCandidateJobs();
    setJobs(data);
    setLoading(false);
  };

  const handleApply = async (jobId: string) => {
    setApplyingId(jobId);
    await applyToJob(jobId);
    await loadJobs();
    setApplyingId(null);
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading jobs…
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title text-3xl">Browse Jobs</h1>
          <p className="page-subtitle">{jobs.length} open position{jobs.length !== 1 ? 's' : ''} available</p>
        </div>

        {jobs.length === 0 ? (
          <div className="ats-card p-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4"/>
            <p className="text-base font-semibold">No jobs available</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for new openings</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job: any, idx) => (
              <div key={job.id}
                className="ats-card p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold leading-tight" >
                      {job.title}
                    </h3>
                    <StatusBadge status={job.hasApplied ? 'hired' : 'open'} customLabel={job.hasApplied ? 'Applied' : 'Open'}/>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{job.department}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-md font-medium">{job.location}</span>
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-md font-medium">{job.type?.replace('_', ' ')}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3 h-3"/>
                  {job.applicants} applicant{job.applicants !== 1 ? 's' : ''}
                </div>

                <button
                  onClick={() => handleApply(job.id)}
                  disabled={job.hasApplied || applyingId === job.id}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-semibold transition-all mt-auto
                    ${job.hasApplied
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/20 active:scale-[0.98]'
                    }`}
                >
                  {applyingId === job.id ? 'Applying…' : job.hasApplied ? 'Already Applied' : <>Apply Now <ArrowRight className="w-3 h-3"/></>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
