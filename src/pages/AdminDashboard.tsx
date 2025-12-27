import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import DashboardView from "../components/DashboardView";
import ContactsView from "../components/ContactsView";
import ProjectsView from "../components/ProjectsView";
import ServicesView from "../components/ServicesView";
import TestimonialsView from "../components/TestimonialsView";
import ContactModal from "../components/ContactModal";
import {
  Contact,
  Project,
  Service,
  Testimonial,
  DashboardStats,
  ViewType,
} from "../types";

interface RawContact {
  id: number;
  reference_number: string;
  full_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  service_interest: string | null;
  project_budget: string | null;
  project_timeline: string | null;
  message: string;
  how_heard: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    newInquiries: 0,
    activeProjects: 0,
    conversionRate: 0,
  });

  // -----------------------------------------
  // LOGOUT HANDLER
  // -----------------------------------------
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/");
  };

  // -----------------------------------------
  // SAFE EXTRACTOR (fixes undefined data errors)
  // -----------------------------------------
  const safe = <T,>(res: { data?: { data?: T[] } }): T[] =>
    Array.isArray(res?.data?.data) ? (res.data.data as T[]) : [];

  // -----------------------------------------
  // FETCH ALL DATA
  // -----------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        const [contactsRes, projectsRes, servicesRes, testimonialsRes] =
          await Promise.all([
            axios.get("http://api.accian.co.uk/admin/contacts", { headers }),
            axios.get("http://api.accian.co.uk/admin/projects", { headers }),
            axios.get("http://api.accian.co.uk/admin/services", { headers }),
            axios.get("http://api.accian.co.uk/admin/testimonials", {
              headers,
            }),
          ]);

        // ========== DEBUG LOGGING ==========
        console.log("🔍 RAW API RESPONSE:", contactsRes.data);
        console.log("🔍 FIRST CONTACT RAW:", contactsRes.data.data?.[0]);
        // ===================================

        // SAFE extraction
        const contactList: Contact[] = contactsRes.data.data.map(
          (c: RawContact) => ({
            id: c.id.toString(),
            fullName: c.full_name || "",
            email: c.email,
            company: c.company_name || "",
            phone: c.phone || "",
            service: c.service_interest || "",
            budget: c.project_budget || "",
            timeline: c.project_timeline || "",
            message: c.message || "",
            hearAbout: c.how_heard || "",
            status:
              c.status === "new"
                ? "New"
                : c.status === "contacted"
                ? "Contacted"
                : c.status === "in_progress"
                ? "In Progress"
                : c.status === "converted"
                ? "Converted"
                : "Closed",
            createdAt: c.created_at,
            lastUpdated: c.updated_at,
          })
        );

        // ========== DEBUG LOGGING ==========
        console.log("🔍 AFTER SAFE EXTRACTION:", contactList[0]);
        if (contactList[0]) {
          console.log("🔍 Company:", contactList[0].company);
          console.log("🔍 Service:", contactList[0].service);
          console.log("🔍 All keys:", Object.keys(contactList[0]));
        }
        // ===================================

        const projectList = safe<Project>(projectsRes);
        const serviceList = safe<Service>(servicesRes);
        const testimonialList = safe<Testimonial>(testimonialsRes);

        setContacts(contactList);
        setProjects(projectList);
        setServices(serviceList);
        setTestimonials(testimonialList);

        // Stats
        const newInquiries: number = contactList.filter(
          (c: Contact) => c.status === "New"
        ).length;
        const converted = contactList.filter(
          (c) => c.status === "Converted"
        ).length;

        const conversionRate =
          contactList.length > 0
            ? Math.round((converted / contactList.length) * 100)
            : 0;

        setStats({
          totalContacts: contactList.length,
          newInquiries,
          activeProjects: projectList.filter((p) => p.status === "Published")
            .length,
          conversionRate,
        });

        setLoading(false);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.error(
            "🔥 FETCH DATA ERROR:",
            err.response?.data || err.message
          );
        } else {
          console.error("🔥 FETCH DATA ERROR:", err);
        }
        alert("Session expired or server error. Please login again.");
        handleLogout();
      }
    };

    fetchData();
  }, [navigate]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  // -----------------------------------------
  // CONTACT HANDLERS
  // -----------------------------------------
  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (id: string, status: Contact["status"]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return handleLogout();

      await axios.patch(
        `http://api.accian.co.uk/admin/contacts/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setContacts((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status, lastUpdated: new Date().toISOString() }
            : c
        )
      );

      if (selectedContact?.id === id) {
        setSelectedContact((prev) => (prev ? { ...prev, status } : null));
      }

      const updatedContacts = contacts.map((c) =>
        c.id === id ? { ...c, status } : c
      );

      const newInquiries = updatedContacts.filter(
        (c) => c.status === "New"
      ).length;

      const converted = updatedContacts.filter(
        (c) => c.status === "Converted"
      ).length;

      const conversionRate =
        updatedContacts.length > 0
          ? Math.round((converted / updatedContacts.length) * 100)
          : 0;

      setStats((prev) => ({
        ...prev,
        newInquiries,
        conversionRate,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Please try again.");
    }
  };

  // -----------------------------------------
  // PROJECT HANDLERS
  // -----------------------------------------
  const handleAddProject = async (projectData: Omit<Project, "id">) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return handleLogout();

      const res = await axios.post(
        "http://api.accian.co.uk/admin/projects",
        projectData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add the new project returned from backend
      setProjects((prev) => [res.data.data, ...prev]);
    } catch (err) {
      console.error("Add Project Error:", err);
      alert("Failed to add project.");
    }
  };

  const handleUpdateProject = async (
    id: string,
    projectData: Omit<Project, "id">
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return handleLogout();

      const res = await axios.put(
        `http://api.accian.co.uk/admin/projects/${id}`,
        projectData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProjects((prev) => prev.map((p) => (p.id === id ? res.data.data : p)));
    } catch (err) {
      console.error("Update Project Error:", err);
      alert("Failed to update project.");
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      if (!confirm("Are you sure you want to delete this project?")) return;

      const token = localStorage.getItem("adminToken");
      if (!token) return handleLogout();

      await axios.delete(`http://api.accian.co.uk/admin/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete Project Error:", err);
      alert("Failed to delete project.");
    }
  };

  // -----------------------------------------
  // SERVICE HANDLERS
  // -----------------------------------------

  const handleAddService = async (serviceData: Omit<Service, "id">) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return handleLogout();

      const res = await axios.post(
        "http://api.accian.co.uk/admin/services",
        serviceData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setServices((prev) => [res.data.data, ...prev]);
    } catch (err) {
      console.error("Add Service Error:", err);
      alert("Failed to add service.");
    }
  };

  const handleUpdateService = async (
    id: string,
    serviceData: Omit<Service, "id">
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return handleLogout();

      const res = await axios.put(
        `http://api.accian.co.uk/admin/services/${id}`,
        serviceData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setServices((prev) =>
        prev.map((p) => (p.id === Number(id) ? res.data.data : p))
      );
    } catch (err) {
      console.error("Update Project Error:", err);
      alert("Failed to update project.");
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      if (!confirm("Are you sure you want to delete this project?")) return;

      const token = localStorage.getItem("adminToken");
      if (!token) return handleLogout();

      await axios.delete(`http://api.accian.co.uk/admin/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setServices((prev) => prev.filter((p) => p.id !== Number(id)));
    } catch (err) {
      console.error("Delete Project Error:", err);
      alert("Failed to delete project.");
    }
  };

  // -----------------------------------------
  // TESTIMONIAL HANDLERS
  // -----------------------------------------
  const handleAddTestimonial = async (
    testimonialData: Omit<Testimonial, "id">
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return handleLogout();

      const res = await axios.post(
        "http://api.accian.co.uk/admin/testimonials",
        testimonialData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTestimonials((prev) => [res.data.data, ...prev]);
    } catch (err) {
      console.error("Add Service Error:", err);
      alert("Failed to add service.");
    }
  };

  const handleUpdateTestimonial = async (
    id: string,
    testimonialData: Omit<Testimonial, "id">
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return handleLogout();

      const res = await axios.put(
        `http://api,accian.co.uk/admin/testimonials/${id}`,
        testimonialData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTestimonials((prev) =>
        prev.map((p) => (p.id === id ? res.data.data : p))
      );
    } catch (err) {
      console.error("Update Project Error:", err);
      alert("Failed to update project.");
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      if (!confirm("Are you sure you want to delete this project?")) return;

      const token = localStorage.getItem("adminToken");
      if (!token) return handleLogout();

      await axios.delete(`http://api.accian.co.uk/admin/testimonials/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTestimonials((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete Project Error:", err);
      alert("Failed to delete project.");
    }
  };

  // -----------------------------------------
  // HEADER TITLES
  // -----------------------------------------
  const getViewTitle = () => {
    switch (currentView) {
      case "dashboard":
        return "Dashboard";
      case "contacts":
        return "Contact Management";
      case "projects":
        return "Portfolio Projects";
      case "services":
        return "Service Offerings";
      case "testimonials":
        return "Client Testimonials";
      default:
        return "Dashboard";
    }
  };

  const getViewSubtitle = () => {
    switch (currentView) {
      case "dashboard":
        return "Overview of your business metrics and recent activities";
      case "contacts":
        return "Manage and track all client inquiries and leads";
      case "projects":
        return "Showcase your completed and ongoing projects";
      case "services":
        return "Manage your service catalog and offerings";
      case "testimonials":
        return "Collect and showcase client feedback";
      default:
        return "";
    }
  };

  // -----------------------------------------
  // UI
  // -----------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        newInquiriesCount={stats.newInquiries}
        onLogout={handleLogout}
      />

      <div className="flex-1 lg:ml-0">
        <Header title={getViewTitle()} subtitle={getViewSubtitle()} />

        <main className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentView === "dashboard" && (
                <DashboardView
                  stats={stats}
                  recentContacts={contacts}
                  onViewContact={handleViewContact}
                  loading={loading}
                />
              )}

              {currentView === "contacts" && (
                <ContactsView
                  contacts={contacts}
                  onViewContact={handleViewContact}
                  onUpdateStatus={handleUpdateStatus}
                  loading={loading}
                />
              )}

              {currentView === "projects" && (
                <ProjectsView
                  projects={projects}
                  onAdd={handleAddProject}
                  onUpdate={handleUpdateProject}
                  onDelete={handleDeleteProject}
                  loading={loading}
                />
              )}

              {currentView === "services" && (
                <ServicesView
                  services={services}
                  onAdd={handleAddService}
                  onUpdate={handleUpdateService}
                  onDelete={handleDeleteService}
                  loading={loading}
                />
              )}

              {currentView === "testimonials" && (
                <TestimonialsView
                  testimonials={testimonials}
                  onAdd={handleAddTestimonial}
                  onUpdate={handleUpdateTestimonial}
                  onDelete={handleDeleteTestimonial}
                  loading={loading}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ContactModal
        contact={selectedContact}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}

export default AdminDashboard;
