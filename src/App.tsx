import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <main className="grow">
          <Routes>
            {/* Login Page */}
            <Route path="/" element={<LoginPage />} />

            {/* Dashboard */}
            <Route path="/AdminDashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
