// File: src/app/onboarding/talk/page.tsx
import { completeOnboarding, getUserId, getOnboardingProgress } from "@/utils/actions";
import { redirect } from "next/navigation";

export default async function TalkPage() {
  // ensure a user/thread exists
  await getUserId();

  // prevent skipping: require step2 complete
  const progress = await getOnboardingProgress();
  if (!progress?.step2_completed_at) {
    redirect("/onboarding/privacy");
  }

  async function handleComplete() {
    "use server";
    await completeOnboarding();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-2xl p-8 flex flex-col h-80">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl font-medium text-gray-900 text-center animate-fade-in font-freight">
            I&apos;m here to listen, no matter what&apos;s on your mind.
          </p>
        </div>
        <div className="h-24 flex items-center justify-center">
          <form action={handleComplete}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect w-24 h-10"
            >
              Thanks
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
