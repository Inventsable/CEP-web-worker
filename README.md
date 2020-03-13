# Using web workers with CEP/Vue-CLI

1) Run `npm install worker-loader` on root

2) In the component which needs to communicate with the worker, must import using worker-loader with syntax similar to:

```html
<script>
// Important to load worker with following 'worker-loader!' prefix:
import Worker from "worker-loader!./worker.js";
// Notice the './worker.js' suffix is pointing to the worker's location relative to this component
```

In ./src/components/HelloWorld.vue, we initialize the worker, post a message to it, and create an event listener for it's response:

```js
testWorker() {
  // If workers are supported
  if (window.Worker) {
    // Initialize worker
    const worker = new Worker();

    // Pass data via .postMessage(), triggers .onMessage inside worker
    worker.postMessage("Passing a string from the panel!");

    // The worker's own postMessage() function will trigger our onmessage handler here:
    worker.onmessage = response => {
      console.log(response);
    };
  } else console.error('Workers are not supported!')
}
```

The contents of ./src/components/worker.js are:

```js
// This is the function triggered by the initial worker.postMessage:
onmessage = e => {
  console.log(`Worker started!`, e);
  setTimeout(() => {
    // We use a native postMessage method to communicate back to the panel:
    postMessage('Worker has ended!');
  }, 3000);
};
```