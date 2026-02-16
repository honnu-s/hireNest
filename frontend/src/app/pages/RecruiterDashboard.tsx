import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { MetricCard } from '../components/MetricCard';
import { useData } from '../contexts/DataContext';
import {
  Briefcase,
  UserCircle,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible';
import { RecentActionsWidget } from '../components/recruiter/RecentActionsWidget';
import { JobActivityTimeline } from '../components/recruiter/JobActivityTimeline';

type TabValue = 'dashboard' | 'jobs' | 'candidates';

export function RecruiterDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    fetchRecruiterJobs,
    fetchRecruiterCandidates,
    updateCandidateStatusRecruiter,
  } = useData();

  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchAuditLogs } = useData();

  const tabParam = searchParams.get('tab') as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabParam || 'dashboard');

  useEffect(() => {
    loadData();
    fetchAuditLogs();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [jobsData, candidatesData] = await Promise.all([
      fetchRecruiterJobs(),
      fetchRecruiterCandidates(),
    ]);
    setJobs(jobsData);
    setCandidates(candidatesData);
    setLoading(false);
  };

  useEffect(() => {
    if (tabParam && ['dashboard', 'jobs', 'candidates'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    const newTab = value as TabValue;
    setActiveTab(newTab);
    newTab === 'dashboard'
      ? setSearchParams({})
      : setSearchParams({ tab: newTab });
  };

  const pendingCandidates = candidates.filter(
    c => c.status === 'applied'
  ).length;

  const interviewCandidates = candidates.filter(
    c => c.status === 'interview'
  ).length;

  const candidatesByStatus = {
    applied: candidates.filter(c => c.status === 'applied'),
    interview: candidates.filter(c => c.status === 'interview'),
    offer: candidates.filter(c => c.status === 'offer'),
    hired: candidates.filter(c => c.status === 'hired'),
    rejected: candidates.filter(c => c.status === 'rejected'),
  };

  const enrichedJobs = jobs.map(job => {
    const jobCandidates = candidates.filter(c => c.jobId === job.id);
    return {
      ...job,
      applicants: jobCandidates.length,
      candidates: jobCandidates,
    };
  });

  const handleStatusChange = async (id: string, status: string) => {
    await updateCandidateStatusRecruiter(id, status as any);
    await loadData();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64 text-muted-foreground">
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Recruiter Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your assigned jobs and candidates
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="jobs">My Jobs</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
          </TabsList>

          {/* ================= DASHBOARD ================= */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
              iconBgClass="bg-emerald-500/16 dark:bg-emerald-400/20"
                iconColorClass="text-emerald-800 dark:text-emerald-400"
                title="Assigned Jobs"
                value={jobs.length}
                icon={Briefcase}
                description={`${jobs.filter(j => j.status === 'open').length} open`}
              />
              <MetricCard
                title="Total Candidates"
                value={candidates.length}
                icon={UserCircle}
              />
              <MetricCard
                title="Pending Review"
                value={pendingCandidates}
                icon={Clock}
                iconBgClass="bg-blue-500/15 dark:bg-blue-400/20"
  iconColorClass="text-blue-800 dark:text-blue-400"
              />
              <MetricCard
               iconBgClass="bg-pink-500/15 dark:bg-pink-400/20"
  iconColorClass="text-pink-800 dark:text-pink-400"
                title="In Interview"
                value={interviewCandidates}
                icon={CheckCircle}
              />
            </div>

            <RecentActionsWidget />

            {/* Candidate Pipeline */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Candidate Pipeline
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {(Object.keys(candidatesByStatus) as Array<
                  keyof typeof candidatesByStatus
                >).map(status => (
                  <Card key={status}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium capitalize">
                        {status}
                      </CardTitle>
                      <CardDescription className="text-2xl font-semibold">
                        {candidatesByStatus[status].length}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {candidatesByStatus[status].slice(0, 3).map(c => (
                        <div
                          key={c.id}
                          className="text-sm p-2 bg-muted/50 rounded"
                        >
                          <p className="font-medium truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.jobTitle}
                          </p>
                        </div>
                      ))}
                      {candidatesByStatus[status].length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No candidates
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ================= JOBS ================= */}
         <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>My Assigned Jobs</CardTitle>
                <CardDescription>Jobs assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applicants</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
  {enrichedJobs.map(job => (
    <TableRow key={job.id}>
      <TableCell>{job.title}</TableCell>
      <TableCell>{job.department}</TableCell>
      <TableCell>
        <Badge className='p-1'>{job.status}</Badge>
      </TableCell>
      <TableCell>{job.applicants}</TableCell>
    </TableRow>
  ))}
</TableBody>

                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= CANDIDATES ================= */}
          <TabsContent value="candidates">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Job Applied</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map(candidate => (
                      <TableRow key={candidate.id}>
                        <TableCell>{candidate.name}</TableCell>
                        <TableCell>{candidate.email}</TableCell>
                        <TableCell>{candidate.phone}</TableCell>
                        <TableCell>{candidate.jobTitle}</TableCell>
                        <TableCell>{candidate.appliedDate}</TableCell>
                        <TableCell>
                          <Select
                            value={candidate.status}
                            onValueChange={value =>
                              handleStatusChange(candidate.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applied">
                                Applied
                              </SelectItem>
                              <SelectItem value="interview">
                                Interview
                              </SelectItem>
                              <SelectItem value="offer">
                                Offer
                              </SelectItem>
                              <SelectItem value="hired">
                                Hired
                              </SelectItem>
                              <SelectItem value="rejected">
                                Rejected
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
