import { Toaster } from "react-hot-toast";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import './App.css';
import LoadingLayout from './components/LoadingLayout';
import MenuBar from "./components/MenuBar";
import ConfluenceHelper from "./pages/ConfluenceHelper";
import Dashboard from "./pages/Dashboard";
import TruliooUtility from "./pages/TruliooUtility";
import SettingsRoutes from "./routes/SettingsRoutes";

function App() {
  return (
    <Router>
      <MenuBar />
      <Routes>
        <Route element={<LoadingLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trulioo" element={<TruliooUtility />} />
          <Route path="/confluenceHelper" element={<ConfluenceHelper />} />
          {SettingsRoutes}
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "14px",
            background: "#333",
            color: "#fff",
          },
        }}
      />
    </Router>
  );
}

export default App;
