import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// OAuth removed - using admin_users authentication only
export default function Home() {

  // If theme is switchable in App.tsx, we can implement theme toggling like this:
  // const { theme, toggleTheme } = useTheme();

  // Use APP_LOGO (as image src) and APP_TITLE if needed

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="container py-12 flex-1" role="main" aria-label="Home page content">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-primary">Per Scholas Training Pathway</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Explore our comprehensive training programs and career accelerator courses designed to help you succeed in tech.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild size="lg">
            <Link href="/courses">Browse Courses</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pathways">View Pathways</Link>
          </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="p-6 border-4 border-[#FFB800] rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-3">Immersive Programs</h3>
              <p className="text-muted-foreground">
                Start your tech career with our intensive bootcamp programs covering Full Stack Development, Data Science, UX/UI Design, and IT Support.
              </p>
            </div>
            <div className="p-6 border-4 border-[#C084FC] rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-3">Career Accelerators</h3>
              <p className="text-muted-foreground">
                Advance your skills with specialized courses in backend architecture, frontend frameworks, performance optimization, and more.
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 border-4 border-[#14B8A6] rounded-lg bg-card">
            <h3 className="text-xl font-semibold mb-3 text-[#0066CC]">Prescriptive Pathways</h3>
            <p className="text-muted-foreground">
              Our training pathways are designed to guide you through a structured learning journey. Complete an immersive program to unlock career accelerator courses, then continue advancing through specialized tracks.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
