import { Backdrop, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

export default function LoadingLayout({initialState = false}) {
  const location = useLocation();
  const [loading, setLoading] = useState(initialState);

  useEffect(() => {
    let timeout;

    setLoading(true);
    timeout = setTimeout(() => {
      setLoading(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <>
      <Backdrop
        open={loading}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          color: "#333",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Outlet />
    </>
  );
}
