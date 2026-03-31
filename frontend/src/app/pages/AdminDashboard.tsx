import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { MetricCard } from '../components/MetricCard';
import { JobsTable } from '../components/admin/JobsTable';
import { RecruitersTable } from '../components/admin/RecruitersTable';
import { CandidatesTable } from '../components/admin/CandidatesTable';
import { RecentActivityCard } from '../components/admin/RecentActivityCard';
import { Briefcase, Users, UserCircle, TrendingUp } from 'lucide-react';
import api from '../../lib/api';

type TabValue = 'dashboard' | 'jobs' | 'recruiters' | 'candidates';
const TABS: { value: TabValue; label: string }[] = [
  { value: 'dashboard', label: 'Overview' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'recruiters', label: 'Recruiters' },
  { value: 'candidates', label: 'Candidates' },
];

export function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabParam || 'dashboard');
  const [stats, setStats] = useState({ totalJobs: 0, openJobs: 0, totalRecruiters: 0, activeRecruiters: 0, totalCandidates: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tabParam && TABS.some(t => t.value === tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (v: TabValue) => {
    setActiveTab(v);
    v === 'dashboard' ? setSearchParams({}) : setSearchParams({ tab: v });
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading dashboard…
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
      Admin Dashboard
    </h1>
    <p className="text-sm text-muted-foreground mt-1">
      Manage your hiring pipeline from one place
    </p>
  </div>

  {/* Tabs */}
  <div className="flex items-center gap-1 p-1.5 rounded-xl bg-background border border-border shadow-sm backdrop-blur-md">

    {TABS.map((t) => {
      const active = activeTab === t.value;

      return (
        <button
          key={t.value}
          onClick={() => handleTabChange(t.value)}
          className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${active
              ? 'bg-indigo-100 text-indigo-400 shadow-outer'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
        >
          {t.label}

        
        </button>
      );
    })}

  </div>
</div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="Total Jobs"
                value={stats.totalJobs}
                icon={Briefcase}
                description={`${stats.openJobs} open positions`}
                iconBgClass="bg-indigo-100 dark:bg-indigo-900/10"
                iconColorClass="text-indigo-600 dark:text-indigo-400"
                className="animate-delay-1"
              />
              <MetricCard
                title="Recruiters"
                value={stats.totalRecruiters}
                icon={Users}
                description={`${stats.activeRecruiters} active`}
                iconBgClass="bg-violet-100 dark:bg-violet-900/10"
                iconColorClass="text-violet-600 dark:text-violet-400"
                className="animate-delay-2"
              />
              <MetricCard
                title="Total Candidates"
                value={stats.totalCandidates}
                icon={UserCircle}
                description="All time applications"
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/10"
                iconColorClass="text-emerald-600 dark:text-emerald-400"
                className="animate-delay-3"
              />
            </div>
            <div className="animate-fade-in-up animate-delay-2">
              <RecentActivityCard />
            </div>
          </div>
        )}

        {activeTab === 'jobs' && <div className="animate-fade-in-up"><JobsTable /></div>}
        {activeTab === 'recruiters' && <div className="animate-fade-in-up"><RecruitersTable /></div>}
        {activeTab === 'candidates' && <div className="animate-fade-in-up"><CandidatesTable /></div>}
      </div>
    </Layout>
  );
}
