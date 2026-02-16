import { useState, useEffect } from 'react';
import { useData, Candidate } from '../../contexts/DataContext';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card } from '../ui/card';
import { Trash2 } from 'lucide-react';
import { Pagination } from '../Pagination';

interface CandidatesTableProps {
  limit?: number;
}

export function CandidatesTable({ limit }: CandidatesTableProps) {
  const {
    fetchCandidates,
    updateCandidateStatus,
    deleteCandidate,
  } = useData();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

const handleStatusFilterChange = (value: string) => {
  setStatusFilter(value);
  setCurrentPage(1);
};

const handleClearFilter = () => {
  setStatusFilter("all");
  setCurrentPage(1);
};

  
const loadCandidates = async (
  page = 1,
  status = statusFilter
) => {
  setLoading(true);

  const response = await fetchCandidates(page, 10, status);

  setCandidates(response.data);
  setCurrentPage(response.currentPage);
  setTotalPages(response.totalPages);

  setLoading(false);
};


 useEffect(() => {
  loadCandidates(currentPage, statusFilter);
}, [currentPage]);



  

  const handleStatusChange = async (
    id: string,
    status: Candidate['status']
  ) => {
    await updateCandidateStatus(id, status);
    loadCandidates(currentPage); 
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this candidate?')) {
      await deleteCandidate(id);
      loadCandidates(currentPage); 
    }
  };


  if (loading) {
    return <div className="text-muted-foreground">Loading candidates...</div>;
  }

  return (
    <div className="space-y-4">
      
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Candidates Management
          </h2>
        </div>
      
      {/* Filter Section */}
{!limit && (
  <div className="flex items-center gap-3">
    <span className="text-sm text-muted-foreground">
      Filter by status:
    </span>

    <Select 
      value={statusFilter}
      onValueChange={handleStatusFilterChange}
    >
      <SelectTrigger className="w-[180px] bg-gray-100 rounded-none">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>

      <SelectContent >
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="applied">Applied</SelectItem>
        <SelectItem value="interview">Interview</SelectItem>
        <SelectItem value="offer">Offer</SelectItem>
        <SelectItem value="hired">Hired</SelectItem>
        <SelectItem value="rejected">Rejected</SelectItem>
      </SelectContent>
    </Select>

    {statusFilter !== "all" && (
      <Button 
        variant="outline"
        size="sm"
        onClick={handleClearFilter}
        className="gap-1 bg-black text-white "
      >
        Clear
      </Button>
    )}
  </div>
)}

      <Card className="rounded-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Job Applied</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No candidates found
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">
                      {candidate.name}
                    </TableCell>
                    <TableCell>{candidate.email}</TableCell>
                    <TableCell>{candidate.phone}</TableCell>
                    <TableCell>{candidate.jobTitle}</TableCell>
                    <TableCell>{candidate.appliedDate}</TableCell>

                    <TableCell>
                      <Select
                        value={candidate.status}
                        onValueChange={(value) =>
                          handleStatusChange(
                            candidate.id,
                            value as Candidate['status']
                          )
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(candidate.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>


      {!limit && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
}
