import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { useData } from '../contexts/DataContext';
import { Briefcase, Clock, CheckCircle, Search, Upload, FileText, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

type TabValue = 'dashboard' | 'applications' | 'apply-jobs';
type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'hired' | 'rejected';

const STEPS: ApplicationStatus[] = ['applied', 'interview', 'offer', 'hired'];
const stepLabels: Record<ApplicationStatus, string> = {
  applied: 'Applied', interview: 'Interview', offer: 'Offer', hired: 'Hired', rejected: 'Rejected',
};

interface Job {
  id: string; title: string; department: string; location: string;
  type: string; postedDate: string; applicants: number; hasApplied: boolean;
}
interface Application {
  id: string; jobTitle: string; department: string; location: string;
  appliedDate: string; status: ApplicationStatus;
}

const TABS: { value: TabValue; label: string; icon: any }[] = [
  { value: 'dashboard', label: 'Overview', icon: null },
  { value: 'apply-jobs', label: 'Browse Jobs', icon: null },
  { value: 'applications', label: 'My Applications', icon: null },
];

export function CandidateDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { uploadResume } = useData();
  const tabParam = searchParams.get('tab') as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabParam || 'dashboard');

  const [applications, setApplications] = useState<Application[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ totalApplications: 0, activeApplications: 0, interviews: 0, offers: 0 });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (tabParam && TABS.some(t => t.value === tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes, jobsRes, profileRes] = await Promise.all([
        api.get('/candidate/dashboard/stats'),
        api.get('/candidate/applications'),
        api.get('/candidate/jobs'),
        api.get('/candidate/profile'),
      ]);
      setStats(statsRes.data);
      setApplications(appsRes.data);
      setAvailableJobs(jobsRes.data.filter((j: Job) => !j.hasApplied));
      setHasResume(!!profileRes.data.resumeUrl);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleTabChange = (v: TabValue) => {
    setActiveTab(v);
    v === 'dashboard' ? setSearchParams({}) : setSearchParams({ tab: v });
  };

  const handleApply = async (jobId: string) => {
    setApplyingJobId(jobId);
    try {
      await api.post('/candidate/applications', { jobId });
      toast.success('Application submitted!');
      await loadData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to apply'); }
    finally { setApplyingJobId(null); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
    if (f.size > 2 * 1024 * 1024) { toast.error('File must be under 2MB'); return; }
    setResumeFile(f);
  };

  const handleUpload = async () => {
    if (!resumeFile) return;
    setUploadingResume(true);
    try {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      await api.post('/candidate/resume/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Resume uploaded!');
      setResumeFile(null); setHasResume(true);
      await loadData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setUploadingResume(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const getProgress = (status: ApplicationStatus) => {
    if (status === 'rejected') return 0;
    return ((STEPS.indexOf(status) + 1) / STEPS.length) * 100;
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading…
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

  {/* Left Section */}
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
      Candidate Dashboard
    </h1>
    <p className="text-sm text-muted-foreground mt-1">
Track your applications and explore new opportunities    </p>
  </div>

  <div className="flex items-center gap-1 p-1.5 rounded-xl bg-background border border-border shadow-sm backdrop-blur-md">

    {TABS.map((t) => {
      const active = activeTab === t.value;

      return (
        <button
          key={t.value}
          onClick={() => handleTabChange(t.value)}
          className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${active
              ? 'bg-indigo-500/10 text-indigo-400 shadow-outer'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
        >
          {t.label}

         
        </button>
      );
    })}

  </div>
</div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Applications" value={stats.totalApplications} icon={Briefcase}
                iconBgClass="bg-indigo-100 dark:bg-indigo-900/10" iconColorClass="text-indigo-600 dark:text-indigo-400" className="animate-delay-1"/>
              <MetricCard title="Active" value={stats.activeApplications} icon={Clock}
                iconBgClass="bg-amber-100 dark:bg-amber-900/10" iconColorClass="text-amber-600 dark:text-amber-400" className="animate-delay-2"/>
              <MetricCard title="Interviews" value={stats.interviews} icon={CheckCircle}
                iconBgClass="bg-violet-100 dark:bg-violet-900/10" iconColorClass="text-violet-600 dark:text-violet-400" className="animate-delay-3"/>
              <MetricCard title="Offers" value={stats.offers} icon={CheckCircle}
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/10" iconColorClass="text-emerald-600 dark:text-emerald-400" className="animate-delay-4"/>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Application Pipeline */}
              <div className="lg:col-span-2 ats-card">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold" >Application Pipeline</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Track where each application stands</p>
                </div>
                <div className="divide-y divide-border/50">
                  {applications.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Briefcase className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3"/>
                      <p className="text-sm font-medium text-foreground">No applications yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Browse open jobs and start applying</p>
                      <button onClick={() => handleTabChange('apply-jobs')}
                        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold mx-auto hover:opacity-90 transition-all">
                        Browse Jobs <ArrowRight className="w-3 h-3"/>
                      </button>
                    </div>
                  ) : applications.slice(0, 5).map(app => {
                    const progress = getProgress(app.status);
                    return (
                      <div key={app.id} className="px-6 py-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-semibold">{app.jobTitle}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{app.department} • {formatDate(app.appliedDate)}</p>
                          </div>
                          <StatusBadge status={app.status}/>
                        </div>
                        {app.status !== 'rejected' && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              {STEPS.map(s => (
                                <span key={s} className={STEPS.indexOf(s) <= STEPS.indexOf(app.status as ApplicationStatus) ? 'text-foreground font-medium' : ''}>
                                  {stepLabels[s]}
                                </span>
                              ))}
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${progress}%` }}/>
                            </div>
                          </div>
                        )}
                        {app.status === 'rejected' && (
                          <div className="h-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <div className="h-full w-full rounded-full bg-red-400"/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resume card */}
              <div className="ats-card p-6 flex flex-col">
                <h3 className="text-sm font-semibold mb-1" >Resume</h3>
                <p className="text-xs text-muted-foreground mb-5">Upload your CV to apply for jobs</p>

                {hasResume && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/5 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium mb-4">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0"/>
                    Resume on file and ready
                  </div>
                )}

                <label htmlFor="resume-upload"
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{hasResume ? 'Replace resume' : 'Upload resume'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">PDF only • Max 2MB</p>
                  </div>
                  <input id="resume-upload" type="file" accept=".pdf" onChange={handleFileChange} className="hidden"/>
                </label>

                {resumeFile && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0"/>
                    <span className="text-xs text-foreground flex-1 truncate">{resumeFile.name}</span>
                    <button onClick={handleUpload} disabled={uploadingResume}
                      className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-60">
                      {uploadingResume ? '…' : 'Upload'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── BROWSE JOBS ── */}
        {activeTab === 'apply-jobs' && (
          <div className="animate-fade-in-up">
            {availableJobs.length === 0 ? (
              <div className="ats-card p-16 text-center">
                <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4"/>
                <p className="text-base font-semibold">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">You've applied to all available open positions</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availableJobs.map((job, idx) => (
                  <div key={job.id} className="ats-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow animate-fade-in-up group"
                    style={{ animationDelay: `${idx * 40}ms` }}>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-foreground leading-tight" >
                          {job.title}
                        </h3>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                          Open
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{job.department}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-md font-medium">{job.location}</span>
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-md font-medium">{job.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border/50 mt-auto">
                      <p className="text-xs text-muted-foreground">{job.applicants} applicant{job.applicants !== 1 ? 's' : ''}</p>
                      <button onClick={() => handleApply(job.id)} disabled={applyingJobId === job.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 shadow-sm shadow-primary/20">
                        {applyingJobId === job.id ? 'Applying…' : <>Apply Now <ArrowRight className="w-3 h-3"/></>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY APPLICATIONS ── */}
        {activeTab === 'applications' && (
          <div className="ats-card overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold" >My Applications</h2>
              <p className="text-xs text-muted-foreground mt-0.5">All your job applications and current status</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full ats-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3.5 text-left">Job Title</th>
                    <th className="px-5 py-3.5 text-left">Department</th>
                    <th className="px-5 py-3.5 text-left">Location</th>
                    <th className="px-5 py-3.5 text-left">Applied</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-16 text-center">
                      <Briefcase className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2"/>
                      <p className="text-sm text-muted-foreground">No applications yet</p>
                    </td></tr>
                  ) : applications.map((app, idx) => (
                    <tr key={app.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${idx * 30}ms` }}>
                      <td className="px-5 py-4 text-sm font-semibold">{app.jobTitle}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{app.department}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{app.location}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(app.appliedDate)}</td>
                      <td className="px-5 py-4"><StatusBadge status={app.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
