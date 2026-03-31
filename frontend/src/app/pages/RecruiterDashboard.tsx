import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { useData } from '../contexts/DataContext';
import { RecentActionsWidget } from '../components/recruiter/RecentActionsWidget';
import { Briefcase, UserCircle, Clock, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';


const toViewableUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/raw/upload/', '/raw/upload/fl_attachment:false/')
    : url;

type TabValue = 'dashboard' | 'jobs' | 'candidates';
const TABS: { value: TabValue; label: string }[] = [
  { value: 'dashboard', label: 'Overview' },
  { value: 'jobs', label: 'My Jobs' },
  { value: 'candidates', label: 'Candidates' },
];

export function RecruiterDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchRecruiterJobs, fetchRecruiterCandidates, updateCandidateStatusRecruiter, fetchAuditLogs } = useData();
  const tabParam = searchParams.get('tab') as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabParam || 'dashboard');
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); fetchAuditLogs(); }, []);
  useEffect(() => { if (tabParam && TABS.some(t => t.value === tabParam)) setActiveTab(tabParam); }, [tabParam]);

  const loadData = async () => {
    setLoading(true);
    const [j, c] = await Promise.all([fetchRecruiterJobs(), fetchRecruiterCandidates()]);
    setJobs(j); setCandidates(c); setLoading(false);
  };

  const handleTabChange = (v: TabValue) => {
    setActiveTab(v);
    v === 'dashboard' ? setSearchParams({}) : setSearchParams({ tab: v });
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateCandidateStatusRecruiter(id, status as any); await loadData();
  };

  const pending = candidates.filter(c => c.status === 'applied').length;
  const interviewing = candidates.filter(c => c.status === 'interview').length;
  const pipeline = ['applied','interview','offer','hired','rejected'] as const;
  const byStatus = Object.fromEntries(pipeline.map(s => [s, candidates.filter(c => c.status === s)]));

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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Recruiter Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your assigned jobs and candidate pipeline
            </p>
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
                      ? 'bg-indigo-500/10 text-indigo-400 shadow-inner'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Assigned Jobs" value={jobs.length} icon={Briefcase}
                description={`${jobs.filter(j=>j.status==='open').length} open`}
                iconBgClass="bg-indigo-100 dark:bg-indigo-900/10" iconColorClass="text-indigo-600 dark:text-indigo-400" className="animate-delay-1"/>
              <MetricCard title="Total Candidates" value={candidates.length} icon={UserCircle}
                iconBgClass="bg-violet-100 dark:bg-violet-900/10" iconColorClass="text-violet-600 dark:text-violet-400" className="animate-delay-2"/>
              <MetricCard title="Pending Review" value={pending} icon={Clock}
                iconBgClass="bg-amber-100 dark:bg-amber-900/10" iconColorClass="text-amber-600 dark:text-amber-400" className="animate-delay-3"/>
              <MetricCard title="In Interview" value={interviewing} icon={CheckCircle}
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/10" iconColorClass="text-emerald-600 dark:text-emerald-400" className="animate-delay-4"/>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RecentActionsWidget />
              </div>
              <div className="ats-card p-5">
                <h3 className="text-sm font-semibold mb-4" style={{fontFamily:'Syne,sans-serif'}}>Candidate Pipeline</h3>
                <div className="space-y-3">
                  {pipeline.map(status => (
                    <div key={status} className="flex items-center justify-between">
                      <StatusBadge status={status}/>
                      <div className="flex items-center gap-3 flex-1 mx-3">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: candidates.length > 0 ? `${(byStatus[status].length / candidates.length) * 100}%` : '0%',
                              background: status === 'hired' ? '#10b981' : status === 'rejected' ? '#ef4444' : status === 'interview' ? '#f59e0b' : status === 'offer' ? '#8b5cf6' : '#3b82f6'
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground w-5 text-right">{byStatus[status].length}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <div className="ats-card overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold" style={{fontFamily:'Syne,sans-serif'}}>My Assigned Jobs</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Jobs assigned to you by the admin</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full ats-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3.5 text-left">Job Title</th>
                    <th className="px-5 py-3.5 text-left">Department</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                    <th className="px-5 py-3.5 text-left">Applicants</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">No jobs assigned yet</td></tr>
                  ) : jobs.map((job) => (
                    <tr key={job.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold">{job.title}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{job.department}</td>
                      <td className="px-5 py-4"><StatusBadge status={job.status}/></td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {candidates.filter(c=>c.jobId===job.id).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CANDIDATES TAB */}
        {activeTab === 'candidates' && (
          <div className="ats-card overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold" style={{fontFamily:'Syne,sans-serif'}}>Candidate Management</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Review and update candidate status</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full ats-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3.5 text-left">Candidate</th>
                    <th className="px-5 py-3.5 text-left">Job Applied</th>
                    <th className="px-5 py-3.5 text-left">Applied Date</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                    <th className="px-5 py-3.5 text-left">Resume</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No candidates yet</td></tr>
                  ) : candidates.map(c => (
                    <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/10 flex items-center justify-center text-purple-700 dark:text-purple-700 text-xs font-bold flex-shrink-0">
                            {c.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{c.jobTitle}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{c.appliedDate}</td>
                      <td className="px-5 py-4">
                        <Select value={c.status} onValueChange={v => handleStatusChange(c.id, v)}>
                          <SelectTrigger className="focus:outline-none focus:ring-0 focus-visible:ring-0 w-auto h-auto border-0 bg-transparent p-0 shadow-none focus:ring-0 gap-1.5 hover:opacity-75 transition-opacity cursor-pointer">
  <SelectValue><StatusBadge status={c.status}/></SelectValue>
</SelectTrigger>
                          <SelectContent>
                            {['applied','interview','offer','hired','rejected'].map(s => (
                              <SelectItem key={s} value={s}><StatusBadge status={s}/></SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-4">
                        {c.resumeUrl ? (
                          <a
                            href={toViewableUrl(c.resumeUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/10 dark:text-indigo-600 dark:hover:bg-indigo-900/20 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            View CV
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">No resume</span>
                        )}
                      </td>
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
