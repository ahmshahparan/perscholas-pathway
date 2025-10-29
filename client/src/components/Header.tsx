import { Link } from "wouter";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container py-4">
        <Link href="/">
          <img 
            src="/images/perscholas-logo.png" 
            alt="Per Scholas" 
            className="h-10 w-auto"
          />
        </Link>
      </div>
    </header>
  );
}

