import CodeIcon from "@mui/icons-material/Code";
import PestControlIcon from "@mui/icons-material/PestControl";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  SETTINGS_PREVIEW_CODE,
  SETTINGS_TOGGLE_MENU,
  SETTINGS_DEBUG,
} from "../../constants/route";

const tools = [
  {
    title: "Debug",
    icon: <PestControlIcon sx={{ fontSize: 48, color: "#f57c00" }} />,
    onClick: (callback) => callback(SETTINGS_DEBUG),
    key: "truliooUtility",
  },
  {
    title: "Preview code",
    icon: <CodeIcon sx={{ fontSize: 48, color: "#3f51b5" }} />,
    onClick: (callback) => callback(SETTINGS_PREVIEW_CODE),
    key: "confluenceFormatPreElement",
  },
  {
    title: "Toggle settings",
    icon: <ToggleOnIcon sx={{ fontSize: 48, color: "#868590ff" }} />,
    onClick: (callback) => callback(SETTINGS_TOGGLE_MENU),
  },
];

export default function SettingsDashboard() {
  const navigate = useNavigate();

  return (
    <>
      <Box
        sx={{ p: 4, height: "80vh", overflowY: "scroll", overflowX: "hidden" }}
      >
        <Typography variant="h5" gutterBottom padding="0 10px">
          Setting dashboard
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
          {tools.map((tool, index) => (
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
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
}
