import {
  AppBar,
  Box,
  Breadcrumbs,
  Link,
  Toolbar,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { DASHBOARD } from "../constants/route";
import Logo from "./Logo";

export default function MenuBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    navigate(path);
  };

  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <AppBar position="static" elevation={0}>
      <Box
        sx={{
          px: 2,
          background:
            "linear-gradient(to right, #333 5%, rgba(38, 38, 38, 0.5) 100%)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography variant="text" sx={{ flexGrow: 1, p: 0, minWidth: 0 }}>
            <Logo
              color="white"
              width="96px"
              height="38px"
              cursor="pointer"
              onClick={() => handleNavigate(DASHBOARD)}
            />
          </Typography>
        </Toolbar>
      </Box>

      <Box sx={{ color: "white", padding:'0px 8px' }}>
        <Breadcrumbs
          separator="›"
          aria-label="breadcrumb"
          sx={{ "& .MuiLink-root": { color: "#8be9fd", cursor: "pointer" } }}
        >
          <Link onClick={() => handleNavigate(DASHBOARD)}>Dashboard</Link>

          {pathnames.map((value, index) => {
            const to = `/${pathnames.slice(0, index + 1).join("/")}`;
            const isLast = index === pathnames.length - 1;
            return isLast ? (
              <Typography color="#f8f8f2" key={to}>
                {value}
              </Typography>
            ) : (
              <Link key={to} onClick={() => handleNavigate(to)}>
                {value}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Box>
    </AppBar>
  );
}
