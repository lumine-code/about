const UpdateManager = require("./update-manager");
const About = require("./about");
const etch = require("@lumine-code/etch");

// Etch holds its scheduler per copy of the library, and this package resolves
// its own copy — so the assignment the editor makes on core's copy never
// reaches it. Point it at the view registry before anything renders, or this
// package's DOM writes land on an animation frame of their own alongside the
// editor's and force a synchronous reflow.
etch.setScheduler(lumine.views);

let updateManager;

// The local storage key for the available update version.
const AboutURI = "lumine://about";

module.exports = {
  async activate() {
    this.createModel();

    if (lumine.config.get("about.showOnStartup")) {
      await lumine.workspace.open(AboutURI);
    }
  },

  deactivate() {
    this.model.destroy();

    if (updateManager) {
      updateManager = undefined;
    }
  },

  deserializeAboutView(state) {
    if (!this.model) {
      this.createModel();
    }

    return this.model.deserialize(state);
  },

  createModel() {
    updateManager = updateManager || new UpdateManager();

    this.model = new About({
      uri: AboutURI,
      currentLumineVersion: lumine.application.getVersion(),
      currentElectronVersion: process.versions.electron,
      currentChromeVersion: process.versions.chrome,
      currentNodeVersion: process.version,
      updateManager: updateManager,
    });
  },
};
