import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { SettingsProvider } from '@/contexts/SettingsContext'; // IMPORTUL PENTRU SETARI
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import NewClient from "./pages/NewClient";
import Policies from "./pages/Policies";
import PolicyDetail from "./pages/PolicyDetail";
import NewPolicy from "./pages/NewPolicy";
import Offers from "./pages/Offers";
import Commissions from "./pages/Commissions";
import Renewals from "./pages/Renewals";
import Products from "./pages/Products";
import Insurers from "./pages/Insurers";
import Brokers from "./pages/Brokers";
import Reports from "./pages/Reports";
import Checkout from "./pages/Checkout";
import OfferDetail from "./pages/OfferDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            {/* AM ADAUGAT SETTINGS PROVIDER AICI CA SA FIE DISPONIBIL IN TOATA APLICATIA */}
            <SettingsProvider>
              <DataProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* Protected routes */}
                  <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />

                  {/* Client routes */}
                  <Route path="/clients" element={<ProtectedRoute><MainLayout><Clients /></MainLayout></ProtectedRoute>} />
                  <Route path="/clients/:id" element={<ProtectedRoute><MainLayout><ClientDetail /></MainLayout></ProtectedRoute>} />
                  <Route path="/new-client" element={<ProtectedRoute><MainLayout><NewClient /></MainLayout></ProtectedRoute>} />

                  {/* Policy routes */}
                  <Route path="/policies" element={<ProtectedRoute><MainLayout><Policies /></MainLayout></ProtectedRoute>} />
                  <Route path="/policies/:id" element={<ProtectedRoute><MainLayout><PolicyDetail /></MainLayout></ProtectedRoute>} />
                  <Route path="/new-policy" element={<ProtectedRoute><MainLayout><NewPolicy /></MainLayout></ProtectedRoute>} />

                  {/* Offers and Checkout */}
                  <Route path="/offers" element={<ProtectedRoute><MainLayout><Offers /></MainLayout></ProtectedRoute>} />
                  <Route path="/offers/:id" element={<ProtectedRoute><MainLayout><OfferDetail /></MainLayout></ProtectedRoute>} />
                  <Route path="/checkout/:id" element={<ProtectedRoute><MainLayout><Checkout /></MainLayout></ProtectedRoute>} />

                  {/* Reports */}
                  <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />

                  {/* Commissions */}
                  <Route path="/commissions" element={<ProtectedRoute><MainLayout><Commissions /></MainLayout></ProtectedRoute>} />

                  {/* Renewals */}
                  <Route path="/renewals" element={<ProtectedRoute><MainLayout><Renewals /></MainLayout></ProtectedRoute>} />

                  {/* Admin only routes */}
                  <Route path="/products" element={<ProtectedRoute allowedRoles={['ADMINISTRATOR']}><MainLayout><Products /></MainLayout></ProtectedRoute>} />
                  <Route path="/insurers" element={<ProtectedRoute allowedRoles={['ADMINISTRATOR']}><MainLayout><Insurers /></MainLayout></ProtectedRoute>} />

                  {/* Broker management (Admin + Manager) */}
                  <Route path="/brokers" element={<ProtectedRoute allowedRoles={['ADMINISTRATOR', 'BROKER_MANAGER']}><MainLayout><Brokers /></MainLayout></ProtectedRoute>} />

                  {/* Settings */}
                  <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DataProvider>
            </SettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;