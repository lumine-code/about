const { Disposable } = require("lumine");
const etch = require("@lumine-code/etch");
const path = require("path");
const { pathToFileURL } = require("url");
const EtchComponent = require("./etch-component");

const $ = etch.dom;

// The same normal/safe/dev mark src/lumine-window.js picks for the window and
// dock icon, and title-bar picks for its own logo, so every surface agrees.
// Pulled out as its own pure function so it is testable without faking
// lumine.window.isDevMode()/lumine.window.isSafeMode() at the global level.
function resolveLogoFile({ safeMode, devMode }) {
  if (safeMode) return "lumine-safe.svg";
  if (devMode) return "lumine-dev.svg";
  return "lumine.svg";
}

module.exports = class AboutView extends EtchComponent {
  handleLumineVersionClick(e) {
    e.preventDefault();
    lumine.clipboard.write(this.props.currentLumineVersion);
  }

  handleElectronVersionClick(e) {
    e.preventDefault();
    lumine.clipboard.write(this.props.currentElectronVersion);
  }

  handleChromeVersionClick(e) {
    e.preventDefault();
    lumine.clipboard.write(this.props.currentChromeVersion);
  }

  handleNodeVersionClick(e) {
    e.preventDefault();
    lumine.clipboard.write(this.props.currentNodeVersion);
  }

  handleReleaseNotesClick(e) {
    e.preventDefault();
    lumine.shell.openExternal(this.props.updateManager.getReleaseNotesURLForCurrentVersion());
  }

  handleLicenseClick(e) {
    e.preventDefault();
    lumine.commands.dispatch(lumine.views.getView(lumine.workspace), "application:open-license");
  }

  handleDocumentationClick(e) {
    e.preventDefault();
    lumine.commands.dispatch(
      lumine.views.getView(lumine.workspace),
      "application:open-documentation",
    );
  }

  executeUpdateAction(e) {
    e.preventDefault();
    lumine.commands.dispatch(
      lumine.views.getView(lumine.workspace),
      "lumine-updater:check-for-update",
    );
  }

  handleShowOnStartupChange(e) {
    lumine.config.set("about.showOnStartup", e.target.checked);
  }

  render() {
    return $.div(
      { className: "pane-item native-key-bindings about" },
      $.div(
        { className: "about-container min-width-min-content" },
        $.header(
          { className: "about-header" },
          $.a(
            { className: "about-homepage", href: `${lumine.branding.urlWeb}` },
            $.img({
              className: "about-logo",
              src: pathToFileURL(
                path.join(
                  lumine.app.getResourcePath(),
                  "resources",
                  "app-icons",
                  resolveLogoFile({
                    safeMode: lumine.window.isSafeMode(),
                    devMode: lumine.window.isDevMode(),
                  }),
                ),
              ).href,
              alt: "",
              width: 128,
              height: 128,
            }),
          ),
          $.h1({ className: "about-title" }, `${lumine.branding.name}`),
          $.div(
            { className: "about-subtitle" },
            "A modern, extensible text editor built on the Pulsar and Atom legacy.",
          ),
          $.div(
            { className: "about-header-info" },
            $.span(
              {
                className: "about-version-container lumine",
                onclick: this.handleLumineVersionClick.bind(this),
              },
              $.span(
                { className: "about-version" },
                `Lumine: ${this.props.currentLumineVersion} ${process.arch}`,
              ),
              $.span({ className: "icon icon-clippy about-copy-version" }),
            ),
            $.span(
              {
                className: "about-version-container electron",
                onclick: this.handleElectronVersionClick.bind(this),
              },
              $.span(
                { className: "about-version" },
                `Electron: ${this.props.currentElectronVersion}`,
              ),
              $.span({ className: "icon icon-clippy about-copy-version" }),
            ),
            $.span(
              {
                className: "about-version-container chrome",
                onclick: this.handleChromeVersionClick.bind(this),
              },
              $.span({ className: "about-version" }, `Chrome: ${this.props.currentChromeVersion}`),
              $.span({ className: "icon icon-clippy about-copy-version" }),
            ),
            $.span(
              {
                className: "about-version-container node",
                onclick: this.handleNodeVersionClick.bind(this),
              },
              $.span({ className: "about-version" }, `Node: ${this.props.currentNodeVersion}`),
              $.span({ className: "icon icon-clippy about-copy-version" }),
            ),
          ),
        ),
      ),

      $.div(
        { className: "about-actions group-start min-width-min-content" },
        $.div(
          { className: "btn-group" },
          $.button(
            {
              className: "btn view-license",
              onclick: this.handleLicenseClick.bind(this),
            },
            "License",
          ),
          $.button(
            {
              className: "btn about-documentation-button",
              onclick: this.handleDocumentationClick.bind(this),
            },
            "Documentation",
          ),
          $.button(
            {
              className: "btn about-release-notes-button",
              onclick: this.handleReleaseNotesClick.bind(this),
            },
            "Release Notes",
          ),
          this.renderUpdateChecker(),
        ),
      ),

      $.div(
        { className: "about-love group-start" },
        $.a({ className: "icon icon-pulse" }),
        $.span({ className: "about-team-text" }, "Made by Lumine Team"),
        $.a({ className: "icon icon-pulse" }),
      ),

      $.div(
        { className: "about-startup" },
        $.label(
          { className: "about-startup-label" },
          $.input({
            className: "input-checkbox",
            type: "checkbox",
            checked: lumine.config.get("about.showOnStartup"),
            onchange: this.handleShowOnStartupChange.bind(this),
          }),
          " Show when opening Lumine",
        ),
      ),
    );
  }

  renderUpdateChecker() {
    if (lumine.packages.isPackageDisabled("lumine-updater")) {
      return $.div(
        { className: "about-updates-item app-unsupported" },
        $.span(
          { className: "about-updates-label is-strong" },
          "Enable `lumine-updater` to check for updates",
        ),
      );
    } else {
      return $.button(
        {
          className: "btn about-update-action-button",
          onclick: this.executeUpdateAction.bind(this),
        },
        "Check for updates",
      );
    }
  }

  serialize() {
    return {
      deserializer: this.constructor.name,
      uri: this.props.uri,
    };
  }

  getURI() {
    return this.props.uri;
  }

  destroy() {
    this.destroyed = true;
    super.destroy();
  }

  isDestroyed() {
    return this.destroyed === true;
  }

  onDidChangeTitle() {
    return new Disposable();
  }

  onDidChangeModified() {
    return new Disposable();
  }

  getTitle() {
    return "About";
  }

  getIconName() {
    return "info";
  }
};

// Attached rather than a second named export -- lib/about.js requires this
// module expecting the class itself, and this keeps that call unchanged.
module.exports.resolveLogoFile = resolveLogoFile;
