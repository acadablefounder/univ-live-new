import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Trash2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Assuming 'sonner' for toasts based on snippets

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EmptyState from "@/components/educator/EmptyState";

// Firebase
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  deleteDoc,
  Timestamp,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- Types ---
type Student = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  status: "active" | "inactive";
  createdAt: Timestamp | null;
  photoURL?: string;
};

type Attempt = {
  id: string;
  testTitle: string;
  subject: string;
  scorePercent: number;
  createdAt: Timestamp;
};

export default function Learners() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Selection State for "View Details"
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // --- 1. Fetch All Learners (Real-time) ---
  useEffect(() => {
    // Query: Get all students, ordered by newest first
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Student[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Student[];
        setStudents(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching students:", error);
        toast.error("Failed to load learners.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // --- 2. Actions ---

  // Toggle Status (Active <-> Inactive)
  const toggleStatus = async (student: Student) => {
    const newStatus = student.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "students", student.id), {
        status: newStatus,
      });
      toast.success(`Student marked as ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  // Delete Student
  const handleDelete = async (studentId: string) => {
    if (!confirm("Are you sure? This will delete the student and their data.")) return;
    try {
      await deleteDoc(doc(db, "students", studentId));
      toast.success("Student deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete student");
    }
  };

  // View Performance (Fetch Attempts)
  const handleViewPerformance = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingAttempts(true);
    setAttempts([]);

    try {
      // Assuming attempts are stored in a root collection or subcollection. 
      // Adjust path if your attempts are inside `students/{id}/attempts`
      const q = query(
        collection(db, "attempts"), 
        where("studentId", "==", student.id),
        orderBy("createdAt", "desc")
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Attempt[];
      setAttempts(data);
    } catch (err) {
      console.error(err);
      // Optional: attempts might not exist yet
    } finally {
      setLoadingAttempts(false);
    }
  };

  // --- 3. Filtering Logic ---
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learners</h1>
          <p className="text-sm text-muted-foreground">
            Manage your students, view performance, and control access.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="h-8 px-3">
             Total: {students.length}
           </Badge>
           <Badge variant="secondary" className="h-8 px-3 bg-green-100 text-green-700 dark:bg-green-900/30">
             Active: {students.filter(s => s.status === 'active').length}
           </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val: any) => setStatusFilter(val)}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Main Content */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No learners found"
          description={
            search
              ? "No students match your search filters."
              : "You haven't added any students yet."
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              layoutId={student.id}
            >
              <Card className="hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  
                  {/* Left: Info */}
                  <div className="flex items-center gap-4 overflow-hidden">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={student.photoURL} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                         <h3 className="font-semibold truncate">{student.name}</h3>
                         <Badge 
                           variant={student.status === "active" ? "default" : "secondary"}
                           className={cn(
                             "text-[10px] h-5",
                             student.status === "active" ? "bg-green-600 hover:bg-green-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400"
                           )}
                         >
                           {student.status.toUpperCase()}
                         </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {student.email}
                        </span>
                        {student.phone && (
                          <span className="flex items-center gap-1 hidden sm:flex">
                            <Phone className="h-3 w-3" /> {student.phone}
                          </span>
                        )}
                        {student.city && (
                          <span className="flex items-center gap-1 hidden md:flex">
                            <MapPin className="h-3 w-3" /> {student.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewPerformance(student)}>
                        <Eye className="mr-2 h-4 w-4" /> View Performance
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`mailto:${student.email}`)}>
                        <Mail className="mr-2 h-4 w-4" /> Send Email
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onClick={() => toggleStatus(student)}>
                        {student.status === "active" ? (
                          <>
                            <UserX className="mr-2 h-4 w-4 text-amber-600" />
                            <span className="text-amber-600">Deactivate</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                            <span className="text-green-600">Activate</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600" 
                        onClick={() => handleDelete(student.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Performance Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Performance Report: {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
             {loadingAttempts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
             ) : attempts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No test attempts found for this student.</p>
                </div>
             ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {attempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                       <div>
                         <p className="font-medium text-sm">{attempt.testTitle}</p>
                         <p className="text-xs text-muted-foreground">{attempt.subject} • {attempt.createdAt?.toDate().toLocaleDateString()}</p>
                       </div>
                       <Badge variant={attempt.scorePercent >= 40 ? "default" : "destructive"}>
                         {attempt.scorePercent}%
                       </Badge>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}