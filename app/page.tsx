import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import { Marquee } from "@/components/Marquee";
import { ProblemSolution } from "@/components/ProblemSolution";
import { Comparison } from "@/components/Comparison";
import { Services } from "@/components/Services";
import { WhyUs } from "@/components/WhyUs";
import { Showcase } from "@/components/Showcase";
import { Regional } from "@/components/Regional";
import { About } from "@/components/About";
import { Process } from "@/components/Process";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { MARQUEE_ITEMS_REGIONAL } from "@/lib/constants";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <TrustBar />
        <Marquee />
        <ProblemSolution />
        <Comparison />
        <Services />
        <WhyUs />
        <Showcase />
        <Marquee
          items={MARQUEE_ITEMS_REGIONAL}
          ariaLabel="Sichtbar in Gütersloh und der Region OWL"
        />
        <Regional />
        <About />
        <Process />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
