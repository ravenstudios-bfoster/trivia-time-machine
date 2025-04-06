import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card py-8 mt-auto">
      <div className="container mx-auto px-4">
        <nav className="flex flex-wrap justify-center gap-8">
          <Link to="/levels" className="text-foreground hover:text-primary transition-colors duration-200">
            Trivia Game
          </Link>
          <Link to="/costume-voting" className="text-foreground hover:text-primary transition-colors duration-200">
            Costume Voting
          </Link>
          <Link to="/props-and-memorabilia" className="text-foreground hover:text-primary transition-colors duration-200">
            Props & Memorabilia
          </Link>
          <Link to="/birthday-messages" className="text-foreground hover:text-primary transition-colors duration-200">
            Birthday Messages
          </Link>
        </nav>
        <div className="text-center mt-6 text-muted-foreground text-sm">© {new Date().getFullYear()} Tom's 50th Birthday Challenge</div>
      </div>
    </footer>
  );
};

export default Footer;
