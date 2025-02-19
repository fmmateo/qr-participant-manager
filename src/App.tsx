
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import ManageParticipants from "@/pages/ManageParticipants";
import ManagePrograms from "@/pages/ManagePrograms";
import Registration from "@/pages/Registration";
import RecordAttendance from "@/pages/RecordAttendance";
import ParticipantList from "@/pages/ParticipantList";
import IssueCertificate from "@/pages/IssueCertificate";
import CertificateTemplates from "@/pages/CertificateTemplates";
import GenerateCertificate from "@/pages/GenerateCertificate";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/participants" element={<ManageParticipants />} />
        <Route path="/programs" element={<ManagePrograms />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/attendance" element={<RecordAttendance />} />
        <Route path="/participant-list" element={<ParticipantList />} />
        <Route path="/certificates" element={<IssueCertificate />} />
        <Route path="/certificate-templates" element={<CertificateTemplates />} />
        <Route path="/certificates/generate" element={<GenerateCertificate />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
