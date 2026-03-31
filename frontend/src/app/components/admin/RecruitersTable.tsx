import { useState, useEffect } from 'react';
import { useData, Recruiter } from '../../contexts/DataContext';
import { Pagination } from '../Pagination';
import { StatusBadge } from '../StatusBadge';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
function InputField({ label, ...props }: any) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
    </div>
  );
}
export function RecruitersTable() {
  const { fetchRecruiters, addRecruiter, updateRecruiter, deleteRecruiter } = useData();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<Recruiter | null>(null);
  const [form, setForm] = useState({ name: '', email: '', department: '', status: 'active' as 'active' | 'inactive' });

  const load = async (page = 1) => {
    setLoading(true);
    const res = await fetchRecruiters(page);
    if (res?.data) { setRecruiters(res.data); setTotalPages(res.totalPages); }
    else { setRecruiters(Array.isArray(res) ? res : []); setTotalPages(1); }
    setLoading(false);
  };

  useEffect(() => { load(currentPage); }, [currentPage]);

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      await addRecruiter({ ...form, password: 'Recruiter@123' });
      setIsAddOpen(false); setForm({ name:'', email:'', department:'', status:'active' }); load(1); setCurrentPage(1);
    } catch (e: any) { toast.error(e?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await updateRecruiter(selected.id, form);
      setIsEditOpen(false); setSelected(null); load(currentPage);
    } catch (e: any) { toast.error(e?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recruiter?')) return;
    setSubmitting(true);
    try { await deleteRecruiter(id); load(currentPage); }
    catch (e: any) { toast.error(e?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const openEdit = (r: Recruiter) => {
    setSelected(r); setForm({ name: r.name, email: r.email, department: r.department, status: r.status }); setIsEditOpen(true);
  };

  

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Recruiters</h2>
          <p className="page-subtitle">Manage recruiter accounts and assignments</p>
        </div>
        <button onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20">
          <Plus className="w-4 h-4"/> Add Recruiter
        </button>
      </div>

      <div className="ats-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full ats-table">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3.5 text-left">Recruiter</th>
                <th className="px-5 py-3.5 text-left">Department</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i} className="border-b border-border/50">
                  {Array.from({length:4}).map((_,j)=>(<td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded w-3/4"/></td>))}
                </tr>
              )) : recruiters.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-16 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2"/>
                  <p className="text-sm text-muted-foreground">No recruiters found</p>
                </td></tr>
              ) : recruiters.map((r, idx) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in-up"
                    style={{animationDelay:`${idx*30}ms`}}>
                  <td className="px-5 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-purple-900/10 flex items-center justify-center text-purple-600 dark:text-purple-600 text-xs font-bold flex-shrink-0">
                        {r.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-2 text-sm text-muted-foreground">{r.department}</td>
                  <td className="px-5 py-2"><StatusBadge status={r.status}/></td>
                  <td className="px-5 py-2 ">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(r)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Pencil className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={() => handleDelete(r.id)} disabled={submitting}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30">
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

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}/>

      {/* ADD */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle >Add Recruiter</DialogTitle>
            <DialogDescription>Create a new recruiter account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <InputField label="Full Name" value={form.name} onChange={(e:any)=>setForm({...form,name:e.target.value})} placeholder="Jane Smith"/>
            <InputField label="Email Address" type="email" value={form.email} onChange={(e:any)=>setForm({...form,email:e.target.value})} placeholder="jane@company.com"/>
            <InputField label="Department" value={form.department} onChange={(e:any)=>setForm({...form,department:e.target.value})} placeholder="Engineering"/>
            <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              Default password: <span className="font-mono font-semibold text-foreground">Recruiter@123</span>
            </p>
          </div>
          <DialogFooter>
            <button onClick={()=>setIsAddOpen(false)} disabled={submitting} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-white text-black font-semibold shadow-md hover:shadow-lg transition-all border border-border">
              {submitting ? 'Adding...' : 'Add Recruiter'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{fontFamily:'Syne,sans-serif'}}>Edit Recruiter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <InputField label="Full Name" value={form.name} onChange={(e:any)=>setForm({...form,name:e.target.value})}/>
            <InputField label="Email Address" type="email" value={form.email} onChange={(e:any)=>setForm({...form,email:e.target.value})}/>
            <InputField label="Department" value={form.department} onChange={(e:any)=>setForm({...form,department:e.target.value})}/>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Status</label>
              <Select value={form.status} onValueChange={(v:'active'|'inactive')=>setForm({...form,status:v})}>
                <SelectTrigger className="border-border bg-muted/40"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={()=>setIsEditOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handleEdit} disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-white text-black font-semibold shadow-md hover:shadow-lg transition-all border border-border">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
