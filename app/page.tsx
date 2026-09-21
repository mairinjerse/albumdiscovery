import AuthButton from "@/components/AuthButton";
import CoverStrip from "@/components/CoverStrip";
import RecommendForm from "@/components/RecommendForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-ink">
      <div className="flex justify-end px-6 pt-6">
        <AuthButton />
      </div>
      <CoverStrip />
      <RecommendForm />
    </main>
  );
}
