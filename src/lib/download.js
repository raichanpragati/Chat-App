export const download = (link, filename) => {
  const xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.onload = (event) => {
    const blob = event.target.response; // Get the downloaded blob

    // Handle the downloaded blob here
    // For example:
    // - Create a downloadable link:
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename; // Set a filename
    link.click();
    window.URL.revokeObjectURL(url); // Clean up the temporary URL

    // - Or save the file locally (requires additional libraries or server-side logic):
    //   - Use a library like FileSaver.js to save the blob locally.
  };
  xhr.open("GET", link);
  xhr.send();
};
