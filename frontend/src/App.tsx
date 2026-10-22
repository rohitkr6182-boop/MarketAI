import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Markets from "./pages/Markets";
import GlobalMarkets from "./pages/GlobalMarkets";
import Stock from "./pages/Stock";
import Portfolio from "./pages/Portfolio";
import Watchlist from "./pages/Watchlist";
import NewsPage from "./pages/NewsPage";
import AIAssistant from "./pages/AIAssistant";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/global" element={<GlobalMarkets />} />
          <Route path="/stocks/:ticker" element={<Stock />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/ai" element={<AIAssistant />} />
        </Routes>
      </main>
    </div>
  );
}
