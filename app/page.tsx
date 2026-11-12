import Preloader from "@/components/Preloader/Preloader";
import GlobalEffects from "@/components/GlobalEffects/GlobalEffects";
import Navbar from "@/components/Navbar/Navbar";
import Hero from "@/components/Hero/Hero";
import Intro from "@/components/Intro/Intro";
import Capabilities from "@/components/Capabilities/Capabilities";
import Numbers from "@/components/Numbers/Numbers";
import Process from "@/components/Process/Process";
import Industries from "@/components/Industries/Industries";
import Quality from "@/components/Quality/Quality";
import Testimonials from "@/components/Testimonials/Testimonials";
import Contact from "@/components/Contact/Contact";
import Footer from "@/components/Footer/Footer";

export default function HomePage() {
  return (
    <>
      <Preloader />
      <GlobalEffects />
      <Navbar />
      <main>
        <Hero />
        <Intro />
        <Capabilities />
        <Numbers />
        <Process />
        <Industries />
        <Quality />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
