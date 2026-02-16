import { useState, useEffect } from 'react';
import { useData, Recruiter } from '../../contexts/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Pagination } from '../Pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card } from '../ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
export function RecruitersTable() {
  const {
    fetchRecruiters,
    addRecruiter,
    updateRecruiter,
    deleteRecruiter,
  } = useData();

  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] =
    useState<Recruiter | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
  loadRecruiters(currentPage);
}, [currentPage]);


const loadRecruiters = async (page: number = 1) => {
  setLoading(true);
  const response = await fetchRecruiters(page);
  if (response?.data) {
    setRecruiters(response.data);
    setTotalPages(response.totalPages);
  } else {
    const recruiterArray = Array.isArray(response)
      ? response
      : [];

    setRecruiters(recruiterArray);
    setTotalPages(1);
  }

  setLoading(false);
};

const handlePageChange = (page: number) => {
  setCurrentPage(page);
};

const handleAdd = async () => {
  try {
    setSubmitting(true);

    const recruiterData = {
      ...formData,
      password: 'Recruiter@123',
    };

    await addRecruiter(recruiterData);


    setIsAddOpen(false);

    setFormData({
      name: '',
      email: '',
      department: '',
      status: 'active',
    });
    await loadRecruiters(1);
    setCurrentPage(1);

  } catch (err: any) {
    toast.error(err?.message || "Failed to add recruiter");

  } finally {
    setSubmitting(false);
  }
};



const handleEdit = async () => {
  if (!selectedRecruiter) return;

  try {
    setSubmitting(true);

    await updateRecruiter(selectedRecruiter.id, formData);

    toast.success("Recruiter updated successfully");

    setIsEditOpen(false);
    setSelectedRecruiter(null);

    await loadRecruiters(currentPage);

  } catch (err: any) {
    toast.error(err?.message || "Failed to update recruiter");
  } finally {
    setSubmitting(false);
  }
};


  const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this recruiter?')) return;

  try {
    setSubmitting(true);

    await deleteRecruiter(id);

    toast.success("Recruiter deleted successfully");

    await loadRecruiters(currentPage);

  } catch (err: any) {
    toast.error(err?.message || "Failed to delete recruiter");
  } finally {
    setSubmitting(false);
  }
};


  const openEditDialog = (recruiter: Recruiter) => {
    setSelectedRecruiter(recruiter);
    setFormData({
      name: recruiter.name,
      email: recruiter.email,
      department: recruiter.department,
      status: recruiter.status,
    });
    setIsEditOpen(true);
  };

  
  if (loading) {
    return <div className="text-muted-foreground">Loading recruiters...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recruiters Management</h2>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Recruiter
        </Button>
      </div>

      <Card className='rounded-none'>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recruiters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No recruiters found
                  </TableCell>
                </TableRow>
              ) : (
                recruiters.map((recruiter) => (
                  <TableRow key={recruiter.id}>
                    <TableCell>{recruiter.name}</TableCell>
                    <TableCell>{recruiter.email}</TableCell>
                    <TableCell>{recruiter.department}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          recruiter.status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {recruiter.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(recruiter)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(recruiter.id)}
                          className="text-destructive"
                          disabled={submitting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
/>


      {/* ADD DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recruiter</DialogTitle>
            <DialogDescription>Create a recruiter account</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Input
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <Input
              placeholder="Department"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
            />
          </div>

          <DialogFooter>
<Button
  variant="outline"
  onClick={() => setIsAddOpen(false)}
  disabled={submitting}
>
              Cancel
            </Button>
<Button onClick={handleAdd} disabled={submitting}>
  {submitting ? "Adding..." : "Add"}
</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recruiter</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Input
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <Input
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
            />
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
<Button onClick={handleEdit} disabled={submitting}>
  {submitting ? "Saving..." : "Save"}
</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


