import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowRight, Plus, Trash2, AlertTriangle, BookOpen, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface VisualPathwayEditorProps {
  token: string;
}

interface PathwayNode {
  course: any;
  nextSteps: PathwayNode[];
  depth: number;
  pathwayId?: number;
  order?: number;
}

const courseTypeLabels: Record<string, string> = {
  immersive: "IMMERSIVE",
  skill_based: "SKILL BASED",
  exam_cert: "EXAM CERT",
  completion_cert: "COMPLETION CERT",
  paid: "PAID",
};

const courseTypeColors: Record<string, string> = {
  immersive: "bg-blue-600 text-white",
  skill_based: "bg-purple-600 text-white",
  exam_cert: "bg-green-600 text-white",
  completion_cert: "bg-orange-600 text-white",
  paid: "bg-red-600 text-white",
};

export function VisualPathwayEditor({ token }: VisualPathwayEditorProps) {
  const { username } = useAdminAuth();
  const { canModify } = useAuthorization(username || undefined);
  const [insertDialogOpen, setInsertDialogOpen] = useState(false);
  const [addNextDialogOpen, setAddNextDialogOpen] = useState(false);
  const [selectedPathway, setSelectedPathway] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: courses } = trpc.courses.list.useQuery();
  const { data: pathways } = trpc.adminPathways.list.useQuery({ token });
  const { data: domains } = trpc.domains.list.useQuery();
  const { data: jobRoles } = trpc.jobRoles.list.useQuery();

  const createCourseMutation = trpc.adminCourses.create.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create course");
    },
  });

  const createPathwayMutation = trpc.adminPathways.create.useMutation({
    onSuccess: () => {
      toast.success("Pathway created successfully!");
      utils.adminPathways.list.invalidate();
      utils.courses.list.invalidate();
      setInsertDialogOpen(false);
      setAddNextDialogOpen(false);
      setSelectedPathway(null);
      setSelectedCourse(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create pathway");
    },
  });

  const deletePathwayMutation = trpc.adminPathways.delete.useMutation({
    onSuccess: () => {
      toast.success("Pathway link removed successfully!");
      utils.adminPathways.list.invalidate();
      utils.courses.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove pathway link");
    },
  });

  // Build pathway tree starting from immersive courses
  const buildPathwayTree = () => {
    if (!courses || !pathways) return [];

    const immersiveCourses = courses.filter((c) => c.courseType === "immersive");
    const pathwayMap = new Map<number, any[]>();

    pathways.forEach((pathway) => {
      if (!pathwayMap.has(pathway.prerequisiteCourseId)) {
        pathwayMap.set(pathway.prerequisiteCourseId, []);
      }
      pathwayMap.get(pathway.prerequisiteCourseId)!.push(pathway);
    });

    const buildNode = (courseId: number, depth: number, visited: Set<number>): PathwayNode | null => {
      if (visited.has(courseId)) return null;
      
      const course = courses.find((c) => c.id === courseId);
      if (!course) return null;

      const newVisited = new Set(visited);
      newVisited.add(courseId);

      const nextPathways = pathwayMap.get(courseId) || [];
      const nextSteps = nextPathways
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((p) => {
          const node = buildNode(p.nextCourseId, depth + 1, newVisited);
          if (node) {
            node.pathwayId = p.id;
            node.order = p.order;
          }
          return node;
        })
        .filter((n): n is PathwayNode => n !== null);

      return { course, nextSteps, depth };
    };

    return immersiveCourses
      .map((course) => buildNode(course.id, 0, new Set()))
      .filter((n): n is PathwayNode => n !== null);
  };

  const canDeletePathway = (pathwayId: number) => {
    const pathway = pathways?.find((p) => p.id === pathwayId);
    if (!pathway) return false;
    
    // A pathway can be deleted if:
    // 1. The next course has no downstream dependencies, OR
    // 2. The next course has other incoming pathways (alternative prerequisites)
    const hasDownstream = pathways?.some((p) => p.prerequisiteCourseId === pathway.nextCourseId);
    const hasAlternativePrereqs = pathways?.some(
      (p) => p.nextCourseId === pathway.nextCourseId && p.id !== pathwayId
    );
    
    // Allow deletion if there are no downstream dependencies OR if there are alternative paths to the next course
    return !hasDownstream || hasAlternativePrereqs;
  };

  const handleRemoveLink = (pathwayId: number, fromCourseName: string, toCourseName: string) => {
    if (!canDeletePathway(pathwayId)) {
      toast.error(
        `Cannot remove this link: "${toCourseName}" is a prerequisite for other courses. Remove those pathways first.`,
        { duration: 5000 }
      );
      return;
    }

    if (confirm(`Remove pathway link from "${fromCourseName}" to "${toCourseName}"?`)) {
      deletePathwayMutation.mutate({ token, id: pathwayId });
    }
  };

  const handleInsertCourse = (pathway: any) => {
    setSelectedPathway(pathway);
    setInsertDialogOpen(true);
  };

  const handleAddNextStep = (course: any) => {
    setSelectedCourse(course);
    setAddNextDialogOpen(true);
  };

  const handleInsertSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCourseId = parseInt(formData.get("courseId") as string);
    const order = parseInt(formData.get("order") as string);

    if (!selectedPathway) return;

    // Create two new pathways: prerequisite → new course, new course → next course
    // Then delete the old direct pathway
    createPathwayMutation.mutate(
      {
        token,
        prerequisiteCourseId: selectedPathway.prerequisiteCourseId,
        nextCourseId: newCourseId,
        order: order,
      },
      {
        onSuccess: () => {
          createPathwayMutation.mutate(
            {
              token,
              prerequisiteCourseId: newCourseId,
              nextCourseId: selectedPathway.nextCourseId,
              order: 1,
            },
            {
              onSuccess: () => {
                deletePathwayMutation.mutate({ token, id: selectedPathway.id });
              },
            }
          );
        },
      }
    );
  };

  const handleAddNextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nextCourseId = parseInt(formData.get("courseId") as string);
    const order = parseInt(formData.get("order") as string);

    if (!selectedCourse) return;

    createPathwayMutation.mutate({
      token,
      prerequisiteCourseId: selectedCourse.id,
      nextCourseId: nextCourseId,
      order: order,
    });
  };

  const handleCreateAndAddNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const order = parseInt(formData.get("order") as string);

    if (!selectedCourse) return;

    // First create the course
    createCourseMutation.mutate(
      {
        token,
        courseName: formData.get("courseName") as string,
        courseType: formData.get("courseType") as "immersive" | "skill_based" | "exam_cert" | "completion_cert" | "paid",
        domainId: parseInt(formData.get("domainId") as string),
        courseObjectives: formData.get("courseObjectives") as string,
        weeks: parseInt(formData.get("weeks") as string),
        certificationsBadges: formData.get("certificationsBadges") as string || undefined,
      },
      {
        onSuccess: (data) => {
          // Then create the pathway with the new course (use insertId as the course database ID)
          createPathwayMutation.mutate({
            token,
            prerequisiteCourseId: selectedCourse.id,
            nextCourseId: data.insertId,
            order: order,
          });
        },
      }
    );
  };

  const getAvailableCoursesForInsert = () => {
    if (!courses || !selectedPathway) return [];
    return courses.filter(
      (c) =>
        c.id !== selectedPathway.prerequisiteCourseId &&
        c.id !== selectedPathway.nextCourseId
    );
  };

  const getAvailableCoursesForNext = () => {
    if (!courses || !selectedCourse) return [];
    // Exclude the current course and immersive courses (immersive can only be entry points)
    return courses.filter(
      (c) => c.id !== selectedCourse.id && c.courseType !== "immersive"
    );
  };

  const renderPathwayNode = (node: PathwayNode, pathIndex: number, parentCourse?: any) => {
    const hasNextSteps = node.nextSteps.length > 0;
    const pathway = parentCourse
      ? pathways?.find(
          (p) => p.prerequisiteCourseId === parentCourse.id && p.nextCourseId === node.course.id
        )
      : null;

    return (
      <div key={`${node.course.id}-${node.depth}`} className="flex flex-col items-start">
        {/* Course Card */}
        <Card className="min-w-[280px] max-w-[320px] border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <Badge className={courseTypeColors[node.course.courseType]} variant="default">
                {courseTypeLabels[node.course.courseType]}
              </Badge>
            </div>
            <CardTitle className="text-base leading-tight">{node.course.courseName}</CardTitle>
            <CardDescription className="text-xs">
              {node.course.weeks} weeks • ID: {node.course.courseId}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleAddNextStep(node.course)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Next Step
            </Button>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {hasNextSteps && (
          <div className="ml-8 mt-4 pl-6 border-l-2 border-dashed border-muted-foreground/30 space-y-6">
            {node.nextSteps.map((nextNode, idx) => {
              const pathwayId = nextNode.pathwayId!;
              const canDelete = canDeletePathway(pathwayId);
              const pathway = pathways?.find((p) => p.id === pathwayId);

              return (
                <div key={`${nextNode.course.id}-${idx}`} className="relative">
                  {/* Connection Line */}
                  <div className="absolute -left-6 top-6 w-6 h-0.5 bg-muted-foreground/30"></div>
                  
                  {/* Arrow with Controls */}
                  <div className="absolute -left-8 top-3 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1 bg-background px-2 py-1 rounded border shadow-sm">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs px-1">
                        {nextNode.order}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => pathway && handleInsertCourse(pathway)}
                        title="Insert course between these two"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 ${canDelete ? 'text-destructive hover:text-destructive' : 'text-muted-foreground cursor-not-allowed'}`}
                        onClick={() => canDelete && handleRemoveLink(pathwayId, node.course.courseName, nextNode.course.courseName)}
                        disabled={!canDelete}
                        title={canDelete ? "Remove this link" : "Cannot remove: has downstream dependencies"}
                      >
                        {canDelete ? <Trash2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>

                  {renderPathwayNode(nextNode, idx, node.course)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const pathwayTrees = buildPathwayTree();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Visual Pathway Editor</CardTitle>
          <CardDescription>
            Manage pathways visually. Click <Plus className="inline h-3 w-3" /> to insert a course or add next steps. 
            Click <Trash2 className="inline h-3 w-3" /> to remove links (only allowed if no downstream dependencies).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pathwayTrees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No pathways created yet. Start by creating courses and pathways.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {pathwayTrees.map((tree, idx) => (
                <div key={`tree-${idx}`} className="pb-8 border-b last:border-b-0">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-primary mb-1">
                      Pathway {idx + 1}: {tree.course.courseName}
                    </h3>
                    <p className="text-sm text-muted-foreground">Entry point for this training path</p>
                  </div>
                  {renderPathwayNode(tree, idx)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insert Course Dialog */}
      <Dialog open={insertDialogOpen} onOpenChange={setInsertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Course in Pathway</DialogTitle>
            <DialogDescription>
              Add a course between{" "}
              {selectedPathway && courses && (
                <>
                  <strong>{courses.find((c) => c.id === selectedPathway.prerequisiteCourseId)?.courseName}</strong>
                  {" → "}
                  <strong>{courses.find((c) => c.id === selectedPathway.nextCourseId)?.courseName}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInsertSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="insert-course">Select Course to Insert</Label>
              <Select name="courseId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableCoursesForInsert().map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.courseName} ({courseTypeLabels[course.courseType]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insert-order">Display Order</Label>
              <Input
                id="insert-order"
                name="order"
                type="number"
                defaultValue="1"
                min="1"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={createPathwayMutation.isPending}>
              {createPathwayMutation.isPending ? "Inserting..." : "Insert Course"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Next Step Dialog */}
      <Dialog open={addNextDialogOpen} onOpenChange={setAddNextDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Next Step</DialogTitle>
            <DialogDescription>
              Add a course after <strong>{selectedCourse?.courseName}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Select Existing Course</TabsTrigger>
              <TabsTrigger value="new">Create New Course</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing">
              <form onSubmit={handleAddNextSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="next-course">Select Next Course</Label>
                  <Select name="courseId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableCoursesForNext().map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.courseName} ({courseTypeLabels[course.courseType]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next-order">Display Order</Label>
                  <Input
                    id="next-order"
                    name="order"
                    type="number"
                    defaultValue="1"
                    min="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Order matters when multiple courses follow the same prerequisite
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={createPathwayMutation.isPending}>
                  {createPathwayMutation.isPending ? "Adding..." : "Add Next Step"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="new">
              <form onSubmit={handleCreateAndAddNext} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-course-name">Course Name</Label>
                  <Input id="new-course-name" name="courseName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-course-type">Course Type</Label>
                  <Select name="courseType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skill_based">Career Accelerator - Skill Based</SelectItem>
                      <SelectItem value="exam_cert">Career Accelerator - Exam Based Cert</SelectItem>
                      <SelectItem value="completion_cert">Career Accelerator - Completion Based Cert</SelectItem>
                      <SelectItem value="paid">Career Accelerator - Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-course-domain">Course Domain</Label>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-course-objectives">Course Objectives</Label>
                  <Input id="new-course-objectives" name="courseObjectives" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-course-weeks">Number of Weeks</Label>
                  <Input id="new-course-weeks" name="weeks" type="number" min="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-course-certs">Certifications & Badges (optional)</Label>
                  <Input id="new-course-certs" name="certificationsBadges" />
                </div>
                
                {/* Job Roles Section */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Career Outcomes (Job Roles)</Label>
                    <span className="text-xs text-muted-foreground">Select up to 2 roles</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-primary-job-role">Primary Job Role</Label>
                    <Select name="primaryJobRole">
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-secondary-job-role">Secondary Job Role (Optional)</Label>
                    <Select name="secondaryJobRole">
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
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-next-order">Display Order</Label>
                  <Input
                    id="new-next-order"
                    name="order"
                    type="number"
                    defaultValue="1"
                    min="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Order matters when multiple courses follow the same prerequisite
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={createPathwayMutation.isPending}>
                  {createPathwayMutation.isPending ? "Creating..." : "Create Course & Add as Next Step"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

