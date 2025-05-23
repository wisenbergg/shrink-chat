export default function PrivacyLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col w-full max-w-2xl p-8 h-80">
        <div className="flex items-center justify-center flex-1 mb-8">
          <div className="w-3/4 h-8 bg-muted rounded-md animate-pulse"></div>
        </div>
        <div className="flex items-center justify-center h-24">
          <div className="w-40 h-10 bg-primary/40 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
