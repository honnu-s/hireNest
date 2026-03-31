import { useState, useEffect } from 'react';
import { useData, Job, Recruiter } from '../../contexts/DataContext';
import { Pagination } from '../Pagination';
import { StatusBadge } from '../StatusBadge';
import { Plus, Pencil, Trash2, UserPlus, Briefcase, X } from 'lucide-react';
import api from '../../../lib/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface JobsTableProps { limit?: number; }

const getEmptyForm = () => ({
  title: '',
  department: '',
  location: '',
  type: 'FULL_TIME',
  status: 'open' as 'open' | 'closed'
});


// 👇 OUTSIDE JobsTable (very important)
const InputField = ({ label, id, ...props }: any) => (
  <div>
    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
      {label}
    </label>
    <input
      id={id}
      {...props}
      className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
    />
  </div>
); 
export function JobsTable({ limit }: JobsTableProps) {
  const { fetchRecruiters, addJob, updateJob, deleteJob, assignJobToRecruiter } = useData();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageLimit = 10;
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
const [formData, setFormData] = useState(getEmptyForm());
  const loadData = async (page = currentPage) => {
    setLoading(true);
    try {
      if (limit) {
        const res = await api.get(`/admin/jobs?limit=${limit}`);
        setJobs(res.data);
      } else {
        const res = await api.get(`/admin/jobs?page=${page}&limit=${pageLimit}`);
        setJobs(res.data.data);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.currentPage);
      }
      const rec = await fetchRecruiters();
      setRecruiters(Array.isArray(rec) ? rec : rec.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(1); }, []);

  const handleAdd = async () => {
  setSubmitting(true);
  try {
    await addJob({
      title: formData.title,
      department: formData.department,
      location: formData.location,
      type: formData.type,
      status: formData.status
    });
    setIsAddOpen(false);
    setFormData(getEmptyForm());
    loadData();
  } finally {
    setSubmitting(false);
  }
};
  const handleEdit = async () => {
  if (!selectedJob) return;
  setSubmitting(true);
  try {
    await updateJob(selectedJob.id, formData);
    setIsEditOpen(false);
    setSelectedJob(null);
    loadData();
  } finally {
    setSubmitting(false);
  }
};
  const handleDelete = async (id: string) => {
  if (!confirm('Delete this job?')) return;
  setSubmitting(true);
  try {
    await deleteJob(id);
    loadData();
  } finally {
    setSubmitting(false);
  }
};
  const handleAssign = async (recruiterId: string) => {
  if (!selectedJob) return;
  setSubmitting(true);
  try {
    await assignJobToRecruiter(selectedJob.id, [recruiterId]);
    setIsAssignOpen(false);
    setSelectedJob(null);
    loadData();
  } finally {
    setSubmitting(false);
  }
};
  const openEdit = (job: Job) => {
    setSelectedJob(job);
    setFormData({ title: job.title, department: job.department, location: job.location, type: job.type, status: job.status });
    setIsEditOpen(true);
  };


  return (
    <div className="space-y-5">
      {!limit && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Jobs</h2>
            <p className="page-subtitle">Manage job postings and recruiter assignments</p>
          </div>
          <button onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20">
            <Plus className="w-4 h-4"/> Post Job
          </button>
        </div>
      )}

      <div className="ats-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full ats-table">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3.5 text-left">Title</th>
                <th className="px-5 py-3.5 text-left">Department</th>
                <th className="px-5 py-3.5 text-left">Location</th>
                <th className="px-5 py-3.5 text-left">Type</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-left">Recruiter(s)</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i} className="border-b border-border/50">
                  {Array.from({length:7}).map((_,j)=>(
                    <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded w-3/4"/></td>
                  ))}
                </tr>
              )) : jobs.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <Briefcase className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2"/>
                  <p className="text-sm text-muted-foreground">No jobs found</p>
                </td></tr>
              ) : jobs.map((job, idx) => (
                <tr key={job.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in-up"
                    style={{animationDelay:`${idx*30}ms`}}>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-foreground">{job.title}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{job.department}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{job.location}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md font-medium">
                      {job.type.replace('_',' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={job.status}/></td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {job.assignedRecruiters?.length
                      ? job.assignedRecruiters.map(r=>r.name).join(', ')
                      : <span className="text-xs text-muted-foreground/50 italic">Unassigned</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setSelectedJob(job); setIsAssignOpen(true); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors" title="Assign recruiter">
                        <UserPlus className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={() => openEdit(job)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit job">
                        <Pencil className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={() => handleDelete(job.id)} disabled={submitting}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete job">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!limit && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={p=>{setCurrentPage(p);loadData(p);}}/>
      )}

      {/* ADD JOB DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{fontFamily:'Syne,sans-serif'}}>Post New Job</DialogTitle>
            <DialogDescription>Create a new job listing for candidates to apply</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <InputField label="Job Title" value={formData.title} onChange={(e:any)=>setFormData({...formData,title:e.target.value})} placeholder="e.g. Senior Developer"/>
            <InputField label="Department" value={formData.department} onChange={(e:any)=>setFormData({...formData,department:e.target.value})} placeholder="e.g. Engineering"/>
            <InputField label="Location" value={formData.location} onChange={(e:any)=>setFormData({...formData,location:e.target.value})} placeholder="e.g. Remote"/>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Job Type</label>
              <Select value={formData.type} onValueChange={v=>setFormData({...formData,type:v})}>
                <SelectTrigger className="border-border "><SelectValue/></SelectTrigger>
                <SelectContent className=" border border-border shadow-lg">
                  {[['FULL_TIME','Full-time'],['PART_TIME','Part-time'],['CONTRACT','Contract'],['INTERNSHIP','Internship']].map(([v,l])=>(
<SelectItem
  key={v}
  value={v}
  className="hover:bg-gray-100 dark:hover:bg-gary-100 focus:bg-gray-100 "
>
  {l}
</SelectItem>                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={()=>setIsAddOpen(false)} disabled={submitting} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handleAdd}  className="px-4 py-2 text-sm rounded-lg bg-white text-black font-semibold shadow-md hover:shadow-lg transition-all border border-border" disabled={submitting}>
  {submitting ? 'Posting...' : 'Post Job'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{fontFamily:'Syne,sans-serif'}}>Edit Job</DialogTitle>
            <DialogDescription>Update job posting details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <InputField label="Job Title" value={formData.title} onChange={(e:any)=>setFormData({...formData,title:e.target.value})}/>
            <InputField label="Department" value={formData.department} onChange={(e:any)=>setFormData({...formData,department:e.target.value})}/>
            <InputField label="Location" value={formData.location} onChange={(e:any)=>setFormData({...formData,location:e.target.value})}/>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Type</label>
                <Select value={formData.type} onValueChange={v=>setFormData({...formData,type:v})}>
                 <SelectTrigger className="border border-border text-black bg-white dark:bg-white shadow-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {[['FULL_TIME','Full-time'],['PART_TIME','Part-time'],['CONTRACT','Contract'],['INTERNSHIP','Internship']].map(([v,l])=>(
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Status</label>
                <Select value={formData.status} onValueChange={(v:'open'|'closed')=>setFormData({...formData,status:v})}>
                  <SelectTrigger className="border-border bg-muted/40"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={()=>setIsEditOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handleEdit} className="px-4 py-2 text-sm rounded-lg bg-white text-black font-semibold shadow-md hover:shadow-lg transition-all border border-border"  disabled={submitting}>
  {submitting ? 'Saving...' : 'Save Changes'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGN DIALOG */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle style={{fontFamily:'Syne,sans-serif'}}>Assign Recruiter</DialogTitle>
            <DialogDescription>Select a recruiter for "{selectedJob?.title}"</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Recruiter</label>
            <Select onValueChange={handleAssign}  disabled={submitting}>
              <SelectTrigger className="border-border bg-muted/40"><SelectValue placeholder="Choose a recruiter"/></SelectTrigger>
              <SelectContent>
                {recruiters.map(r=>(
                  <SelectItem key={r.id} value={r.id}>{r.name} — {r.department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button onClick={()=>setIsAssignOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
