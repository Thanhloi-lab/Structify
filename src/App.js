import { Toaster } from "react-hot-toast";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import './App.css';
import LoadingLayout from './components/LoadingLayout';
import MenuBar from "./components/MenuBar";
import Dashboard from "./pages/Dashboard";
import SettingsRoutes from "./routes/SettingsRoutes";

function App() {
  return (
    <Router>
      <MenuBar />
      <Routes>
        <Route element={<LoadingLayout />}>
          <Route path="/" element={<Dashboard />} />
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
