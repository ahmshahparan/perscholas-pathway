import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { BookOpen, ArrowLeft, Search, X, GraduationCap, Wrench, Award, CheckCircle, Sparkles, PackageSearch } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BackToTop } from "@/components/BackToTop";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

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

export default function Courses() {
  const { data: courses, isLoading } = trpc.courses.list.useQuery();
  const { data: domains } = trpc.domains.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showCareerAccelerators, setShowCareerAccelerators] = useState(false);
  
  const getDomainName = (domainId: number | null) => {
    if (!domainId || !domains) return "General";
    const domain = domains.find(d => d.id === domainId);
    return domain?.name || "General";
  };

  // Filter courses based on search and filters
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    
    return courses.filter((course) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        course.courseName.toLowerCase().includes(query) ||
        getDomainName(course.domainId).toLowerCase().includes(query) ||
        courseTypeLabels[course.courseType].toLowerCase().includes(query) ||
        course.courseObjectives?.toLowerCase().includes(query) ||
        course.certificationsBadges?.toLowerCase().includes(query);
      
      const matchesDomain = !selectedDomain || course.domainId === selectedDomain;
      
      // Handle type filtering
      let matchesType = true;
      if (showCareerAccelerators) {
        // Career Accelerators filter: show only non-immersive courses
        matchesType = course.courseType !== "immersive";
      } else if (selectedType) {
        // Specific type filter: show only courses of that type
        matchesType = course.courseType === selectedType;
      }
      // If neither filter is active, matchesType remains true (show all)
      
      return matchesSearch && matchesDomain && matchesType;
    });
  }, [courses, searchQuery, selectedDomain, selectedType, showCareerAccelerators, domains]);

  const immersiveCourses = filteredCourses.filter((c) => c.courseType === "immersive");
  const alumniCourses = filteredCourses.filter((c) => c.courseType !== "immersive");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main id="main-content" className="container py-8 flex-1" role="main" aria-label="Courses page">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Courses' }]} />
          <div className="flex items-center gap-4 mb-8 mt-6">
            <BookOpen className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-bold">Courses</h1>
          </div>
          <LoadingSkeleton type="card" count={6} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="container py-8 flex-1" role="main" aria-label="Courses page">
        <Breadcrumb items={[{ label: "Courses" }]} />
        
        <div className="flex items-center gap-4 mb-8">
          <BookOpen className="h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold">Courses</h1>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search courses by name, domain, certification, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              aria-label="Search courses"
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
            
            {/* Domain Filters */}
            <Badge
              variant={selectedDomain === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedDomain(null)}
            >
              All Domains
            </Badge>
            {domains?.map((domain) => (
              <Badge
                key={domain.id}
                variant={selectedDomain === domain.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedDomain(domain.id)}
              >
                {domain.name}
              </Badge>
            ))}
            
            <span className="text-sm text-muted-foreground mx-2">|</span>
            
            {/* Type Filters */}
            <Badge
              variant={selectedType === null && !showCareerAccelerators ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setSelectedType(null);
                setShowCareerAccelerators(false);
              }}
            >
              All Types
            </Badge>
            <Badge
              variant={selectedType === "immersive" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setSelectedType("immersive");
                setShowCareerAccelerators(false);
              }}
            >
              Immersive
            </Badge>
            <Badge
              variant={showCareerAccelerators ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                if (showCareerAccelerators) {
                  setShowCareerAccelerators(false);
                } else {
                  setShowCareerAccelerators(true);
                  setSelectedType(null);
                }
              }}
            >
              Career Accelerators
            </Badge>
            
            {/* Clear All Filters */}
            {(searchQuery || selectedDomain || selectedType || showCareerAccelerators) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDomain(null);
                  setSelectedType(null);
                  setShowCareerAccelerators(false);
                }}
                className="ml-2"
              >
                Clear All
              </Button>
            )}
          </div>
          
          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredCourses.length} of {courses?.length || 0} courses
          </div>
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <EmptyState
            icon={PackageSearch}
            title="No courses found"
            description="Try adjusting your search or filters to find what you're looking for."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery("");
              setSelectedDomain(null);
              setSelectedType(null);
              setShowCareerAccelerators(false);
            }}
          />
        )}

        {/* Immersive Courses */}
        {immersiveCourses.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Immersive Courses</h2>
            <span className="text-muted-foreground">{immersiveCourses.length} courses</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {immersiveCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.courseId}`}>
                <Card className="h-full hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-xl">{course.courseName}</CardTitle>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = courseTypeIcons[course.courseType] || BookOpen;
                          return <Icon className="h-5 w-5 text-primary" />;
                        })()}
                        <Badge className={`${courseTypeColors[course.courseType]} text-xs sm:text-sm whitespace-normal text-left leading-tight py-1`}>
                          {courseTypeLabels[course.courseType]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">{course.weeks} weeks</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm font-medium text-primary">{getDomainName(course.domainId)}</span>
                        {course.certificationsBadges && (
                          <>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{course.certificationsBadges}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{course.courseObjectives}</CardDescription>
                    {course.jobRoles && course.jobRoles.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Career Outcomes:</p>
                        <div className="flex flex-wrap gap-2">
                          {course.jobRoles.map((role: any) => (
                            <Badge
                              key={role.id}
                              variant={role.isPrimary ? "default" : "secondary"}
                              className="text-xs"
                            >
                              💼 {role.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {course.nextStepsCount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {course.nextStepsCount} alumni course{course.nextStepsCount !== 1 ? "s" : ""} available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        )}

        {/* Alumni Courses */}
        {alumniCourses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Career Accelerator Courses</h2>
              <span className="text-muted-foreground">{alumniCourses.length} courses</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alumniCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.courseId}`}>
                  <Card className="h-full hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-xl">{course.courseName}</CardTitle>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = courseTypeIcons[course.courseType] || BookOpen;
                            return <Icon className="h-5 w-5 text-primary" />;
                          })()}
                          <Badge className={courseTypeColors[course.courseType]}>
                            {courseTypeLabels[course.courseType]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-muted-foreground">{course.weeks} weeks</span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm font-medium text-primary">{getDomainName(course.domainId)}</span>
                          {course.certificationsBadges && (
                            <>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{course.certificationsBadges}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">{course.courseObjectives}</CardDescription>
                      {course.jobRoles && course.jobRoles.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Career Outcomes:</p>
                          <div className="flex flex-wrap gap-2">
                            {course.jobRoles.map((role: any) => (
                              <Badge
                                key={role.id}
                                variant={role.isPrimary ? "default" : "secondary"}
                                className="text-xs"
                              >
                                💼 {role.title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {course.nextStepsCount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {course.nextStepsCount} next step{course.nextStepsCount !== 1 ? "s" : ""} available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <BackToTop />
      <Footer />
    </div>
  );
}

