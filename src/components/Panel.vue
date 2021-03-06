<template>
  <div class="panel">
    <slot style="overflow:hidden;" />
  </div>
</template>

<script>
// Dynamic identification object that reports all panel and host information:
// https://github.com/Inventsable/CEP-Spy
const spy = window.__adobe_cep__ ? require("cep-spy").default : null;
const fs = require("fs");
const path = require("path");
import starlette from "starlette";

export default {
  props: {
    utils: {
      type: [String, Array],
      default: "./src/host/universal/"
    },
    scriptPath: {
      type: [String, Array],
      default: "./src/host/[appName]"
    },
    exclude: {
      type: [String, Array],
      default: ""
    },
    noUtils: {
      type: Boolean,
      default: false
    },
    app: {
      type: String,
      default: "AEFT"
    },
    theme: {
      type: String,
      default: "gradient"
    },
    gradient: {
      type: String,
      default: ""
    }
  },
  data: () => ({
    validFile: /\.js(x(bin)?|(fl))?$/,
    themeForcer: null,
    debug: false,
    csInterface: null
  }),
  computed: {
    realUtils() {
      return typeof this.utils === "string"
        ? this.sanitizeString(this.utils)
        : this.utils.map(util => {
            this.sanitizeString(util);
          });
    },
    realScriptPath() {
      return typeof this.scriptPath === "string"
        ? this.sanitizeString(this.scriptPath)
        : this.scriptPath.map(script => {
            this.sanitizeString(script);
          });
    },
    noExclusion() {
      return !this.exclude.length;
    },
    realExcludes() {
      if (this.noExclusion) return null;
      return typeof this.exclude === "string"
        ? new RegExp(this.exclude)
        : new RegExp(
            `${this.exclude
              .map(item => {
                return escape(item);
              })
              .join("|")}`
          );
    }
  },
  created() {
    this.csInterface = spy ? new CSInterface() : null;
    window.localStorage.setItem("starletteActive", false);
    // if (spy && spy.appName == "FLPT") {
    // 	window.localStorage.setItem("starletteActive", true);
    // } else if (!spy) window.localStorage.setItem("starletteActive", false);
    if (this.csInterface) starlette.init();

    console.log(window.localStorage.getItem("activeTheme"));
  },
  async mounted() {
    if (spy) {
      console.clear();
      console.log(
        `${spy.extName} ${spy.extVersion} : ${spy.isDev ? "DEV" : "BUILD"}`
      );
    }
    // dont redirect if file dropped
    window.addEventListener(
      "dragover",
      function(e) {
        e = e || event;
        e.preventDefault();
      },
      false
    );
    window.addEventListener(
      "drop",
      function(e) {
        e = e || event;
        e.preventDefault();
      },
      false
    );
    if (window.__adobe_cep__ && !this.debug) {
      await this.loadUtils();
      await this.loadScriptPath();
    }
  },
  methods: {
    parseWebTheme() {
      let app =
        this.app || (this.$route.params && this.$route.params.app)
          ? this.$route.params.app
          : "";
      let theme =
        this.theme || (this.$route.params && this.$route.params.theme)
          ? this.$route.params.theme
          : "";
      let gradient = this.gradient || "";
      if (/\d/.test(theme) && !gradient.length) {
        gradient = +theme >= 100 ? 100 : +theme <= 0 ? 0 : +theme;
        theme = "gradient";
      }
      starlette.initAs(app, theme, gradient);
    },
    removeRelativePrefix(thispath) {
      return /^\.\//.test(thispath) && spy
        ? `${spy.path.root}/${thispath.replace(/^\.\//, "")}`
        : thispath;
    },
    async readDirs(these) {
      let mapped = [];
      for (const item in these) mapped.push(await this.readDir(item));
      return mapped;
    },
    async readDir(thispath) {
      thispath = this.removeRelativePrefix(thispath);
      return new Promise((resolve, reject) => {
        fs.readdir(
          path.resolve(thispath),
          { encoding: "utf-8" },
          (err, files) => {
            if (err) reject(err);
            resolve(files);
          }
        );
      });
    },
    exists(thispath) {
      return fs.existsSync(thispath);
    },
    isFolder(thispath) {
      return fs.lstatSync(thispath).isDirectory();
    },
    async readFiles(these) {
      let mapped = [];
      for (const item in these) mapped.push(await this.readFile(item));
      return mapped;
    },
    async readFile(thispath) {
      thispath = this.removeRelativePrefix(thispath);
      return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(thispath), "utf-8", (err, files) => {
          if (err) reject(err);
          resolve(files);
        });
      });
    },
    loadScript(loadPath) {
      if (!this.noExclusion && this.realExcludes.test(loadPath))
        return console.log(`Excluding ${loadPath}`);

      console.log(`Loading ${loadPath}`);
      // Correctly loads a script regardless of whether Animate or regular CEP app
      if (spy && !/FLPR/.test(spy.appName) && window.__adobe_cep__) {
        // window.__adobe_cep__.evalScript(`$.evalFile('${loadPath}')`)
        this.csInterface.evalScript(`$.evalFile('${loadPath}')`);
      } else if (window.__adobe_cep__)
        this.csInterface.evalScript(
          `fl.runScript(FLfile.platformPathToURI("${loadPath}"))`
        );
    },
    sanitizeString(str) {
      return this.replaceSpyVariables(
        str.replace(/^\.\//, `${spy.path.root}/`).replace(/\/$/, "")
      );
    },
    async loadUtils() {
      return this.noUtils
        ? null
        : typeof this.realUtils === "string"
        ? await this.handlePath(this.realUtils)
        : this.realUtils.forEach(util => {
            this.handlePath(util);
          });
    },
    async loadScriptPath() {
      if (typeof this.realScriptPath === "string") {
        let isFolder = await this.isFolder(this.realScriptPath);
        if (!isFolder) return await this.handlePath(this.realScriptPath);
        else if (this.exists(`${this.realScriptPath}/host.jsx`))
          return await this.handlePath(`${this.realScriptPath}/host.jsx`);
        else throw new Error(`${this.realScriptPath} is a folder, not a file`);
      } else {
        for (const scriptPath in this.realScriptPath) {
          let isFolder = await this.isFolder(scriptPath);
          if (!isFolder) return await this.handlePath(scriptPath);
          else if (this.exists(`${scriptPath}/host.jsx`))
            return await this.handlePath(`${scriptPath}/host.jsx`);
          else throw new Error(`${scriptPath} is a folder, not a file`);
        }
      }
    },
    async handlePath(thispath) {
      return await this.investigatePath(thispath);
    },
    async investigatePath(thispath) {
      let exists = await this.exists(thispath);
      if (!exists)
        return this.noUtils ? null : new Error(`${thispath} does not exist`);
      let isFolder = await this.isFolder(thispath);
      return isFolder
        ? await this.loadFolder(thispath)
        : await this.handleFile(thispath);
    },
    async handleFile(thispath) {
      if (this.validFile.test(thispath)) this.loadScript(thispath);
      else throw new Error(`${thispath} is not a valid scripting file`);
    },
    async loadFolder(thispath) {
      let contents = await this.readDir(thispath);
      contents
        .filter(file => {
          return this.validFile.test(file);
        })
        .forEach(file => {
          this.loadScript(`${thispath}/${file}`);
        });
    },

    replaceSpyVariables(str) {
      Object.keys(spy).forEach(key => {
        let rx = new RegExp(`\\[${key}\\]`);
        if (rx.test(str)) str = str.replace(rx, spy[key]);
      });
      return str;
    },
    consoler(msg) {
      // Catches all console.log() usage in .jsx files via CSEvent
      console.log(`${spy.appName}: ${msg.data}`);
    }
  }
};
</script>

  <style>
/* Various helper styles to match host application's theme */
@import url("https://fonts.googleapis.com/css?family=Open+Sans&display=swap");
:root {
  --quad: cubic-bezier(0.48, 0.04, 0.52, 0.96);
  --quart: cubic-bezier(0.76, 0, 0.24, 1);
  --quint: cubic-bezier(0.84, 0, 0.16, 1);

  background-color: var(--color-bg);
  color: var(--default-color);
  font-family: "Open Sans", sans-serif;
  font-size: 10px;
}
body {
  margin: 0px;
}

.panel {
  position: relative;
  box-sizing: border-box;
  padding: 8px;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}
.fold:first-of-type {
  border-top: solid 1px transparent !important;
}
#app::-webkit-scrollbar {
  display: block;
}
::-webkit-scrollbar {
  background-color: var(--color-scrollbar);
  width: 15px;
}
::-webkit-scrollbar-thumb {
  background: var(--color-scrollbar-thumb);
  border-radius: 15px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-scrollbar-thumb-hover);
}
</style>
