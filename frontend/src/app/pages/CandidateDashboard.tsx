import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { MetricCard } from '../components/MetricCard';
import { useData } from '../contexts/DataContext';
import { Briefcase, Clock, FileText, CheckCircle, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Upload } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import api from '../../lib/api';
import { toast } from 'sonner';

type TabValue = 'dashboard' | 'applications' | 'apply-jobs';

const statusInfo: Record<ApplicationStatus, {
  label: string;
  color: string;
  step: number;
}> = {
  applied: { label: 'Applied', color: 'bg-blue-500', step: 1 },
  interview: { label: 'Interview', color: 'bg-yellow-500', step: 2 },
  offer: { label: 'Offer', color: 'bg-purple-500', step: 3 },
  hired: { label: 'Hired', color: 'bg-green-500', step: 4 },
  rejected: { label: 'Rejected', color: 'bg-red-500', step: 0 },
};

type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'hired' | 'rejected';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  postedDate: string;
  applicants: number;
  hasApplied: boolean;
}

interface Application {
  id: string;
  jobTitle: string;
  department: string;
  location: string;
  appliedDate: string;
  status: ApplicationStatus;
  resumeUrl?: string;
}

export function CandidateDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { uploadResume } = useData();

  const [applications, setApplications] = useState<Application[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeApplications: 0,
    interviews: 0,
    offers: 0,
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const tabParam = searchParams.get('tab') as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabParam || 'dashboard');

  // ===============================
  // FETCH DATA
  // ===============================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [statsRes, applicationsRes, jobsRes, profileRes] = await Promise.all([
        api.get('/candidate/dashboard/stats'),
        api.get('/candidate/applications'),
        api.get('/candidate/jobs'),
        api.get('/candidate/profile'),
      ]);

      setStats(statsRes.data);
      setApplications(applicationsRes.data);
      
      const unappliedJobs = jobsRes.data.filter((job: Job) => !job.hasApplied);
      setAvailableJobs(unappliedJobs);
      
      setHasResume(!!profileRes.data.resumeUrl);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // TAB HANDLING
  // ===============================
  useEffect(() => {
    if (tabParam && ['dashboard', 'applications', 'apply-jobs'].includes(tabParam)) {
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

  const handleApplyToJob = async (jobId: string) => {
    setApplyingJobId(jobId);

    try {
      await api.post('/candidate/applications', { jobId });
      
      toast.success('Applied successfully');
      
      await loadData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to apply';
      toast.error(message);
    } finally {
      setApplyingJobId(null);
    }
  };

  // ===============================
  // RESUME HANDLING
  // ===============================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      
      setResumeFile(file);
    }
  };

  const handleUploadResume = async () => {
    if (!resumeFile) return;

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      await api.post('/candidate/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Resume uploaded successfully');
      setResumeFile(null);
      setHasResume(true);
      
      await loadData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload resume';
      toast.error(message);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'hired':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Candidate Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your job applications and manage your profile
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
              iconBgClass="bg-emerald-500/16 dark:bg-emerald-400/20"
                iconColorClass="text-emerald-800 dark:text-emerald-400"
                title="Total Applications"
                value={stats.totalApplications}
                icon={Briefcase}
                description="Jobs applied"
              />
              <MetricCard
                title="Active Applications"
                value={stats.activeApplications}
                icon={Clock}
                description="In progress"
              />
              <MetricCard
              iconBgClass="bg-blue-500/15 dark:bg-blue-400/20"
  iconColorClass="text-blue-600 dark:text-blue-400"
                title="Interviews"
                value={stats.interviews}
                icon={CheckCircle}
                description="Scheduled"
              />
              <MetricCard
              iconBgClass="bg-pink-500/15 dark:bg-pink-400/20"
  iconColorClass="text-pink-600 dark:text-pink-400"
                title="Offers"
                value={stats.offers}
                icon={FileText}
                description="Received"
              />
            </div>

            {/* Application Status Timeline */}
            <Card className='rounded-none'>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>
                  Track the progress of your job applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {applications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No applications yet. Start applying to jobs!
                  </p>
                ) : (
                  applications.map((application) => {
                    const info = statusInfo[application.status];
                    const progress =
                      info.step === 0 ? 0 : (info.step / 4) * 100;

                    return (
                      <div key={application.id} className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">
                              {application.jobTitle}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Applied on {formatDate(application.appliedDate)}
                            </p>
                          </div>
                          <Badge
                            variant={getStatusBadgeVariant(application.status)}
                          >
                            {info.label}
                          </Badge>
                        </div>

                        {application.status !== 'rejected' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Applied</span>
                              <span>Interview</span>
                              <span>Offer</span>
                              <span>Hired</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Resume Upload */}
            <Card className='rounded-none'>
              <CardHeader>
                <CardTitle>Resume Management</CardTitle>
                <CardDescription>
                  {hasResume
                    ? 'Update your resume (will be used for all applications)'
                    : 'Upload your resume to apply for jobs'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="resume" className="mt-2 inline-flex items-center gap-2 rounded-md
             bg-primary text-primary-foreground
             px-4 py-2 text-sm font-medium
             cursor-pointer
             hover:opacity-90
             focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-ring">
              <Upload className="h-4 w-4" />
                    {hasResume ? 'Change Resume' : 'Upload Resume'}

                  </Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF only, max 2MB
                  </p>
                </div>

                {resumeFile && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{resumeFile.name}</span>
                    </div>
                    <Button onClick={handleUploadResume}>
                      {hasResume ? 'Update' : 'Upload'}
                    </Button>
                  </div>
                )}

                {hasResume && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Resume uploaded and ready for applications</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= APPLY TO JOBS ================= */}
          <TabsContent value="apply-jobs">
            <Card className='rounded-none'>
              <CardHeader>
                <CardTitle>Available Jobs</CardTitle>
                <CardDescription>
                  Browse and apply to open positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableJobs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground"
                        >
                          {applications.length > 0
                            ? 'No new jobs available. You have applied to all open positions!'
                            : 'No jobs available at the moment'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      availableJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">
                            {job.title}
                          </TableCell>
                          <TableCell>{job.department}</TableCell>
                          <TableCell>{job.location}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {job.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(job.postedDate)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApplyToJob(job.id)}
                              disabled={applyingJobId === job.id}
                              className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                              {applyingJobId === job.id ? 'Applying...' : 'Apply'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= MY APPLICATIONS ================= */}
          <TabsContent value="applications">
            <Card className='rounded-none'>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>
                  View all your job applications and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          No applications found. Visit the "Apply to Jobs" tab to get started!
                        </TableCell>
                      </TableRow>
                    ) : (
                      applications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell className="font-medium">
                            {application.jobTitle}
                          </TableCell>
                          <TableCell>{application.department}</TableCell>
                          <TableCell>{application.location}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(application.appliedDate)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(
                                application.status
                              )}
                            >
                              {statusInfo[application.status].label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
