import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, BookOpen, Search } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 w-full flex items-center justify-center py-16">
      <Card className="w-full max-w-lg mx-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>

          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            Page Not Found
          </h2>

          <p className="text-slate-600 mb-8 leading-relaxed">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Link href="/courses">
              <Button variant="outline" className="px-6 py-2.5" asChild>
                <span>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Courses
                </span>
              </Button>
            </Link>
            <Link href="/pathways">
              <Button variant="outline" className="px-6 py-2.5" asChild>
                <span>
                  <Search className="w-4 h-4 mr-2" />
                  View Pathways
                </span>
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-sm">
              <Link href="/courses" className="text-primary hover:underline cursor-pointer">
                All Courses
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/pathways" className="text-primary hover:underline cursor-pointer">
                Training Pathways
              </Link>
              <span className="text-muted-foreground">•</span>
              <a 
                href="https://perscholas.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Per Scholas Homepage
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  );
}
