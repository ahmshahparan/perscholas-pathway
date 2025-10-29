import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const courseTypeColors: Record<string, string> = {
  immersive: "bg-blue-600 text-white",
  skill_based: "bg-purple-600 text-white",
  exam_cert: "bg-green-600 text-white",
  completion_cert: "bg-orange-600 text-white",
  paid: "bg-red-600 text-white",
};

export default function PathwayOverview() {
  const { data: courses, isLoading } = trpc.courses.list.useQuery();
  const { data: pathways } = trpc.pathways.list.useQuery();
  const { data: domains } = trpc.domains.list.useQuery();
  
  const getDomainName = (domainId: number | null) => {
    if (!domainId || !domains) return "General";
    const domain = domains.find(d => d.id === domainId);
    return domain?.name || "General";
  };

  // Get pathway statistics for each immersive course
  const getPathwayStats = () => {
    if (!courses || !pathways) return [];

    const immersiveCourses = courses.filter((c) => c.courseType === "immersive");
    
    return immersiveCourses.map((immersive) => {
      // Count total courses in this pathway
      const countCoursesInPath = (courseId: number, visited: Set<number> = new Set()): number => {
        if (visited.has(courseId)) return 0;
        visited.add(courseId);
        
        const nextPathways = pathways.filter(p => p.prerequisiteCourseId === courseId);
        let count = 1; // Count current course
        
        nextPathways.forEach(p => {
          count += countCoursesInPath(p.nextCourseId, visited);
        });
        
        return count;
      };

      const totalCourses = countCoursesInPath(immersive.id);
      const directNextSteps = pathways.filter(p => p.prerequisiteCourseId === immersive.id).length;
      
      // Get unique course types in pathway
      const getUniqueTypes = (courseId: number, visited: Set<number> = new Set()): Set<string> => {
        if (visited.has(courseId)) return new Set();
        visited.add(courseId);
        
        const course = courses.find(c => c.id === courseId);
        const types = new Set<string>(course ? [course.courseType] : []);
        
        const nextPathways = pathways.filter(p => p.prerequisiteCourseId === courseId);
        nextPathways.forEach(p => {
          const subTypes = getUniqueTypes(p.nextCourseId, visited);
          subTypes.forEach(t => types.add(t));
        });
        
        return types;
      };

      const courseTypes = Array.from(getUniqueTypes(immersive.id));

      return {
        immersive,
        totalCourses,
        directNextSteps,
        courseTypes,
      };
    });
  };

  const pathwayStats = getPathwayStats();

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
          <h1 className="text-4xl font-bold mb-3">Training Pathways</h1>
          <p className="text-muted-foreground text-lg">
            Explore all available training pathways. Each pathway starts with an immersive program and branches into specialized career accelerator courses.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading pathways...</div>
        ) : pathwayStats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No pathways defined yet. Create courses and pathways in the admin dashboard.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pathway Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {pathwayStats.map((stat, idx) => (
                <Link key={stat.immersive.id} href={`/pathways/${stat.immersive.courseId}`}>
                  <Card className="h-full hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <GraduationCap className="h-6 w-6 text-blue-600" />
                        </div>
                        <Badge className="bg-blue-600 text-white">
                          Pathway {idx + 1}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl leading-tight mb-2">
                        {stat.immersive.courseName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {getDomainName(stat.immersive.domainId)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {stat.immersive.courseObjectives}
                      </p>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div>
                          <div className="text-2xl font-bold text-primary">{stat.totalCourses}</div>
                          <div className="text-xs text-muted-foreground">Total Courses</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">{stat.directNextSteps}</div>
                          <div className="text-xs text-muted-foreground">Next Options</div>
                        </div>
                      </div>

                      {/* Course Types */}
                      <div className="flex flex-wrap gap-1 pt-2">
                        {stat.courseTypes.filter(t => t !== 'immersive').map(type => (
                          <Badge 
                            key={type} 
                            variant="outline" 
                            className="text-xs"
                          >
                            {type === 'skill_based' ? 'Skill' : 
                             type === 'exam_cert' ? 'Exam' : 
                             type === 'completion_cert' ? 'Completion' : 
                             type === 'paid' ? 'Paid' : type}
                          </Badge>
                        ))}
                      </div>

                      <Button variant="outline" className="w-full mt-4">
                        View Pathway
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50/50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">About Training Pathways</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700 space-y-2">
                <p>• <strong>Entry Points:</strong> Each pathway begins with an immersive bootcamp program</p>
                <p>• <strong>Career Accelerators:</strong> Specialized courses to advance your skills after completing an immersive program</p>
                <p>• <strong>Flexible Progression:</strong> Multiple paths available from each course, choose based on your career goals</p>
                <p>• <strong>Click any pathway:</strong> View the complete course progression and details</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

