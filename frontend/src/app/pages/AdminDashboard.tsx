import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { MetricCard } from '../components/MetricCard';
import { JobsTable } from '../components/admin/JobsTable';
import { RecruitersTable } from '../components/admin/RecruitersTable';
import { CandidatesTable } from '../components/admin/CandidatesTable';
import { useData } from '../contexts/DataContext';
import { Briefcase, Users, UserCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import api from '../../lib/api';
import { RecentActivityCard } from '../components/admin/RecentActivityCard';

type TabValue = 'dashboard' | 'jobs' | 'recruiters' | 'candidates';

export function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState({
    totalJobs: 0,
    openJobs: 0,
    totalRecruiters: 0,
    activeRecruiters: 0,
    totalCandidates: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const tabParam = searchParams.get('tab') as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabParam || 'dashboard');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
 }, []);

  useEffect(() => {
    if (tabParam && ['dashboard', 'jobs', 'recruiters', 'candidates'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    const newTab = value as TabValue;
    setActiveTab(newTab);
    if (newTab === 'dashboard') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold pb-8">Admin Dashboard</h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                iconBgClass="bg-emerald-500/16 dark:bg-emerald-400/20"
                iconColorClass="text-emerald-800 dark:text-emerald-400"
                title="Total Jobs"
                value={stats.totalJobs}
                icon={Briefcase}
                description={`${stats.openJobs} open positions`}
              />
              <MetricCard
                title="Total Recruiters"
                value={stats.totalRecruiters}
                icon={Users}
                description={`${stats.activeRecruiters} active`}
                iconBgClass="bg-blue-500/15 dark:bg-blue-400/20"
  iconColorClass="text-blue-800 dark:text-blue-400"
              />
              <MetricCard
                title="Total Candidates"
                value={stats.totalCandidates}
                icon={UserCircle}
                description="All applications"
                iconBgClass="bg-pink-500/15 dark:bg-pink-400/20"
  iconColorClass="text-pink-800 dark:text-pink-400"
              />
            </div>
            <RecentActivityCard/>

            {/* Quick Overview */}
            {/* <div className="grid gap-6 lg:grid-cols-2 mt-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
                <JobsTable limit={5} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Candidates</h3>
                <CandidatesTable limit={5} />
              </div>
            </div> */}
          </TabsContent>

          <TabsContent value="jobs">
            <JobsTable />
          </TabsContent>

          <TabsContent value="recruiters">
            <RecruitersTable />
          </TabsContent>

          <TabsContent value="candidates">
            <CandidatesTable />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
