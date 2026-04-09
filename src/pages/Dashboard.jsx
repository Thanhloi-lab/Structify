import BuildIcon from "@mui/icons-material/Build";
import CodeIcon from "@mui/icons-material/Code";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { sendMessageRuntime } from "../apis/internalCall";
import LoadingLayout from "../components/LoadingLayout";
import {
  CONFLUENCE_HELPER,
  SETTINGS,
  TRULIOO_UTILITY,
} from "../constants/route";

const tools = [
  {
    title: "Trulioo Utility",
    description: "Validate & format Trulioo data",
    icon: <BuildIcon sx={{ fontSize: 48, color: "#f57c00" }} />,
    onClick: (callback) => callback(TRULIOO_UTILITY),
    key: "truliooUtility",
  },
  {
    title: "Confluence Page Helper",
    description: "Edit <pre> innerText",
    icon: <CodeIcon sx={{ fontSize: 48, color: "#3f51b5" }} />,
    onClick: (callback) => callback(CONFLUENCE_HELPER),
    key: "confluenceFormatPreElement",
  },
  {
    title: "Settings",
    description: "Edit <pre> innerText",
    icon: <CodeIcon sx={{ fontSize: 48, color: "#868590ff" }} />,
    onClick: (callback) => callback(SETTINGS),
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const { settings, setSettings } = useSettings();

  const handleLoadSettings = () => {
    sendMessageRuntime({ type: "GET_SETTINGS" }, (result, lastError) => {
      if (!mountedRef.current) return;
      if (lastError) {
        setLoading(false);
        return;
      }
      if (result?.settings) {
        setSettings(result.settings);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    handleLoadSettings();
    return () => {
      mountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Box
        sx={{ p: 4, height: "80vh", overflowY: "scroll", overflowX: "hidden" }}
      >
        <Typography variant="h5" gutterBottom padding="0 10px">
          Dev Helper Dashboard
        </Typography>
        <Grid
          container
          spacing={3}
          sx={{
            padding: "10px 10px 40px 10px",
            height: "400px",
            overflowY: "scroll",
          }}
        >
          {tools
            .filter((x) => !x.key || (settings && settings[x.key]))
            .map((tool, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={index}
                sx={{
                  width: "100%",
                }}
              >
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: 3,
                    width: "100%",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "scale(1.02)",
                    },
                  }}
                >
                  <CardActionArea onClick={() => tool.onClick(navigate)}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mb: 2,
                        }}
                      >
                        {tool.icon}
                      </Box>
                      <Typography variant="h6" align="center">
                        {tool.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        {tool.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>
      <LoadingLayout initialState={loading} />
    </>
  );
}
