import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNav from "@/components/layout/BottomNav";
import SplashScreen from "@/components/pwa/SplashScreen";
import OwnerGuard from "@/components/admin/OwnerGuard";
import RoleRouter from "@/components/admin/RoleRouter";
import ErrorBoundary from "@/components/ErrorBoundary";

// Eager: home is the most common landing page
import Index from "./pages/Index";

// Lazy: code-split everything else to keep mobile first paint snappy
const SearchPage = lazy(() => import("./pages/Search"));
const RestaurantDetail = lazy(() => import("./pages/RestaurantDetail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const MapView = lazy(() => import("./pages/MapView"));
const Notifications = lazy(() => import("./pages/Notifications"));
const RestaurantOnboarding = lazy(() => import("./pages/RestaurantOnboarding"));
const RestaurantDashboard = lazy(() => import("./pages/RestaurantDashboard"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminRestaurants = lazy(() => import("./pages/admin/AdminRestaurants"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="animate-spin text-primary" size={24} />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SplashScreen />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <RoleRouter>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/notifications" element={<Notifications />} />
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
              </Suspense>
              <BottomNav />
            </RoleRouter>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
