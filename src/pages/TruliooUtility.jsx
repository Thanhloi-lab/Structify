/* global chrome */
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import PageSelector from "../components/PageSelector";
import toast from "react-hot-toast";
import { sendMessageToTab } from "../apis/internalCall";

const checkboxOptions = [
  "Update variant",
  "Update credential",
  "Update DSConfig Parameter",
  "Update country",
];

export default function TruliooUtility() {
  const [datasource, setDatasource] = useState({
    datasourceName: "",
    tabId: null,
  });
  const [scriptType, setScriptType] = useState("migration");
  const [checkboxes, setCheckboxes] = useState([]);
  const [errors, setErrors] = useState({});

  const handleCheckboxChange = (label) => {
    if (checkboxes.find((x) => x === label)) {
      setCheckboxes(checkboxes.filter((x) => x !== label));
      return;
    }

    setCheckboxes([...(checkboxes ?? []), label]);
  };

  const handleOpenPreview = () => {
    if (!datasource?.datasourceName) {
      setErrors({ name: "Name cannot be null" });
      return;
    }

    if (!datasource?.tabId) {
      setErrors({ tab: "Tab not found" });
      return;
    }

    let type = scriptType;
    if (type === "get-update-script") {
      if (checkboxes?.length <= 0) {
        setErrors({ submit: "Select at least 1 option" });
        return;
      }

      type = `${type}_${checkboxes.join("/")}`;
    }

    sendMessageToTab({
      tabId: datasource.tabId,
      message: { type, datasourceName: datasource.datasourceName },
      options: { frameId: 0 },
    }, { script: "// Mock Generated C# Script\npublic class MockDatasource\n{\n\tpublic MockDatasource()\n\t{\n\t\t// Local debugging mock data\n\t}\n}" })
      .then((response) => {
        const code = encodeURIComponent(response.script || "// Empty response");
        const lang = "csharp";

        if (!window?.chrome?.windows) {
          window.open(`/dialog.html?code=${code}&lang=${lang}`, "Mock Preview", "width=900,height=700");
        } else {
          window.chrome.windows.create({
            url: window.chrome.runtime.getURL(`dialog.html?code=${code}&lang=${lang}`),
            type: "popup",
            width: 900,
            height: 700,
          });
        }
      })
      .catch((err) => {
        toast.error(`Error: ${err.message}`);
      });

    // chrome.tabs.sendMessage(
    //   datasource.tabId,
    //   { type, datasourceName: datasource.datasourceName },
    //   { frameId: 0 },
    //   (response) => {
    //     if (chrome.runtime.lastError) {
    //       toast.error(`Error: ${chrome.runtime.lastError.message}`);
    //       return;
    //     } else {
    //       let code = encodeURIComponent(response.script);
    //       const lang = "csharp";
    //       chrome.windows.create({
    //         url: chrome.runtime.getURL(`dialog.html?code=${code}&lang=${lang}`),
    //         type: "popup",
    //         width: 900,
    //         height: 700,
    //       });
    //     }
    //   }
    // );
  };

  return (
    <Box sx={{ p: 4, overflowY: "scroll", padding: "20px", height: "500px" }}>
      <Typography variant="h6" gutterBottom>
        Trulioo Utility Tool
      </Typography>

      <PageSelector onSubmit={setDatasource} />
      {errors.tab && <Typography color="error">{errors.tab}</Typography>}

      <TextField
        fullWidth
        label="DatasourceName"
        value={datasource?.datasourceName ?? ""}
        disabled={!datasource?.tabId}
        onChange={(e) =>
          setDatasource({ ...datasource, datasourceName: e.target.value })
        }
        sx={{ mb: 2, marginTop: 4 }}
        InputLabelProps={{ shrink: true }}
      />
      {errors.name && <Typography color="error">{errors.name}</Typography>}

      <RadioGroup
        value={scriptType}
        onChange={(e) => setScriptType(e.target.value)}
        row
      >
        <FormControlLabel
          value="get-migration-script"
          control={<Radio />}
          label="Migration Script"
        />
        <FormControlLabel
          value="get-update-script"
          control={<Radio />}
          label="Update Script"
        />
      </RadioGroup>

      {scriptType === "get-update-script" && (
        <Paper
          elevation={3}
          style={{
            padding: 16,
            margin: "10px 0px",
            width: "auto",
            overflowY: "scroll",
            overflowWrap: "anywhere",
            maxHeight: 400,
          }}
        >
          <FormGroup row>
            {checkboxOptions.map((label) => (
              <FormControlLabel
                key={label}
                control={
                  <Checkbox
                    checked={
                      checkboxes ? Boolean(checkboxes.includes(label)) : false
                    }
                    onChange={() => handleCheckboxChange(label)}
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>
        </Paper>
      )}

      {errors.submit && <Typography color="error">{errors.submit}</Typography>}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={() => handleOpenPreview()}
        >
          Preview
        </Button>
      </Box>
    </Box>
  );
}
