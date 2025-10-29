import { trpc } from "@/lib/trpc";
import { Link, useRoute } from "wouter";
import { BookOpen, ArrowLeft, ArrowRight, Info, GraduationCap, Wrench, Award, CheckCircle, Sparkles } from "lucide-react";
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
  immersive: "bg-blue-600 text-white hover:bg-blue-700",
  skill_based: "bg-purple-600 text-white hover:bg-purple-700",
  exam_cert: "bg-green-600 text-white hover:bg-green-700",
  completion_cert: "bg-orange-600 text-white hover:bg-orange-700",
  paid: "bg-red-600 text-white hover:bg-red-700",
};

const courseTypeIcons: Record<string, any> = {
  immersive: GraduationCap,
  skill_based: Wrench,
  exam_cert: Award,
  completion_cert: CheckCircle,
  paid: Sparkles,
};

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:courseId");
  const courseId = params?.courseId || "";

  const { data, isLoading, error } = trpc.courses.getByCourseId.useQuery({ courseId });
  const { data: domains } = trpc.domains.list.useQuery();
  
  const getDomainName = (domainId: number | null) => {
    if (!domainId || !domains) return "General";
    const domain = domains.find(d => d.id === domainId);
    return domain?.name || "General";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="text-center py-12">Loading course details...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Link href="/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
          <div className="text-center py-12">
            <p className="text-destructive">Course not found</p>
          </div>
        </div>
      </div>
    );
  }

  const { course, prerequisites, nextSteps, jobRoles } = data;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="container py-4 sm:py-8 flex-1">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link href="/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>

        {/* Course Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start gap-3 sm:gap-4">
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl sm:text-3xl mb-2 break-words">{course.courseName}</CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = courseTypeIcons[course.courseType] || BookOpen;
                      return <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />;
                    })()}
                    <Badge className={`${courseTypeColors[course.courseType]} text-xs sm:text-sm whitespace-normal text-left leading-tight py-1`}>
                      {courseTypeLabels[course.courseType]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                    <span className="text-muted-foreground">{course.weeks} weeks</span>
                    <span className="text-muted-foreground hidden sm:inline">•</span>
                    <span className="font-medium text-primary">{getDomainName(course.domainId)}</span>
                    <span className="text-muted-foreground hidden sm:inline">•</span>
                    <span className="text-muted-foreground">ID: {course.courseId}</span>
                  </div>
                </div>
                <CardDescription className="text-base">{course.courseObjectives}</CardDescription>
                {course.certificationsBadges && (
                  <div className="mt-3">
                    <span className="text-sm font-medium">Certifications & Badges: </span>
                    <span className="text-sm text-muted-foreground">{course.certificationsBadges}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Career Outcomes Section */}
        {jobRoles && jobRoles.length > 0 && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Career Outcomes</CardTitle>
              </div>
              <CardDescription className="text-blue-700">
                Job roles you'll be prepared for after completing this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobRoles.map((role: any) => (
                  <Card key={role.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{role.title}</CardTitle>
                        {role.isPrimary === 1 && (
                          <Badge variant="default" className="bg-blue-600 text-white">
                            Primary
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <CardDescription className="text-sm mt-2">
                          {role.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    {role.salaryRange && (
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-green-700">Salary Range:</span>
                          <span className="text-muted-foreground">{role.salaryRange.replace(/\$/g, '')}</span>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Prerequisites */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900">Prerequisites</CardTitle>
              </div>
              <CardDescription className="text-orange-700">
                Courses that must be completed before taking this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prerequisites.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground font-medium">No prerequisites</p>
                  <p className="text-sm text-muted-foreground mt-1">This is a foundational course</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prerequisites.map((prereq) => (
                    <Link key={prereq.id} href={`/courses/${prereq.course.courseId}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="p-4">
                          <CardTitle className="text-lg">{prereq.course.courseName}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              required
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {courseTypeLabels[prereq.course.courseType]}
                            </span>
                          </div>
                          {prereq.course.courseObjectives && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {prereq.course.courseObjectives}
                            </p>
                          )}
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Next Steps */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-900">Available Next Steps</CardTitle>
              </div>
              <CardDescription className="text-green-700">
                Courses available after completing this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nextSteps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground font-medium">No next steps defined</p>
                  <p className="text-sm text-muted-foreground mt-1">Check back later for new courses</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nextSteps
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((next) => (
                    <Link key={next.id} href={`/courses/${next.course.courseId}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="p-4">
                          <CardTitle className="text-lg">{next.course.courseName}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              Order: {next.order}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {courseTypeLabels[next.course.courseType]}
                            </span>
                          </div>
                          {next.course.courseObjectives && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {next.course.courseObjectives}
                            </p>
                          )}
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>


      </div>
      <Footer />
    </div>
  );
}

