import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Plus, Trash2, Link as LinkIcon, Search, X, User } from "lucide-react";
import { toast } from "sonner";
import { VisualPathwayEditor } from "@/components/VisualPathwayEditor";
import { ActivityLog } from "@/components/ActivityLog";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

const courseTypeLabels: Record<string, string> = {
  immersive: "Immersive",
  skill_based: "Career Accelerator - Skill Based",
  exam_cert: "Career Accelerator - Exam Based Cert",
  completion_cert: "Career Accelerator - Completion Based Cert",
  paid: "Career Accelerator - Paid",
};

const courseTypeOptions = [
  { value: "immersive", label: "Immersive" },
  { value: "skill_based", label: "Career Accelerator - Skill Based" },
  { value: "exam_cert", label: "Career Accelerator - Exam Based Cert" },
  { value: "completion_cert", label: "Career Accelerator - Completion Based Cert" },
  { value: "paid", label: "Career Accelerator - Paid" },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { token, username, role, isAuthenticated, logout } = useAdminAuth();
  const { canModify, isGlobalAdmin } = useAuthorization(username || undefined, role);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pathwayDialogOpen, setPathwayDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showMyCoursesOnly, setShowMyCoursesOnly] = useState(false);

  const utils = trpc.useUtils();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/admin");
    }
  }, [isAuthenticated, setLocation]);

  // Check if first login
  const { data: firstLoginData } = trpc.adminUsers.checkFirstLogin.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  useEffect(() => {
    if (firstLoginData) {
      setIsFirstLogin(firstLoginData.isFirstLogin);
      setUserRole(firstLoginData.role);
      setShowPasswordModal(firstLoginData.isFirstLogin);
    }
  }, [firstLoginData]);

  const { data: courses, isLoading } = trpc.courses.list.useQuery();
  const { data: domains } = trpc.domains.list.useQuery();
  const { data: jobRoles } = trpc.jobRoles.list.useQuery();

  const createCourseMutation = trpc.adminCourses.create.useMutation({
    onSuccess: () => {
      toast.success("Course created successfully!");
      utils.courses.list.invalidate();
      setCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create course");
    },
  });

  const deleteCourseMutation = trpc.adminCourses.delete.useMutation({
    onSuccess: () => {
      toast.success("Course deleted successfully!");
      utils.courses.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete course");
    },
  });

  const updateCourseMutation = trpc.adminCourses.update.useMutation({
    onSuccess: () => {
      toast.success("Course updated successfully!");
      utils.courses.list.invalidate();
      setEditDialogOpen(false);
      setEditingCourse(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update course");
    },
  });

  const createJobRoleMutation = trpc.adminJobRoles.create.useMutation({
    onSuccess: () => {
      toast.success("Job role created successfully!");
      utils.jobRoles.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create job role");
    },
  });

  const updateJobRoleMutation = trpc.adminJobRoles.update.useMutation({
    onSuccess: () => {
      toast.success("Job role updated successfully!");
      utils.jobRoles.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update job role");
    },
  });

  const deleteJobRoleMutation = trpc.adminJobRoles.delete.useMutation({
    onSuccess: () => {
      toast.success("Job role deleted successfully!");
      utils.jobRoles.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete job role");
    },
  });

  const createPathwayMutation = trpc.adminPathways.create.useMutation({
    onSuccess: () => {
      toast.success("Pathway created successfully!");
      utils.courses.list.invalidate();
      setPathwayDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create pathway");
    },
  });

  const handleLogout = () => {
    logout();
    setLocation("/admin");
  };

  const handleCreateCourse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const primaryJobRole = formData.get("primaryJobRole") as string;
    const secondaryJobRole = formData.get("secondaryJobRole") as string;
    
    const jobRoleIds: number[] = [];
    if (primaryJobRole) {
      jobRoleIds.push(parseInt(primaryJobRole));
    }
    if (secondaryJobRole && secondaryJobRole !== "none") {
      jobRoleIds.push(parseInt(secondaryJobRole));
    }
    
    createCourseMutation.mutate({
      token: token!,
      courseName: formData.get("courseName") as string,
      courseType: formData.get("courseType") as any,
      domainId: parseInt(formData.get("domainId") as string),
      courseObjectives: formData.get("courseObjectives") as string,
      weeks: parseInt(formData.get("weeks") as string),
      certificationsBadges: formData.get("certificationsBadges") as string,
      jobRoleIds,
    });
  };

  const handleDeleteCourse = (id: number, courseName: string) => {
    if (confirm(`Are you sure you want to delete "${courseName}"?`)) {
      deleteCourseMutation.mutate({ token: token!, id });
    }
  };

  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    setEditDialogOpen(true);
  };

  const handleUpdateCourse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const primaryJobRole = formData.get("primaryJobRole") as string;
    const secondaryJobRole = formData.get("secondaryJobRole") as string;
    
    const jobRoleIds: number[] = [];
    if (primaryJobRole && primaryJobRole !== "none") {
      jobRoleIds.push(parseInt(primaryJobRole));
    }
    if (secondaryJobRole && secondaryJobRole !== "none") {
      jobRoleIds.push(parseInt(secondaryJobRole));
    }
    
    updateCourseMutation.mutate({
      token: token!,
      id: editingCourse.id,
      courseName: formData.get("courseName") as string,
      courseType: formData.get("courseType") as any,
      courseObjectives: formData.get("courseObjectives") as string,
      weeks: parseInt(formData.get("weeks") as string),
      certificationsBadges: formData.get("certificationsBadges") as string,
      jobRoleIds,
    });
  };

  const handleCreatePathway = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPathwayMutation.mutate({
      token: token!,
      prerequisiteCourseId: parseInt(formData.get("prerequisiteCourseId") as string),
      nextCourseId: parseInt(formData.get("nextCourseId") as string),
      order: parseInt(formData.get("order") as string) || 0,
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Per Scholas Branded Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <img 
                src="/images/perscholas-logo.png" 
                alt="Per Scholas" 
                className="h-8 sm:h-10"
              />
              <div className="sm:border-l sm:pl-4">
                <h1 className="text-lg sm:text-2xl font-bold text-primary">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Logged in as: {username}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
            {userRole === "global_admin" && (
              <Button variant="outline" onClick={() => setLocation("/admin/users")}>
                <User className="h-4 w-4 mr-2" />
                User Management
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="pathways">Pathways</TabsTrigger>
            <TabsTrigger value="jobroles">Job Roles</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
        <div className="flex gap-4 mb-6">
          <Link href="/admin/domains">
            <Button variant="outline">
              Manage Domains
            </Button>
          </Link>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>Add a new course to the training pathway system</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input id="courseName" name="courseName" placeholder="Full Stack Web Development" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseType">Course Type</Label>
                  <Select name="courseType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course type" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domainId">Course Domain</Label>
                  <Select name="domainId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains?.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id.toString()}>
                          {domain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the domain this course belongs to
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseObjectives">Course Objectives</Label>
                  <Textarea
                    id="courseObjectives"
                    name="courseObjectives"
                    placeholder="Describe the course objectives..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weeks">Number of Weeks</Label>
                  <Input id="weeks" name="weeks" type="number" placeholder="12" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificationsBadges">Certifications & Badges</Label>
                  <Input
                    id="certificationsBadges"
                    name="certificationsBadges"
                    placeholder="Full Stack Developer Certificate"
                  />
                </div>
                
                {/* Job Roles Section */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Career Outcomes (Job Roles)</Label>
                    <span className="text-xs text-muted-foreground">Select up to 2 roles</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primaryJobRole">Primary Job Role</Label>
                    <Select name="primaryJobRole">
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary job role" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobRoles?.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The main career outcome for this course
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryJobRole">Secondary Job Role (Optional)</Label>
                    <Select name="secondaryJobRole">
                      <SelectTrigger>
                        <SelectValue placeholder="Select secondary job role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {jobRoles?.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      An alternative career path for this course
                    </p>
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={createCourseMutation.isPending}>
                  {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={pathwayDialogOpen} onOpenChange={setPathwayDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LinkIcon className="h-4 w-4 mr-2" />
                Create Pathway
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Pathway</DialogTitle>
                <DialogDescription>Link two courses to create a bidirectional pathway</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePathway} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prerequisiteCourseId">Prerequisite Course</Label>
                  <Select name="prerequisiteCourseId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select prerequisite course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextCourseId">Next Course</Label>
                  <Select name="nextCourseId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select next course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input id="order" name="order" type="number" placeholder="1" defaultValue="1" min="1" />
                  <p className="text-xs text-muted-foreground">
                    Order determines the sequence when multiple courses follow the same prerequisite (1 = first, 2 = second, etc.)
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={createPathwayMutation.isPending}>
                  {createPathwayMutation.isPending ? "Creating..." : "Create Pathway"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Course</DialogTitle>
                <DialogDescription>Update course information</DialogDescription>
              </DialogHeader>
              {editingCourse && (
                <form onSubmit={handleUpdateCourse} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-courseName">Course Name</Label>
                    <Input
                      id="edit-courseName"
                      name="courseName"
                      defaultValue={editingCourse.courseName}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-courseType">Course Type</Label>
                    <Select name="courseType" defaultValue={editingCourse.courseType} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {courseTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-courseObjectives">Course Objectives</Label>
                    <Textarea
                      id="edit-courseObjectives"
                      name="courseObjectives"
                      defaultValue={editingCourse.courseObjectives || ""}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-weeks">Number of Weeks</Label>
                    <Input
                      id="edit-weeks"
                      name="weeks"
                      type="number"
                      defaultValue={editingCourse.weeks}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-certificationsBadges">Certifications & Badges</Label>
                    <Input
                      id="edit-certificationsBadges"
                      name="certificationsBadges"
                      defaultValue={editingCourse.certificationsBadges || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-domainId">Domain</Label>
                    <Select name="domainId" defaultValue={editingCourse.domainId?.toString()} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {domains?.map((domain: any) => (
                          <SelectItem key={domain.id} value={domain.id.toString()}>
                            {domain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  

                  {/* Job Roles Section */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Career Outcomes (Job Roles)</Label>
                      <span className="text-xs text-muted-foreground">Select up to 2 roles</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-primaryJobRole">Primary Job Role</Label>
                      <Select 
                        name="primaryJobRole" 
                        defaultValue={editingCourse.jobRoles?.[0]?.id?.toString() || "none"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary job role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {jobRoles?.map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        The main career outcome for this course
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-secondaryJobRole">Secondary Job Role (Optional)</Label>
                      <Select 
                        name="secondaryJobRole"
                        defaultValue={editingCourse.jobRoles?.[1]?.id?.toString() || "none"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select secondary job role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {jobRoles?.map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        An alternative career path for this course
                      </p>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={updateCourseMutation.isPending}>
                    {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

          </TabsContent>

          <TabsContent value="pathways">
            <VisualPathwayEditor token={token!} />
          </TabsContent>

          <TabsContent value="jobroles" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Job Roles Management</h2>
                <p className="text-muted-foreground">Manage career outcomes and job roles for courses</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job Role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Job Role</DialogTitle>
                    <DialogDescription>
                      Add a new job role that can be associated with courses
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const title = formData.get("title") as string;
                    const description = formData.get("description") as string;
                    const salaryRange = formData.get("salaryRange") as string;

                    createJobRoleMutation.mutate({
                      token: token!,
                      title,
                      description,
                      salaryRange,
                    });
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title *</Label>
                      <Input 
                        id="title" 
                        name="title" 
                        placeholder="Software Developer" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        placeholder="Develop and maintain software applications..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaryRange">Salary Range</Label>
                      <Input 
                        id="salaryRange" 
                        name="salaryRange" 
                        placeholder="$70,000 - $120,000" 
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="submit">Create Job Role</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Job Roles</CardTitle>
                <CardDescription>
                  {jobRoles?.length || 0} job roles available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobRoles?.map((role: any) => (
                    <div key={role.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{role.title}</h3>
                        {role.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {role.description}
                          </p>
                        )}
                        {role.salaryRange && (
                          <p className="text-sm font-medium text-green-600 mt-2">
                            💰 {role.salaryRange}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Job Role</DialogTitle>
                              <DialogDescription>
                                Update job role information
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const title = formData.get("title") as string;
                              const description = formData.get("description") as string;
                              const salaryRange = formData.get("salaryRange") as string;

                              updateJobRoleMutation.mutate({
                                token: token!,
                                id: role.id,
                                title,
                                description,
                                salaryRange,
                              });
                            }} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-title">Job Title *</Label>
                                <Input 
                                  id="edit-title" 
                                  name="title" 
                                  defaultValue={role.title}
                                  required 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea 
                                  id="edit-description" 
                                  name="description" 
                                  defaultValue={role.description || ""}
                                  rows={4}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-salaryRange">Salary Range</Label>
                                <Input 
                                  id="edit-salaryRange" 
                                  name="salaryRange" 
                                  defaultValue={role.salaryRange || ""}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button type="submit">Update Job Role</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${role.title}"?`)) {
                              deleteJobRoleMutation.mutate({
                                token: token!,
                                id: role.id,
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!jobRoles || jobRoles.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      No job roles yet. Click "Add Job Role" to create one.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLog 
              token={token!} 
              limit={100}
              title="Recent Admin Activity"
              description="All administrative actions across courses, pathways, and domains"
            />
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">All Courses</h2>
          
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses by name, domain, certification, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-2">Filter by:</span>
              
              {/* My Courses Filter */}
              <Button
                variant={showMyCoursesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMyCoursesOnly(!showMyCoursesOnly)}
              >
                <User className="h-3 w-3 mr-1" />
                My Courses
              </Button>
              
              <span className="text-sm text-muted-foreground mx-2">|</span>
              
              {/* Domain Filters */}
              <Button
                variant={selectedDomain === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDomain(null)}
              >
                All Domains
              </Button>
              {domains?.map((domain) => (
                <Button
                  key={domain.id}
                  variant={selectedDomain === domain.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDomain(domain.id)}
                >
                  {domain.name}
                </Button>
              ))}
              
              <span className="text-sm text-muted-foreground mx-2">|</span>
              
              {/* Type Filters */}
              <Button
                variant={selectedType === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(null)}
              >
                All Types
              </Button>
              <Button
                variant={selectedType === "immersive" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("immersive")}
              >
                Immersive
              </Button>
              <Button
                variant={selectedType && selectedType !== "immersive" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("skill_based")}
              >
                Career Accelerators
              </Button>
              
              {/* Clear All Filters */}
              {(searchQuery || selectedDomain || selectedType || showMyCoursesOnly) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedDomain(null);
                    setSelectedType(null);
                    setShowMyCoursesOnly(false);
                  }}
                  className="ml-2"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
          
        {isLoading ? (
          <div className="text-center py-12">Loading courses...</div>
        ) : (() => {
          const getDomainName = (domainId: number | null) => {
            if (!domainId || !domains) return "General";
            const domain = domains.find(d => d.id === domainId);
            return domain?.name || "General";
          };
          
          const filteredCourses = courses?.filter((course) => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = !query || 
              course.courseName.toLowerCase().includes(query) ||
              getDomainName(course.domainId).toLowerCase().includes(query) ||
              courseTypeLabels[course.courseType].toLowerCase().includes(query) ||
              course.courseObjectives?.toLowerCase().includes(query) ||
              course.certificationsBadges?.toLowerCase().includes(query);
            
            const matchesDomain = !selectedDomain || course.domainId === selectedDomain;
            const matchesType = !selectedType || 
              (selectedType === "immersive" ? course.courseType === "immersive" : course.courseType !== "immersive");
            const matchesCreator = !showMyCoursesOnly || course.createdBy === username;
            
            return matchesSearch && matchesDomain && matchesType && matchesCreator;
          }) || [];
          
          return (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {filteredCourses.length} of {courses?.length || 0} courses
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((course) => {
                  // Per Scholas themed card colors based on course type
                  const cardBorderClass = course.courseType === 'immersive' 
                    ? 'border-l-4 border-l-[#FFB800]' // Yellow for Immersive
                    : 'border-l-4 border-l-[#C084FC]'; // Purple for Career Accelerators
                  
                  return (
              <Card key={course.id} className={cardBorderClass}>
                <CardHeader>
                  <CardTitle className="text-lg text-primary">{course.courseName}</CardTitle>
                  <CardDescription>
                    {courseTypeLabels[course.courseType]} • {course.weeks} weeks • {domains?.find(d => d.id === course.domainId)?.name || "General"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{course.courseObjectives}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground">
                      Created by: <span className="font-medium">{course.createdBy}</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {canModify(course.createdBy) ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCourse(course.id, course.courseName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        🔒 Only {course.createdBy} or admin-global can modify
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
                })}
          </div>
            </>
          );
        })()}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        isFirstLogin={isFirstLogin}
        onPasswordChanged={() => {
          setShowPasswordModal(false);
          setIsFirstLogin(false);
          toast.success("Password changed successfully!");
          // Refresh the first login status
          utils.adminUsers.checkFirstLogin.invalidate();
        }}
      />
    </div>
  );
}

