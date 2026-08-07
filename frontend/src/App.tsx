import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { PageTransition } from "./components/motion/PageTransition";
import { ContactContentProvider } from "./lib/site-content-context";
import { Home } from "./pages/Home";
import { OverMij } from "./pages/OverMij";
import { Bestellen } from "./pages/Bestellen";
import { Workshops } from "./pages/Workshops";
import { Contact } from "./pages/Contact";

// Lazy-loaded: keeps the entire /admin dashboard out of the bundle public
// site visitors download — it's only fetched when someone visits /admin.
const AdminApp = lazy(() =>
  import("./admin/AdminApp").then((module) => ({ default: module.AdminApp })),
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/over-mij" element={<PageTransition><OverMij /></PageTransition>} />
        <Route path="/bestellen" element={<PageTransition><Bestellen /></PageTransition>} />
        <Route path="/workshops" element={<PageTransition><Workshops /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function PublicSite() {
  return (
    <ContactContentProvider>
      <div className="flex min-h-screen flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cherry focus:px-4 focus:py-2 focus:text-cream"
        >
          Spring naar de inhoud
        </a>
        <Navbar />
        <main id="content" className="flex-1">
          <AnimatedRoutes />
        </main>
        <Footer />
      </div>
    </ContactContentProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
