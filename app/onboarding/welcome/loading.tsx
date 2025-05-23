export default function WelcomeLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col w-full max-w-2xl p-8 h-80">
        <div className="flex items-center justify-center flex-1">
          <div className="w-3/4 h-8 bg-muted rounded-md animate-pulse"></div>
        </div>
        <div className="flex items-center justify-center h-24">
          <div className="w-24 h-10 bg-primary/40 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
