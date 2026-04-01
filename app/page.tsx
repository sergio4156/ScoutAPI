import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import CodeExample from "@/components/CodeExample";
import Features from "@/components/Features";
import UseCases from "@/components/UseCases";
import PricingTable from "@/components/PricingTable";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <ProblemSolution />
      <CodeExample />
      <Features />
      <UseCases />
      <PricingTable />
      <FAQ />
      <Footer />
    </main>
  );
}
