import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Services } from "@/components/Services";
import { WhyUs } from "@/components/WhyUs";
import { Showcase } from "@/components/Showcase";
import { About } from "@/components/About";
import { Process } from "@/components/Process";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <Marquee />
        <Services />
        <WhyUs />
        <Showcase />
        <About />
        <Process />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
