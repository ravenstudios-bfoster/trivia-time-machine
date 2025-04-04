const FluxCapacitor = () => {
  return (
    <div className="relative w-32 h-32 mx-auto">
      {/* Main housing */}
      <div className="absolute inset-0 bg-black/80 rounded-lg border-2 border-primary/30 shadow-lg" />

      {/* Center Y shape */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-24 h-24">
          {/* Vertical line */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-16 bg-primary/50 animate-flux-capacitor" />

          {/* Left diagonal */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-12 bg-primary/50 origin-bottom -rotate-45 animate-flux-capacitor" style={{ animationDelay: "0.2s" }} />

          {/* Right diagonal */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-12 bg-primary/50 origin-bottom rotate-45 animate-flux-capacitor" style={{ animationDelay: "0.4s" }} />

          {/* Light points */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary animate-glow" />
          <div className="absolute bottom-0 left-0 w-4 h-4 rounded-full bg-primary animate-glow" style={{ animationDelay: "0.2s" }} />
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-primary animate-glow" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>

      {/* Light effect overlay */}
      <div className="absolute inset-0 bg-primary/5 rounded-lg animate-pulse" />

      {/* Text label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-primary/70 font-mono whitespace-nowrap">FLUX CAPACITOR</div>
    </div>
  );
};

export default FluxCapacitor;
