// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "@/pages/Layout.jsx";
import Home from "@/pages/Home";
import Welcome from "@/pages/Welcome.jsx";
import Schools from "@/pages/Schools";
import ProgramsPage from "@/pages/Programs";
import Dashboard from "@/pages/Dashboard";
import ComparePrograms from "@/pages/ComparePrograms";
import ProgramDetail from "@/pages/ProgramDetail";
import About from "@/pages/About";
import StudentLife from "@/pages/StudentLife";
import EventsPage from "@/pages/Events";
import Blog from "@/pages/Blog";
import Partnership from "./pages/Partnership";
import FAQ from "./pages/FAQ";
import ContactPage from "./pages/Contact";
import Resources from "./pages/Resources";
import OurTeam from "./pages/OurTeam";
import EventDetails from "./pages/EventDetails";
import EventRegistrationPage from "./pages/EventRegistration";
import Onboarding from "./pages/Onboarding";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Index route → Home */}
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="welcome" element={<Welcome />} />
        <Route path="schools" element={<Schools />} />
        <Route path="programs" element={<ProgramsPage />} />
        <Route path="compareprograms" element={<ComparePrograms />} />
        <Route path="programsDetail" element={<ProgramDetail />} />
        <Route path="about" element={<About />} />
        <Route path="studentlife" element={<StudentLife />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="blog" element={<Blog />} />
        <Route path="partnership" element={<Partnership />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="contact" element={<ContactPage />} />  
        <Route path="resources" element={<Resources />} />
        <Route path="ourteam" element={<OurTeam />} />
        <Route path="eventdetails" element={<EventDetails />} />
        <Route path="eventregistration" element={<EventRegistrationPage />} />
        {/* Private routes */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="onboarding" element={<Onboarding />} />
      </Route>
    </Routes>
  );
}
