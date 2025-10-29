import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Wrench, Award, CheckCircle, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const courseTypeLabels: Record<string, string> = {
  immersive: "IMMERSIVE",
  skill_based: "Career Accelerator - Skill Based",
  exam_cert: "Career Accelerator - Exam Based Cert",
  completion_cert: "Career Accelerator - Completion Based Cert",
  paid: "Career Accelerator - Paid",
};

const courseTypeColors: Record<string, string> = {
  immersive: "bg-blue-600 text-white",
  skill_based: "bg-purple-600 text-white",
  exam_cert: "bg-green-600 text-white",
  completion_cert: "bg-orange-600 text-white",
  paid: "bg-red-600 text-white",
};

const courseTypeIcons: Record<string, any> = {
  immersive: GraduationCap,
  skill_based: Wrench,
  exam_cert: Award,
  completion_cert: CheckCircle,
  paid: Sparkles,
};

interface PathwayNode {
  course: any;
  nextSteps: PathwayNode[];
  depth: number;
}

export default function PathwayVisualization() {
  const { data: courses, isLoading } = trpc.courses.list.useQuery();
  const { data: pathways } = trpc.pathways.list.useQuery();
  const { data: domains } = trpc.domains.list.useQuery();
  
  const getDomainName = (domainId: number | null) => {
    if (!domainId || !domains) return "General";
    const domain = domains.find(d => d.id === domainId);
    return domain?.name || "General";
  };

  // Build pathway tree starting from immersive courses
  const buildPathwayTree = () => {
    if (!courses || !pathways) return [];

    const immersiveCourses = courses.filter((c) => c.courseType === "immersive");
    const pathwayMap = new Map<number, any[]>();

    // Group pathways by prerequisite course
    pathways.forEach((pathway) => {
      if (!pathwayMap.has(pathway.prerequisiteCourseId)) {
        pathwayMap.set(pathway.prerequisiteCourseId, []);
      }
      pathwayMap.get(pathway.prerequisiteCourseId)!.push(pathway);
    });

    const buildNode = (courseId: number, depth: number, visited: Set<number>): PathwayNode | null => {
      if (visited.has(courseId)) return null; // Prevent circular references
      
      const course = courses.find((c) => c.id === courseId);
      if (!course) return null;

      const newVisited = new Set(visited);
      newVisited.add(courseId);

      const nextPathways = pathwayMap.get(courseId) || [];
      const nextSteps = nextPathways
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((p) => buildNode(p.nextCourseId, depth + 1, newVisited))
        .filter((n): n is PathwayNode => n !== null);

      return {
        course,
        nextSteps,
        depth,
      };
    };

    return immersiveCourses
      .map((course) => buildNode(course.id, 0, new Set()))
      .filter((n): n is PathwayNode => n !== null);
  };

  const renderPathwayNode = (node: PathwayNode, pathIndex: number) => {
    const hasNextSteps = node.nextSteps.length > 0;

    return (
      <div key={`${node.course.id}-${node.depth}`} className="flex flex-col items-start">
        <Link href={`/courses/${node.course.courseId}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer min-w-[280px] max-w-[320px]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const Icon = courseTypeIcons[node.course.courseType] || BookOpen;
                  return <Icon className="h-5 w-5 text-primary" />;
                })()}
                <Badge className={courseTypeColors[node.course.courseType]} variant="default">
                  {courseTypeLabels[node.course.courseType]}
                </Badge>
              </div>
              <CardTitle className="text-base leading-tight">{node.course.courseName}</CardTitle>
              <CardDescription className="text-xs">
                {node.course.weeks} weeks • {getDomainName(node.course.domainId)} • {node.course.nextStepsCount || 0} next steps
              </CardDescription>
            </CardHeader>
            {node.course.courseObjectives && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">{node.course.courseObjectives}</p>
              </CardContent>
            )}
          </Card>
        </Link>

        {hasNextSteps && (
          <div className="ml-8 mt-4 pl-6 border-l-2 border-dashed border-muted-foreground/30 space-y-6">
            {node.nextSteps.map((nextNode, idx) => (
              <div key={`${nextNode.course.id}-${idx}`} className="relative">
                <div className="absolute -left-6 top-6 w-6 h-0.5 bg-muted-foreground/30"></div>
                <ArrowRight className="absolute -left-8 top-4 h-5 w-5 text-muted-foreground/50" />
                {renderPathwayNode(nextNode, idx)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const pathwayTrees = buildPathwayTree();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="container py-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Training Pathway Visualization</h1>
          <p className="text-muted-foreground text-lg">
            Explore all available training pathways from entry-level immersive programs to advanced career accelerator
            courses.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading pathways...</div>
        ) : pathwayTrees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No pathways defined yet. Create courses and pathways in the admin dashboard.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {pathwayTrees.map((tree, idx) => (
              <div key={`tree-${idx}`} className="pb-8 border-b last:border-b-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-primary mb-2">
                    Pathway {idx + 1}: {tree.course.courseName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Starting from this immersive program, explore the available career accelerator options
                  </p>
                </div>
                {renderPathwayNode(tree, idx)}
              </div>
            ))}
          </div>
        )}

        <Card className="mt-8 bg-blue-50/50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Read This Visualization</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <p>• <strong>Entry Points:</strong> Immersive programs (blue badges) are the starting points</p>
            <p>• <strong>Arrows:</strong> Show the progression from prerequisite to next available courses</p>
            <p>• <strong>Order Numbers:</strong> When multiple options exist, they're sorted by display order</p>
            <p>• <strong>Click any course:</strong> View detailed information, prerequisites, and next steps</p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

