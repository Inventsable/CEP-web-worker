<template>
  <Panel>
    <Menus refresh debug />
    <div class="worker-button" @click="testWorker">Test Web Worker</div>
  </Panel>
</template>

<script>
// Important to load worker with following 'worker-loader!' prefix:
import Worker from "worker-loader!./worker.js";

export default {
  data: () => ({
    message: ""
  }),
  components: {
    Panel: require("./Panel.vue").default,
    Menus: require("./Menus.vue").default,
    Button: require("./Button.vue").default
  },
  methods: {
    testMsg() {
      console.log("Hello?");
    },
    testWorker() {
      console.log("Test");
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
      }
    }
  }
};
</script>

<style>
.worker-button {
  border: 1.5px solid var(--color-btn-border);
  border-radius: 6px;
  color: var(--color-default);
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  padding: 6px 12px;
  cursor: pointer;
}

.worker-button:hover {
  background: rgba(160, 160, 160, 0.45);
  border-color: var(--button-primary-border);
}

.worker-button:active {
  background: var(--color-selection);
  border-color: var(--button-primary-border);
  color: var(--color-bg);
}
</style>