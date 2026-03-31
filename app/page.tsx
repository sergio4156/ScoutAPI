import Hero from "@/components/Hero";
import CodeExample from "@/components/CodeExample";
import Features from "@/components/Features";
import PricingTable from "@/components/PricingTable";

export default function Home() {
  return (
    <main>
      <Hero />
      <CodeExample />
      <Features />
      <PricingTable />
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} ScoutAPI. All rights reserved.
      </footer>
    </main>
  );
}
