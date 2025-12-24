import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Contexts
import { AuthProvider } from "@/contexts/AuthProvider";
import { TenantProvider } from "@/contexts/TenantProvider";

// Route Guards
import StudentRoute from "@/components/routes/StudentRoute";

// Public Pages
import TenantHome from "@/themes/coaching/theme1/TenantHome"; // Adjust path if needed
import Login from "@/pages/Login"; // Adjust path if needed
import Signup from "@/pages/Signup"; // Adjust path if needed

// Dashboard Pages (Import your actual components here)
// import StudentDashboard from "@/pages/student/StudentDashboard"; 
// import EducatorDashboard from "@/pages/educator/Dashboard";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                
                {/* --- PUBLIC ROUTES (Open to Everyone) --- */}
                <Route path="/" element={<TenantHome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* --- PROTECTED STUDENT ROUTES --- */}
                {/* Checks: Logged In + Role=Student + Enrolled in THIS Tenant */}
                <Route path="/student" element={<StudentRoute />}>
                    {/* Replace this div with <StudentDashboard /> */}
                    <Route path="dashboard" element={<div>Student Dashboard (Protected)</div>} />
                    
                    {/* Add other student routes here */}
                    {/* <Route path="courses" element={<MyCourses />} /> */}
                </Route>

                {/* --- PROTECTED EDUCATOR ROUTES --- */}
                {/* You can create an EducatorRoute.tsx later following the same pattern */}
                <Route path="/dashboard" element={<div>Educator Dashboard</div>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

