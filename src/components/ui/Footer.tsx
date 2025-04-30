import ProtectedLink from "@/components/ProtectedLink";

const Footer = () => {
  return (
    <footer className="bg-card py-8 mt-auto">
      <div className="container mx-auto px-4">
        <nav className="flex flex-wrap justify-center gap-8">
          <ProtectedLink to="/levels" className="text-foreground hover:text-primary transition-colors duration-200">
            Trivia Game
          </ProtectedLink>
          <ProtectedLink to="/costume-voting" className="text-foreground hover:text-primary transition-colors duration-200">
            Costume Voting
          </ProtectedLink>
          <ProtectedLink to="/props-and-memorabilia" className="text-foreground hover:text-primary transition-colors duration-200">
            Props & Memorabilia
          </ProtectedLink>
          <ProtectedLink to="/birthday-messages" className="text-foreground hover:text-primary transition-colors duration-200">
            Birthday Messages
          </ProtectedLink>
        </nav>
        <div className="text-center mt-6 text-muted-foreground text-sm">© {new Date().getFullYear()} Tom's 50th: The Birthday Paradox</div>
      </div>
    </footer>
  );
};

export default Footer;
