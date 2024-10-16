export const fetchSession = async (supabase: any) => {
  const { data, error } = await supabase.auth.getSession();

  if (data) {
    return { data: data.session };
  }

  if (error) {
    return { error };
  }

  const response = await supabase.auth.refreshSession();
  if (response.error) {
    return response;
  }

  return { data: response.data?.session, response };
};

export const getDeviceInfo = () => {
  const { userAgent } = navigator;
  const device =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    )
      ? "Mobile"
      : "Desktop";
  const os = navigator.platform;
  const browser = `${navigator.appCodeName} - ${navigator.appName}`;

  return { device, os, browser };
};

export const getRandomInt = (min: number, max: number) => {
  // Đảm bảo rằng giá trị min và max được bao gồm
  min = Math.ceil(min);
  max = Math.floor(max);
  // Sinh ra số ngẫu nhiên trong khoảng từ min (bao gồm) đến max (bao gồm)
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const formatVND = (amount) => {
  if (!amount) return "";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const copyToClipboard = (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    // Use the modern Clipboard API
    return navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Copied to clipboard successfully!");
      })
      .catch((err) => {
        console.error("Failed to copy text to clipboard", err);
      });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      console.log("Copied to clipboard successfully!");
    } catch (err) {
      console.error("Failed to copy text to clipboard", err);
    }
    document.body.removeChild(textArea);
  }
};
