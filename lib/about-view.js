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
  constructor(props) {
    super(props);
    this.configSubscription = lumine.config.onDidChange("about", () => {
      this.copyFeedback?.dispose();
      this.copyFeedback = null;
      if (!this.destroyed) this.update({});
    });
  }

  renderSeparator() {
    return $.div({ className: "about-separator", ariaHidden: "true" });
  }

  renderIntroductionAction(title, description, action, packageName) {
    return $.button(
      {
        type: "button",
        className: "about-tile about-introduction-action",
        onclick: () => {
          if (packageName && lumine.packages.isPackageDisabled(packageName)) {
            lumine.notifications.addWarning(
              `The ${packageName} package is disabled. Enable it to use this action.`,
            );
            return;
          }
          if (action.startsWith("lumine://")) return lumine.workspace.open(action);
          return lumine.commands.dispatch(lumine.views.getView(lumine.workspace), action);
        },
      },
      $.span({ className: "about-introduction-title" }, title),
      $.span({ className: "about-introduction-description" }, description),
      $.span({ className: "about-introduction-arrow", ariaHidden: "true" }, "→"),
    );
  }

  renderIntroduction() {
    return $.section(
      { className: "about-introduction", ariaLabel: "Introduction" },
      this.renderSeparator(),
      $.div(
        {
          id: "about-introduction-actions",
          className: "about-grid about-introduction-actions",
        },
        this.renderIntroductionAction(
          "Open a project",
          "Choose a folder and start working with its files.",
          "application:open-folder",
        ),
        this.renderIntroductionAction(
          "Open a file",
          "Choose a file to edit without opening a project folder.",
          "application:open-file",
        ),
        this.renderIntroductionAction(
          "New file",
          "Start an untitled document and save it when you're ready.",
          "application:new-file",
        ),
        this.renderIntroductionAction(
          "Find a command",
          "Search the Command Palette to discover what the editor can do.",
          "command-palette:toggle",
          "command-palette",
        ),
        this.renderIntroductionAction(
          "Add packages",
          "Find languages and tools for your workflow.",
          "lumine://config/install",
          "settings-view",
        ),
        this.renderIntroductionAction(
          "Make it yours",
          "Choose the themes used for your interface and code.",
          "lumine://config/themes",
          "settings-view",
        ),
        this.renderIntroductionAction(
          "Open settings",
          "Adjust editing preferences and manage your installed packages.",
          "lumine://config",
          "settings-view",
        ),
        this.renderIntroductionAction(
          "Explore keybindings",
          "Find the shortcuts assigned to commands and see which package owns them.",
          "lumine://config/keybindings",
          "settings-view",
        ),
        this.renderIntroductionAction(
          "Customize keybindings",
          "Open your keymap to assign the shortcuts that suit you.",
          "application:open-your-keymap",
        ),
        this.renderIntroductionAction(
          "Customize styles",
          "Open your stylesheet to adjust the editor's appearance with CSS.",
          "application:open-your-stylesheet",
        ),
        this.renderIntroductionAction(
          "Create snippets",
          "Turn reusable text into snippets you can expand while editing.",
          "application:open-your-snippets",
        ),
        this.renderIntroductionAction(
          "Edit startup script",
          "Use JavaScript to customize what the editor does when it starts.",
          "application:open-your-init-script",
        ),
      ),
    );
  }

  canCopy() {
    return false;
  }

  getSingletonKey() {
    return "about:main";
  }

  copyVersion(event, version) {
    event.preventDefault();
    lumine.clipboard.write(version);
    this.copyFeedback?.dispose();
    const target = event.currentTarget;
    const title = target.title;
    const content = target.ownerDocument.createElement("span");
    content.textContent = "Copied";
    const tooltip = lumine.tooltips.add(target, {
      item: content,
      trigger: "manual",
      placement: "auto top",
      class: "about-copy-feedback",
    });
    const ownerWindow = target.ownerDocument.defaultView;
    let timer;
    const feedback = new Disposable(() => {
      ownerWindow.clearTimeout(timer);
      tooltip.dispose();
      target.title = title;
      if (this.copyFeedback === feedback) this.copyFeedback = null;
    });
    this.copyFeedback = feedback;
    timer = ownerWindow.setTimeout(() => feedback.dispose(), 1500);
  }

  handleLumineVersionClick(e) {
    this.copyVersion(e, this.props.currentLumineVersion);
  }

  handleElectronVersionClick(e) {
    this.copyVersion(e, this.props.currentElectronVersion);
  }

  handleChromeVersionClick(e) {
    this.copyVersion(e, this.props.currentChromeVersion);
  }

  handleNodeVersionClick(e) {
    this.copyVersion(e, this.props.currentNodeVersion);
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
        className: `about-tile about-version-container ${className}`,
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
        this.renderSeparator(),
        $.header(
          {
            id: "about-editor-content",
            className: "about-header",
          },
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
          this.renderSeparator(),
          $.div(
            {
              id: "about-installation-content",
              className: "about-grid about-header-info",
            },
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
          this.renderSeparator(),
          $.div(
            {
              id: "about-resources-content",
              className: "about-grid about-actions",
            },
            $.button(
              {
                type: "button",
                className: "about-tile about-action about-documentation-button",
                onclick: this.handleDocumentationClick.bind(this),
              },
              $.span({ className: "about-resource-label" }, "Documentation"),
              $.span({ className: "about-resource-arrow", ariaHidden: "true" }, "↗"),
            ),
            $.button(
              {
                type: "button",
                className: "about-tile about-action about-release-notes-button",
                onclick: this.handleReleaseNotesClick.bind(this),
              },
              $.span({ className: "about-resource-label" }, "Release notes"),
              $.span({ className: "about-resource-arrow", ariaHidden: "true" }, "↗"),
            ),
            $.button(
              {
                type: "button",
                className: "about-tile about-action view-license",
                onclick: this.handleLicenseClick.bind(this),
              },
              $.span({ className: "about-resource-label" }, "License"),
              $.span({ className: "about-resource-arrow", ariaHidden: "true" }, "→"),
            ),
            this.renderUpdateChecker(),
          ),
        ),
        this.renderIntroduction(),
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
        $.span({ className: "about-resource-label" }, "Updates unavailable"),
        $.span({ className: "about-hint" }, "Enable lumine-updater to check for updates."),
      );
    }
    return $.button(
      {
        type: "button",
        className: "about-tile about-action about-update-action-button",
        onclick: this.executeUpdateAction.bind(this),
      },
      $.span({ className: "about-resource-label" }, "Check for updates"),
      $.span({ className: "about-resource-arrow", ariaHidden: "true" }, "→"),
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
    this.copyFeedback?.dispose();
    this.configSubscription?.dispose();
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
