const isLocal = () => process.env.NODE_ENV === "development" || !window?.chrome?.tabs || !window?.chrome?.runtime;

export function getTabs(setTabs, setSelectedTabId) {
  if (isLocal()) {
    const mockTabs = [
      {
        id: 1,
        title: "Mock JIRA issue",
        url: "https://trulioo.atlassian.net/browse/ABC-123",
        shouldReload: false,
      },
    ];
    setTabs(mockTabs);
    setSelectedTabId(mockTabs[0]?.id ?? null);
    return;
  }

  window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const filteredTabs = [];
    let processed = 0;

    tabs.forEach((tab) => {
      // Skip tabs without URL or invalid protocol
      if (!tab.url?.startsWith("https://trulioo.atlassian.net/")) {
        processed++;
        return;
      }

      // Try pinging the content script
      window.chrome.tabs.sendMessage(tab.id, { type: "ping" }, (response) => {
        filteredTabs.push({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          shouldReload: window.chrome.runtime.lastError || response !== "pong",
        });

        processed++;
        if (processed === tabs.length) {
          setTabs(filteredTabs);
          if (filteredTabs.length > 0) {
            setSelectedTabId(
              filteredTabs.filter((x) => !x.shouldReload)?.[0]?.id
            );
          }
        }
      });
    });
  });
}

export function getTab(setTabId) {
  if (isLocal()) {
    setTabId(null);
    return;
  }

  window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    setTabId(tabs?.[0]?.id ?? null);
  });
}

export function sendMessageToTab({ tabId, message, options = {} }, defaultValue) {
  if (isLocal()) {
    return Promise.resolve(defaultValue ?? []);
  }

  return new Promise((resolve, reject) => {
    window.chrome.tabs.sendMessage(tabId, message, options, (response) => {
      if (window.chrome.runtime.lastError) {
        reject(new Error(window.chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

export function sendMessageRuntime(message, callback, defaultValue) {
  if (isLocal()) {
    if (typeof callback === "function") {
      callback(defaultValue);
    }
    return;
  }

  if (!window.chrome?.runtime?.sendMessage) {
    console.error("chrome.runtime.sendMessage is not available");
    return;
  }

  window.chrome.runtime.sendMessage(message, (result) => {
    const lastError = window.chrome.runtime.lastError;
    if (typeof callback === "function") {
      callback(result, lastError);
    }
  });
}

export function addListener(onMsg) {
  if (isLocal() || !window.chrome?.runtime?.onMessage) {
    return;
  }
  window.chrome.runtime.onMessage.addListener(onMsg)
}

export function removeListener(onMsg) {
  if (isLocal() || !window.chrome?.runtime?.onMessage) {
    return;
  }
  window.chrome.runtime.onMessage.removeListener(onMsg)
}