import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNav from "@/components/layout/BottomNav";
import Index from "./pages/Index";
import SearchPage from "./pages/Search";
import RestaurantDetail from "./pages/RestaurantDetail";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import MapView from "./pages/MapView";
import RestaurantOnboarding from "./pages/RestaurantOnboarding";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminUsers from "./pages/admin/AdminUsers";
import NotFound from "./pages/NotFound";
import SplashScreen from "@/components/pwa/SplashScreen";
import OwnerGuard from "@/components/admin/OwnerGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SplashScreen />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/restaurant/onboarding" element={<RestaurantOnboarding />} />
            <Route path="/restaurant/dashboard" element={<OwnerGuard><RestaurantDashboard /></OwnerGuard>} />
            <Route path="/dashboard" element={<OwnerGuard><RestaurantDashboard /></OwnerGuard>} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="restaurants" element={<AdminRestaurants />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
