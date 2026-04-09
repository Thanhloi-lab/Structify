import { useState } from "react";
import {
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Paper,
  Box,
} from "@mui/material";
import LoadingLayout from "./LoadingLayout";
import toast from "react-hot-toast";
import { getTabs, sendMessageToTab } from "../apis/internalCall";

export default function PageSelector({ onSubmit }) {
  const [tabs, setTabs] = useState([]);
  const [selectedTabId, setSelectedTabId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetTabs = () => {
    getTabs(setTabs, setSelectedTabId);
    // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //   const filteredTabs = [];
    //   let processed = 0;

    //   tabs.forEach((tab) => {
    //     // Skip tabs without URL or invalid protocol
    //     if (!tab.url?.startsWith("https://trulioo.atlassian.net/")) {
    //       processed++;
    //       return;
    //     }

    //     // Try pinging the content script
    //     chrome.tabs.sendMessage(tab.id, { type: "ping" }, (response) => {
    //       filteredTabs.push({
    //         id: tab.id,
    //         title: tab.title,
    //         url: tab.url,
    //         shouldReload: chrome.runtime.lastError || response !== "pong",
    //       });

    //       processed++;
    //       if (processed === tabs.length) {
    //         setTabs(filteredTabs);
    //         if (filteredTabs.length > 0) {
    //           setSelectedTabId(
    //             filteredTabs.filter((x) => !x.shouldReload)?.[0]?.id
    //           );
    //         }
    //       }
    //     });
    //   });
    // });
  };

  const handleGetHtml = () => {
    if (!selectedTabId) {
      toast.error("Select a tab");
      return;
    }

    return sendMessageToTab(
      {
        tabId: selectedTabId,
        message: { type: "get-html" },
        options: { frameId: 0 },
      },
      { datasourceName: "sample" }
    )
      .then((response) => {
        if (!response.datasourceName) {
          toast.error(`Error: Cannot find datasource's name`);
          return;
        }

        onSubmit({
          datasourceName: response.datasourceName,
          tabId: selectedTabId,
        });
      })
      .catch((err) => {
        toast.error(`Error: ${err.message}`);
      });
  };

  return (
    <>
      <Box>
        <Button variant="contained" onClick={handleGetTabs}>
          Load Tabs
        </Button>

        {tabs.length > 0 && (
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
            <FormControl component="fieldset">
              <Typography variant="subtitle1" gutterBottom>
                Chọn một tab:
              </Typography>
              <RadioGroup
                value={selectedTabId}
                onChange={(e) => setSelectedTabId(Number(e.target.value))}
              >
                {tabs.map((tab) => (
                  <FormControlLabel
                    key={tab.id}
                    value={tab.id}
                    disabled={tab.shouldReload}
                    control={<Radio />}
                    sx={{ padding: "10px 0" }}
                    label={
                      <span>
                        <strong style={{ color: "red" }}>
                          {tab.shouldReload ? "[Should reload]" : ""}
                        </strong>
                        <strong>{tab.title}</strong>
                      </span>
                    }
                  />
                ))}
              </RadioGroup>

              <Button
                variant="outlined"
                color="primary"
                onClick={async () => {
                  setLoading(true);
                  handleGetHtml();
                  setLoading(false);
                }}
                style={{ marginTop: 8 }}
              >
                Load content
              </Button>
            </FormControl>
          </Paper>
        )}
      </Box>
      <LoadingLayout initialState={loading} />
    </>
  );
}
