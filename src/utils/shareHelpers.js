/**
 * Generates sharing URLs and text for social platforms
 */
export const generateShareData = (score, streakDays) => {
  const text = `I just scored ${Math.floor(score).toLocaleString()} on AXiM Cyber-Runner and hit a ${streakDays} day streak! 🏃‍♂️💨 Can you beat my high score on Arbitrum? ${window.location.origin}`;
  
  return {
    text,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`
  };
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};
export const nativeShare = async (shareData) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'AXiM Cyber-Runner',
        text: shareData.text,
        url: window.location.origin
      });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
      // Fallback on error if share fails (e.g. permission error)
      if (err.name !== 'AbortError') {
         return await copyToClipboard(shareData.text);
      }
      return false;
    }
  } else {
    // Fallback to clipboard
    return await copyToClipboard(shareData.text);
  }
};
