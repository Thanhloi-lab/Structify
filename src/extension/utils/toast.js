const colors = {
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
};

function getContainer() {
  let container = document.getElementById("custom-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "custom-toast-container";
    container.style.position = "fixed";
    container.style.top = "1rem";
    container.style.right = "1rem";
    container.style.zIndex = "999999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "0.5rem";
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = "success", duration = 3000) {
  const container = getContainer();
  const toast = document.createElement("div");

  toast.textContent = message;
  toast.style.minWidth = "200px";
  toast.style.maxWidth = "400px";
  toast.style.padding = "10px 16px";
  toast.style.borderRadius = "6px";
  toast.style.color = "#fff";
  toast.style.fontSize = "14px";
  toast.style.fontFamily = "sans-serif";
  toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  toast.style.background = colors[type] || "#333";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.addEventListener(
      "transitionend",
      () => {
        toast.remove();
      },
      { once: true }
    );
  }, duration);
}
