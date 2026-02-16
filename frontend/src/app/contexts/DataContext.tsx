import { ReactNode, createContext, useContext, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: 'open' | 'closed';
  assignedRecruiters?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  postedDate: string;
  applicants: number;
}

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  department: string;
  assignedJobs: number;
  status: 'active' | 'inactive';
}

export interface Candidate {
  id: string;
  candidateId?: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: string;
  status: 'applied' | 'interview' | 'offer' | 'hired' | 'rejected';
  appliedDate: string;
  resumeUrl?: string;
}
export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export type ActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'assign'
  | 'status_change';

export interface AuditLog {
  id: string;
  entityType: 'job' | 'application' | 'recruiter' | 'candidate';
  entityId: string;
  entityName: string;

  actionType: ActionType;

  performedBy: string;
  performedByName: string;
  performedByRole: 'ADMIN' | 'RECRUITER';

  timestamp: string | Date;
  details?: string;
}

interface DataContextType {
fetchAuditLogs: (page?: number, limit?: number) => Promise<void>;
  auditLogs: AuditLog[];
  auditTotalPages: number;
auditCurrentPage: number;

  fetchJobs: (page?: number, limit?: number) => Promise<PaginatedResponse<Job>>;
  fetchRecruiters: (page?: number, limit?: number) => Promise<PaginatedResponse<Recruiter>>;

  fetchCandidates: (
    page?: number,
    limit?: number,
    status?: string
  ) => Promise<PaginatedResponse<Candidate>>;

