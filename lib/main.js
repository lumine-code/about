const { CompositeDisposable } = require("lumine");

let updateManager;

// The local storage key for the available update version.
const AboutURI = "lumine://about";

function waitForSignal(promise, signal) {
  const source = Promise.resolve(promise);
  if (!signal) return source;
  if (signal.aborted) {
    source.catch(() => {});
    return Promise.reject(signal.reason || new Error("Activation cancelled"));
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    let aborted;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", aborted);
      callback(value);
    };
    aborted = () => finish(reject, signal.reason || new Error("Activation cancelled"));
    signal.addEventListener("abort", aborted, { once: true });
    source.then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error),
    );
  });
}

module.exports = {
  initialize() {
    this.model = undefined;
    this.subscriptions = new CompositeDisposable(
      lumine.workspace.addOpener((uriToOpen) => {
        if (uriToOpen === AboutURI) return this.ensureModel().deserialize();
      }),
      lumine.commands.add("lumine-workspace", "about:view-release-notes", {
        description: "Open the release notes for this version in a browser.",
        didDispatch: () => {
          const model = this.ensureModel();
          lumine.shell.openExternal(
            model.state.updateManager.getReleaseNotesURLForCurrentVersion(),
          );
        },
      }),
    );
  },

  activate(_state, { signal, cause } = {}) {
    signal?.throwIfAborted();

    if (lumine.config.get("about.showOnStartup") && cause?.type !== "workspace-opener") {
      // Open the model directly. Going through the package opener from inside
      // activation would recurse through the opener currently being installed.
      const aboutView = this.ensureModel().deserialize();
      void waitForSignal(lumine.workspace.open(aboutView), signal).catch((error) => {
        if (!signal?.aborted) console.error(`Failed to open About: ${error.message}`);
      });
    }
  },

  deactivate() {
    this.model?.destroy();
    this.model = undefined;

    this.subscriptions?.dispose();
    this.subscriptions = null;

    if (updateManager) {
      updateManager = undefined;
    }
  },

  deserializeAboutView(state) {
    return this.ensureModel().deserialize(state);
  },

  ensureModel() {
    if (this.model) return this.model;
    const UpdateManager = require("./update-manager");
    const About = require("./about");
    const etch = require("@lumine-code/etch");
    // Etch holds its scheduler per copy of the library, and this package
    // resolves its own copy, so point it at the editor view registry before
    // the first About view is rendered.
    etch.setScheduler(lumine.views);
    updateManager = updateManager || new UpdateManager();

    this.model = new About({
      uri: AboutURI,
      currentLumineVersion: lumine.application.getVersion(),
      currentElectronVersion: process.versions.electron,
      currentChromeVersion: process.versions.chrome,
      currentNodeVersion: process.version,
      updateManager: updateManager,
    });
    return this.model;
  },

  createModel() {
    return this.ensureModel();
  },
};
