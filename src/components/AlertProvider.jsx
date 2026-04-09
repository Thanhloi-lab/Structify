import { Alert, Snackbar } from "@mui/material";
import { createContext, useContext, useState } from "react";

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState({
    open: false,
    severity: "info",
    message: "",
  });

  const showAlert = (message, severity = "info") => {
    setAlert({ open: true, message, severity });
  };

  const handleClose = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={alert.severity} onClose={handleClose} variant="filled">
          {alert.message}
        </Alert>
      </Snackbar>
    </AlertContext.Provider>
  );
}
