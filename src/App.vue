<template>
  <div id="app">
    <HelloWorld />
  </div>
</template>

<script>
// Create your own components and import them here
export default {
  name: "app",
  components: {
    HelloWorld: require("./components/HelloWorld.vue").default
  }
};
</script>