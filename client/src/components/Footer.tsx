import { Link } from "wouter";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/images/perscholas-logo.png" 
                alt="Per Scholas" 
                className="h-8 w-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering Per Scholas and our learners with cutting-edge product solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://perscholas.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Per Scholas Homepage
                </a>
              </li>
              <li>
                <Link href="/courses">
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Browse Courses
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/pathways">
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    View Pathways
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Have questions or feedback?
            </p>
            <a 
              href="mailto:productdevteam@perscholas.org"
              className="text-sm text-primary hover:underline"
            >
              productdevteam@perscholas.org
            </a>
            
            {/* Social Media Icons */}
            <div className="flex gap-3 mt-4">
              <a 
                href="https://www.facebook.com/perscholas" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="facebook"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://www.instagram.com/perscholas" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="instagram"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://www.linkedin.com/school/per-scholas" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="linkedin"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://www.youtube.com/user/perscholas" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="youtube"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-muted-foreground">
            Copyright © {new Date().getFullYear()} Per Scholas. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

