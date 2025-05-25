export default function TalkLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-2xl p-8 flex flex-col h-80">
        <div className="flex items-center justify-center flex-1 mb-8">
          {/* Heart icon placeholder */}
          <div className="w-16 h-16 bg-muted rounded-full animate-pulse mb-6"></div>
        </div>
        <div className="flex flex-col items-center gap-6">
          {/* Title placeholder */}
          <div className="w-80 h-8 bg-muted rounded-md animate-pulse"></div>
          {/* Description placeholder */}
          <div className="w-96 h-6 bg-muted/60 rounded-md animate-pulse"></div>
          <div className="w-72 h-5 bg-muted/40 rounded-md animate-pulse"></div>
          {/* Button placeholder */}
          <div className="w-40 h-12 bg-primary/40 rounded-full animate-pulse mt-4"></div>
        </div>
      </div>
    </div>
  );
}
