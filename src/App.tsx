
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import CertificateDesigns from "@/pages/CertificateDesigns";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
          <Route path="/certificate-designs" element={<CertificateDesigns />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
