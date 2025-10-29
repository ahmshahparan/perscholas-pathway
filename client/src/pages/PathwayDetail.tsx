import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Wrench, Award, CheckCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

export default function PathwayDetail() {
  const [, params] = useRoute("/pathways/:courseId");
  const courseId = params?.courseId;

  const { data: courses, isLoading } = trpc.courses.list.useQuery();
  const { data: pathways } = trpc.pathways.list.useQuery();
  const { data: domains } = trpc.domains.list.useQuery();
  
  const getDomainName = (domainId: number | null) => {
    if (!domainId || !domains) return "General";
    const domain = domains.find(d => d.id === domainId);
    return domain?.name || "General";
  };

  // Find the immersive course for this pathway
  const immersiveCourse = courses?.find(c => c.courseId === courseId && c.courseType === "immersive");

  // Build pathway tree for this specific immersive course
  const buildPathwayTree = () => {
    if (!courses || !pathways || !immersiveCourse) return null;

    const pathwayMap = new Map<number, any[]>();

    // Group pathways by prerequisite course
    pathways.forEach((pathway) => {
      if (!pathwayMap.has(pathway.prerequisiteCourseId)) {
        pathwayMap.set(pathway.prerequisiteCourseId, []);
      }
      pathwayMap.get(pathway.prerequisiteCourseId)!.push(pathway);
    });

    const buildNode = (courseDbId: number, depth: number, visited: Set<number>): PathwayNode | null => {
      if (visited.has(courseDbId)) return null; // Prevent circular references
      
      const course = courses.find((c) => c.id === courseDbId);
      if (!course) return null;

      const newVisited = new Set(visited);
      newVisited.add(courseDbId);

      const nextPathways = pathwayMap.get(courseDbId) || [];
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

    return buildNode(immersiveCourse.id, 0, new Set());
  };

  const pathwayTree = buildPathwayTree();

  // Collapsible node component for deep pathways
  const CollapsiblePathwayNode = ({ node, depth }: { node: PathwayNode; depth: number }) => {
    const [isOpen, setIsOpen] = useState(depth < 2); // Auto-expand first 2 levels
    const hasNextSteps = node.nextSteps.length > 0;

    return (
      <div className="flex flex-col items-start">
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
                {node.course.weeks} weeks • {getDomainName(node.course.domainId)}
                {hasNextSteps && ` • ${node.nextSteps.length} next step${node.nextSteps.length > 1 ? 's' : ''}`}
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
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
            {node.nextSteps.length > 0 && (
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-8 mt-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {isOpen ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Hide {node.nextSteps.length} next step{node.nextSteps.length > 1 ? 's' : ''}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show {node.nextSteps.length} next step{node.nextSteps.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            )}
            
            <CollapsibleContent>
              <div className="ml-8 mt-4 pl-6 border-l-2 border-dashed border-muted-foreground/30 space-y-6">
                {node.nextSteps.map((nextNode, idx) => (
                  <div key={`${nextNode.course.id}-${idx}`} className="relative">
                    <div className="absolute -left-6 top-6 w-6 h-0.5 bg-muted-foreground/30"></div>
                    <ArrowRight className="absolute -left-8 top-4 h-5 w-5 text-muted-foreground/50" />
                    <CollapsiblePathwayNode node={nextNode} depth={depth + 1} />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="container py-8 flex-1">
          <div className="text-center py-12">Loading pathway...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!immersiveCourse || !pathwayTree) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="container py-8 flex-1">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Pathway not found.</p>
              <Link href="/pathways">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to All Pathways
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="container py-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <Link href="/pathways">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Pathways
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{immersiveCourse.courseName}</h1>
              <p className="text-muted-foreground">
                {immersiveCourse.weeks} weeks • {getDomainName(immersiveCourse.domainId)}
              </p>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
            {immersiveCourse.courseObjectives}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pathway Progression</CardTitle>
            <CardDescription>
              Follow the arrows to explore available career accelerator courses. Click any course for detailed information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CollapsiblePathwayNode node={pathwayTree} depth={0} />
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Navigate</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <p>• <strong>Expand/Collapse:</strong> Click the buttons to show or hide next steps</p>
            <p>• <strong>Arrows:</strong> Indicate progression from prerequisite to next available courses</p>
            <p>• <strong>Click any course card:</strong> View detailed information, prerequisites, and all next steps</p>
            <p>• <strong>Multiple options:</strong> When you see multiple next steps, you can choose based on your career goals</p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

