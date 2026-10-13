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
  canCopy() {
    return false;
  }

  getSingletonKey() {
    return "about:main";
  }

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

  renderVersion(name, className, version, handler, detail) {
    return $.button(
      {
        type: "button",
        className: `about-version-container ${className}`,
        title: `Copy ${name} version`,
        ariaLabel: `Copy ${name} version ${version}`,
        onclick: handler.bind(this),
      },
      $.span({ className: "about-version-name" }, name),
      $.span({ className: "about-version" }, version),
      detail ? $.span({ className: "about-version-detail" }, detail) : null,
      $.span({ className: "icon icon-clippy about-copy-version", ariaHidden: "true" }),
    );
  }

  render() {
    return $.div(
      { className: "pane-item native-key-bindings about", tabIndex: -1 },
      $.div(
        { className: "about-sheet" },
        $.div(
          { className: "about-masthead" },
          $.span({ className: "about-eyebrow" }, "About the editor"),
          $.a(
            { className: "about-website", href: lumine.branding.urlWeb },
            "Website",
            $.span({ ariaHidden: "true" }, " ↗"),
          ),
        ),
        $.header(
          { className: "about-header" },
          $.div(
            { className: "about-intro" },
            $.h1({ className: "about-title" }, lumine.branding.name),
            $.p(
              { className: "about-subtitle" },
              "A modern, extensible text editor built on the Pulsar and Atom legacy.",
            ),
          ),
          $.a(
            {
              className: "about-homepage",
              href: lumine.branding.urlWeb,
              ariaLabel: "Visit the Lumine website",
            },
            $.img({
              className: "about-logo",
              src: pathToFileURL(
                path.join(
                  lumine.application.getResourcePath(),
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
        ),
        $.section(
          { className: "about-installation", ariaLabel: "Installation details" },
          $.div(
            { className: "about-section-heading" },
            $.h2({}, "Installation"),
            $.span({ className: "about-hint" }, "Select a version to copy"),
          ),
          $.div(
            { className: "about-header-info" },
            this.renderVersion(
              "Lumine",
              "lumine",
              this.props.currentLumineVersion,
              this.handleLumineVersionClick,
              process.arch,
            ),
            this.renderVersion(
              "Electron",
              "electron",
              this.props.currentElectronVersion,
              this.handleElectronVersionClick,
            ),
            this.renderVersion(
              "Chrome",
              "chrome",
              this.props.currentChromeVersion,
              this.handleChromeVersionClick,
            ),
            this.renderVersion(
              "Node.js",
              "node",
              this.props.currentNodeVersion,
              this.handleNodeVersionClick,
            ),
          ),
        ),
        $.section(
          { className: "about-resources", ariaLabel: "Resources and updates" },
          $.div({ className: "about-section-heading" }, $.h2({}, "Resources")),
          $.div(
            { className: "about-actions" },
            $.button(
              {
                type: "button",
                className: "about-action about-documentation-button",
                onclick: this.handleDocumentationClick.bind(this),
              },
              "Documentation",
            ),
            $.button(
              {
                type: "button",
                className: "about-action about-release-notes-button",
                onclick: this.handleReleaseNotesClick.bind(this),
              },
              "Release notes",
            ),
            $.button(
              {
                type: "button",
                className: "about-action view-license",
                onclick: this.handleLicenseClick.bind(this),
              },
              "License",
            ),
            this.renderUpdateChecker(),
          ),
        ),
        $.footer(
          { className: "about-footer" },
          $.span({ className: "about-team-text" }, "Made by the Lumine team"),
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
              "Show when opening Lumine",
            ),
          ),
        ),
      ),
    );
  }

  renderUpdateChecker() {
    if (lumine.packages.isPackageDisabled("lumine-updater")) {
      return $.div(
        { className: "about-updates-item" },
        $.span({}, "Updates unavailable"),
        $.span({ className: "about-hint" }, "Enable lumine-updater to check for updates."),
      );
    }
    return $.button(
      {
        type: "button",
        className: "about-action about-update-action-button",
        onclick: this.executeUpdateAction.bind(this),
      },
      "Check for updates",
    );
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
