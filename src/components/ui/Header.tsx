import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import ProtectedLink from "@/components/ProtectedLink";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-black/80 backdrop-blur-sm py-4 px-6 shadow-lg fixed w-full z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <img src="/images/logo.png" alt="Back to the Future Logo" className="h-12 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          <ProtectedLink to="/levels" className="text-white hover:text-primary transition-colors text-lg">
            Trivia Game
          </ProtectedLink>
          <ProtectedLink to="/costume-voting" className="text-white hover:text-primary transition-colors text-lg">
            Costume Voting
          </ProtectedLink>
          <ProtectedLink to="/props-and-memorabilia" className="text-white hover:text-primary transition-colors text-lg">
            Props & Memorabilia
          </ProtectedLink>
          <ProtectedLink to="/birthday-messages" className="text-white hover:text-primary transition-colors text-lg">
            Birthday Messages
          </ProtectedLink>
          <a href="https://give.michaeljfox.org/fundraiser/6119686" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-colors text-lg">
            Team Fox
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <UserMenu />
          {/* Mobile Menu Button */}
          <button className="lg:hidden text-primary hover:text-primary/80" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="lg:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-sm py-4 px-6 shadow-lg">
          <div className="flex flex-col space-y-4">
            <ProtectedLink to="/levels" className="text-white hover:text-primary transition-colors text-lg" onClick={toggleMenu}>
              Trivia Game
            </ProtectedLink>
            <ProtectedLink to="/costume-voting" className="text-white hover:text-primary transition-colors text-lg" onClick={toggleMenu}>
              Costume Voting
            </ProtectedLink>
            <ProtectedLink to="/props-and-memorabilia" className="text-white hover:text-primary transition-colors text-lg" onClick={toggleMenu}>
              Props & Memorabilia
            </ProtectedLink>
            <ProtectedLink to="/birthday-messages" className="text-white hover:text-primary transition-colors text-lg" onClick={toggleMenu}>
              Birthday Messages
            </ProtectedLink>
            <a href="https://give.michaeljfox.org/fundraiser/6119686" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-colors text-lg" onClick={toggleMenu}>
              Team Fox
            </a>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
