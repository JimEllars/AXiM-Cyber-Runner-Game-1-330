export const requestFullscreen = () => {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.warn(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
    });
  } else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
    document.documentElement.webkitRequestFullscreen().catch((err) => {
      console.warn(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
    });
  } else if (document.documentElement.msRequestFullscreen) { /* IE11 */
    document.documentElement.msRequestFullscreen().catch((err) => {
      console.warn(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
    });
  }
};
