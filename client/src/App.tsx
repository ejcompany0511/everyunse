import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Analysis from "@/pages/analysis";
import AnalysisDetail from "@/pages/analysis-detail";
import AnalysisDetailEnhanced from "@/pages/analysis-detail-enhanced";
import Contacts from "@/pages/contacts";
import Coaching from "@/pages/coaching";
import Reviews from "@/pages/reviews";
import My from "@/pages/my";
import Profile from "@/pages/profile";

import Coins from "@/pages/coins";
import History from "@/pages/history";
import PaymentSuccess from "@/pages/payment-success";
import PaymentFail from "@/pages/payment-fail";
import PaymentResult from "@/pages/payment-result";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminStatistics from "@/pages/admin-statistics";
import AdminLogs from "@/pages/admin-logs";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Refund from "@/pages/refund";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/analysis/:id">
        {(params) => <AnalysisDetail analysisId={params.id} />}
      </Route>
      <Route path="/analysis/:id/detail">
        {(params) => <AnalysisDetail analysisId={params.id} />}
      </Route>
      <Route path="/contacts" component={Contacts} />
      <Route path="/coaching" component={Coaching} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/my" component={My} />
      <Route path="/profile" component={Profile} />

      <Route path="/coins" component={Coins} />
      <Route path="/history" component={History} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/fail" component={PaymentFail} />
      <Route path="/payment-result" component={PaymentResult} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin-login" component={AdminDashboard} />
      <Route path="/admin/statistics" component={AdminStatistics} />
      <Route path="/admin/logs" component={AdminLogs} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/refund" component={Refund} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
