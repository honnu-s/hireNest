import { useState, useEffect } from 'react';
import { useData, Candidate } from '../../contexts/DataContext';
import { Pagination } from '../Pagination';
import { StatusBadge } from '../StatusBadge';
import { Trash2, Users } from 'lucide-react';


const toViewableUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/raw/upload/', '/raw/upload/fl_attachment:false/')
    : url;
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';

interface CandidatesTableProps { limit?: number; }
const ALL_STATUSES = ['all', 'applied', 'interview', 'offer', 'hired', 'rejected'];

export function CandidatesTable({ limit }: CandidatesTableProps) {
  const { fetchCandidates, updateCandidateStatus, deleteCandidate } = useData();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async (page = 1, status = statusFilter) => {
    setLoading(true);
    const res = await fetchCandidates(page, 10, status);
    setCandidates(res.data); setCurrentPage(res.currentPage); setTotalPages(res.totalPages);
    setLoading(false);
  };

  useEffect(() => { load(currentPage, statusFilter); }, [currentPage]);

  const handleFilterChange = (s: string) => { setStatusFilter(s); setCurrentPage(1); load(1, s); };
  const handleStatusChange = async (id: string, status: Candidate['status']) => {
    await updateCandidateStatus(id, status); load(currentPage);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this candidate?')) return;
    await deleteCandidate(id); load(currentPage);
  };

  return (
    <div className="space-y-5">
      {!limit && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="page-title">Candidates</h2>
            <p className="page-subtitle">Manage applicants and update pipeline status</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-xl flex-wrap">
            {ALL_STATUSES.map(s => (
              <button key={s} onClick={() => handleFilterChange(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  statusFilter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}>{s}</button>
            ))}
          </div>
        </div>
      )}
      <div className="ats-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full ats-table">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3.5 text-left">Candidate</th>
                <th className="px-5 py-3.5 text-left">Contact</th>
                <th className="px-5 py-3.5 text-left">Job Applied</th>
                <th className="px-5 py-3.5 text-left">Date</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-left">Resume</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i} className="border-b border-border/50">
                  {Array.from({length:6}).map((_,j)=>(
                    <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded w-3/4"/></td>
                  ))}
                </tr>
              )) : candidates.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2"/>
                  <p className="text-sm text-muted-foreground">No candidates found</p>
                </td></tr>
              ) : candidates.map((c, idx) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in-up"
                    style={{animationDelay:`${idx*30}ms`}}>
                  <td className="px-5 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/10 flex items-center justify-center text-purple-600 dark:text-purple-700 text-xs font-bold flex-shrink-0">
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-2">
                    <p className="text-sm">{c.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.phone}</p>
                  </td>
                  <td className="px-5 py-2 text-sm">{c.jobTitle}</td>
                  <td className="px-5 py-2 text-sm text-muted-foreground">{c.appliedDate
                    ? new Date(c.appliedDate).toISOString().split("T")[0]
                    : "N/A"}</td>
                  <td className="px-5 py-4">
                    <Select value={c.status} onValueChange={v => handleStatusChange(c.id, v as Candidate['status'])}>
                      <SelectTrigger className="focus:outline-none focus:ring-0 focus-visible:ring-0 w-auto h-auto border-0 bg-transparent p-0 shadow-none  gap-1.5 hover:opacity-75 transition-opacity cursor-pointer">
  <SelectValue><StatusBadge status={c.status}/></SelectValue>
</SelectTrigger>
                      <SelectContent>
                        {['applied','interview','offer','hired','rejected'].map(s=>(
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
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => handleDelete(c.candidateId!)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {!limit && totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}/>
      )}
    </div>
  );
}
