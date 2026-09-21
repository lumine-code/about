const { CompositeDisposable, Emitter } = require("lumine");
const AboutView = require("./about-view");

module.exports = class About {
  constructor(initialState) {
    this.subscriptions = new CompositeDisposable();
    this.activationSubscriptions = null;
    this.emitter = new Emitter();

    this.state = initialState;
    this.views = {
      aboutView: null,
    };

    this.handleStateChanges();
  }

  activate() {
    if (this.activationSubscriptions) return;
    this.activationSubscriptions = new CompositeDisposable(
      lumine.workspace.addOpener((uriToOpen) => {
        if (uriToOpen === this.state.uri) {
          return this.deserialize();
        }
      }),
      lumine.commands.add("lumine-workspace", "about:view-release-notes", {
        description: "Open the release notes for this version in a browser.",
        didDispatch: () => {
          lumine.shell.openExternal(this.state.updateManager.getReleaseNotesURLForCurrentVersion());
        },
      }),
    );
  }

  destroy() {
    if (this.views.aboutView && !this.views.aboutView.isDestroyed()) {
      this.views.aboutView.destroy();
    }
    this.views.aboutView = null;

    this.setState({ updateManager: null });

    this.activationSubscriptions?.dispose();
    this.activationSubscriptions = null;
    this.subscriptions.dispose();
    this.emitter.dispose();
  }

  setState(newState) {
    if (newState && typeof newState === "object") {
      let { state } = this;
      this.state = Object.assign({}, state, newState);

      this.didChange();
    }
  }

  didChange() {
    this.emitter.emit("did-change");
  }

  onDidChange(callback) {
    return this.emitter.on("did-change", callback);
  }

  deserialize(state) {
    if (!this.views.aboutView || this.views.aboutView.isDestroyed()) {
      this.setState(state);

      this.views.aboutView = new AboutView({
        uri: this.state.uri,
        updateManager: this.state.updateManager,
        currentLumineVersion: this.state.currentLumineVersion,
        currentElectronVersion: this.state.currentElectronVersion,
        currentChromeVersion: this.state.currentChromeVersion,
        currentNodeVersion: this.state.currentNodeVersion,
      });
    }

    return this.views.aboutView;
  }

  handleStateChanges() {
    this.subscriptions.add(
      this.onDidChange(() => {
        if (this.views.aboutView) {
          this.views.aboutView.update({
            updateManager: this.state.updateManager,
            currentLumineVersion: this.state.currentLumineVersion,
            currentElectronVersion: this.state.currentElectronVersion,
            currentChromeVersion: this.state.currentChromeVersion,
            currentNodeVersion: this.state.currentNodeVersion,
          });
        }
      }),
    );
  }
};
