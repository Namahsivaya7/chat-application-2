import { useEffect } from "react";
import { toast } from "react-toastify";

const NetworkStatus = () => {
  useEffect(() => {
    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        toast.success("🟢 You are online");
      } else {
        toast.error("🔴 You are offline");
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    updateOnlineStatus(); // initial status check

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return null;
};

export default NetworkStatus;