  addJob: (job: Omit<Job, 'id' | 'applicants' | 'postedDate' | 'assignedRecruiters'>) => Promise<void>;
  updateJob: (id: string, job: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  addRecruiter: (recruiter: { name: string; email: string; password: string; department: string }) => Promise<void>;
  updateRecruiter: (id: string, recruiter: Partial<Recruiter>) => Promise<void>;
  deleteRecruiter: (id: string) => Promise<void>;
  updateCandidateStatus: (id: string, status: Candidate['status']) => Promise<void>;
  updateCandidateStatusRecruiter: (id: string, status: Candidate['status']) => Promise<void>;

  deleteCandidate: (id: string) => Promise<void>;
  assignJobToRecruiter: (jobId: string, recruiterIds: string[]) => Promise<void>;
  
  fetchRecruiterJobs: () => Promise<Job[]>;
  fetchRecruiterCandidates: () => Promise<Candidate[]>;
  
  fetchCandidateJobs: () => Promise<Job[]>;
  fetchCandidateApplications: () => Promise<any[]>;
  applyToJob: (jobId: string) => Promise<void>;
  uploadResume: (file: File) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  
  // ADMIN OPERATIONS
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
const [auditTotalPages, setAuditTotalPages] = useState(1);
const [auditCurrentPage, setAuditCurrentPage] = useState(1);

  const fetchAuditLogs = async (page = 1, limit = 5) => {
  try {
    const res = await api.get(
      `/audit-logs?page=${page}&limit=${limit}`
    );

    setAuditLogs(res.data.data);
    setAuditTotalPages(res.data.totalPages);
    setAuditCurrentPage(res.data.currentPage);
  } catch (err) {
    toast.error('Failed to load activity logs');
  }
};


  const fetchJobs = async (
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Job>> => {
  const res = await api.get(
    `/admin/jobs?page=${page}&limit=${limit}`
  );
  return res.data;
};


  const fetchRecruiters = async (
  page = 1,
  limit = 8
): Promise<PaginatedResponse<Recruiter>> => {
  const res = await api.get(
    `/admin/recruiters?page=${page}&limit=${limit}`
  );
  return res.data;
};


const fetchCandidates = async (
  page = 1,
  limit = 8,
  status: string = "all"
): Promise<PaginatedResponse<Candidate>> => {

  let url = `/admin/candidates?page=${page}&limit=${limit}`;

  if (status && status !== "all") {
    url += `&status=${status}`;
  }

  const res = await api.get(url);
  return res.data;
};



  const addJob = async (job: Omit<Job, 'id' | 'applicants' | 'postedDate' | 'assignedRecruiters'>) => {
    try {
      await api.post('/admin/jobs', job);
      toast.success('Job created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create job');
      throw err;
    }
  };

  const updateJob = async (id: string, updates: Partial<Job>) => {
    try {
      await api.put(`/admin/jobs/${id}`, updates);
      toast.success('Job updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update job');
      throw err;
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await api.delete(`/admin/jobs/${id}`);
      toast.success('Job deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
      throw err;
    }
  };

  const addRecruiter = async (recruiter: { name: string; email: string; password: string; department: string }) => {
    try {
      await api.post('/admin/recruiters', recruiter);
      toast.success('Recruiter created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create recruiter');
      throw err;
    }
  };

  const updateRecruiter = async (id: string, updates: Partial<Recruiter>) => {
    try {
      await api.put(`/admin/recruiters/${id}`, updates);
      toast.success('Recruiter updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update recruiter');
      throw err;
    }
  };

  const deleteRecruiter = async (id: string) => {
    try {
      await api.delete(`/admin/recruiters/${id}`);
      toast.success('Recruiter deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete recruiter');
      throw err;
    }
  };

  const updateCandidateStatus = async (id: string, status: Candidate['status']) => {
    try {
      await api.put(`/admin/applications/${id}/status`, { status: status.toUpperCase() });
      toast.success('Status updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
      throw err;
    }
  };

  const updateCandidateStatusRecruiter = async (id: string, status: Candidate['status']) => {
      try {
        await api.put(`/recruiter/applications/${id}/status`, { status: status.toUpperCase() });
        toast.success('Status updated successfully');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update status');
        throw err;
      }
    };


  const deleteCandidate = async (id: string) => {
    try {
      await api.delete(`/admin/candidates/${id}`);
      toast.success('Candidate deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete candidate');
      throw err;
    }
  };

  const assignJobToRecruiter = async (jobId: string, recruiterIds: string[]) => {
    try {
      await api.post(`/admin/jobs/${jobId}/assign`, { recruiterIds });
      toast.success('Recruiter(s) assigned successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign recruiters');
      throw err;
    }
  };

  // ============================================
  // RECRUITER OPERATIONS
  // ============================================

  const fetchRecruiterJobs = async (): Promise<Job[]> => {
    try {
      const response = await api.get('/recruiter/jobs');
      return response.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch jobs');
      return [];
    }
  };

  const fetchRecruiterCandidates = async (): Promise<Candidate[]> => {
    try {
      const response = await api.get('/recruiter/candidates');
      return response.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch candidates');
      return [];
    }
  };

  // ============================================
  // CANDIDATE OPERATIONS
  // ============================================

  const fetchCandidateJobs = async (): Promise<Job[]> => {
    try {
      const response = await api.get('/candidate/jobs');
      return response.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch jobs');
      return [];
    }
  };

  const fetchCandidateApplications = async () => {
    try {
      const response = await api.get('/candidate/applications');
      return response.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch applications');
      return [];
    }
  };

  const applyToJob = async (jobId: string) => {
    try {
      await api.post('/candidate/applications', { jobId });
      toast.success('Application submitted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply');
      throw err;
    }
  };

  const uploadResume = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      await api.post('/candidate/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Resume uploaded successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
      throw err;
    }
  };

  return (
    <DataContext.Provider
      value={{
        fetchAuditLogs,
        auditLogs,
        auditTotalPages,
        auditCurrentPage,
        fetchJobs,
        fetchRecruiters,
        fetchCandidates,
        addJob,
        updateJob,
        deleteJob,
        addRecruiter,
        updateRecruiter,
        deleteRecruiter,
        updateCandidateStatus,
        updateCandidateStatusRecruiter,
        deleteCandidate,
        assignJobToRecruiter,
        fetchRecruiterJobs,
        fetchRecruiterCandidates,
        fetchCandidateJobs,
        fetchCandidateApplications,
        applyToJob,
        uploadResume,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};