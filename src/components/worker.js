
// This is the function triggered by the initial worker.postMessage:
onmessage = e => {
  console.log(`Worker started!`, e);
  setTimeout(() => {
    // We use a native postMessage method to communicate back to the panel:
    postMessage('Worker has ended!');
  }, 3000);
};