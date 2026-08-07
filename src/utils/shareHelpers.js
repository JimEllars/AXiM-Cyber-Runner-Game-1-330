/**
 * Generates sharing URLs and text for social platforms
 */
export const generateShareData = (score, distance) => {
  const text = `I just clocked ${Math.floor(score).toLocaleString()} pts in AXiM Cyber-Runner! 🏃‍♂️💨\n\nTotal distance: ${Math.floor(distance)}m. Can you beat my run in the Neon District?\n\nPlay now: ${window.location.origin}\n\n#AXiM #CyberRunner #Web3Gaming #Arcade`;
  
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