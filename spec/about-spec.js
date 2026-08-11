const AboutView = require("../lib/about-view");

describe("About", () => {
  let workspaceElement;

  beforeEach(async () => {
    workspaceElement = lumine.views.getView(lumine.workspace);
    lumine.config.set("about.showOnStartup", false);
    await lumine.packages.activatePackage("about");
  });

  describe("startup", () => {
    it("opens About by default", async () => {
      await lumine.packages.deactivatePackage("about");
      lumine.config.unset("about.showOnStartup");

      await lumine.packages.activatePackage("about");

      expect(lumine.workspace.getActivePaneItem().getURI()).toBe("lumine://about");
    });

    it("stores the startup checkbox preference", async () => {
      lumine.config.set("about.showOnStartup", true);
      await lumine.workspace.open("lumine://about");
      jasmine.attachToDOM(workspaceElement);

      const checkbox = workspaceElement.querySelector(".about-startup .input-checkbox");
      expect(checkbox.checked).toBe(true);

      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));

      expect(lumine.config.get("about.showOnStartup")).toBe(false);
    });
  });

  it("deserializes correctly", () => {
    let deserializedAboutView = lumine.deserializers.deserialize({
      deserializer: "AboutView",
      uri: "lumine://about",
    });

    expect(deserializedAboutView).toBeTruthy();
  });

  it("uses the mode-appropriate Lumine logo", async () => {
    await lumine.workspace.open("lumine://about");
    jasmine.attachToDOM(workspaceElement);
    const logo = workspaceElement.querySelector(".about-logo");

    // `--test` forces devMode on (parse-command-line.js), so every spec run
    // is a dev-mode run and the dev-colored mark is genuinely what's shown.
    expect(logo.tagName).toBe("IMG");
    expect(logo.src.replace(/\\/g, "/")).toMatch(/\/resources\/app-icons\/lumine-dev\.svg$/);
  });

  it("picks the logo file for each mode, safe outranking dev", () => {
    expect(AboutView.resolveLogoFile({ devMode: false, safeMode: false })).toBe("lumine.svg");
    expect(AboutView.resolveLogoFile({ devMode: true, safeMode: false })).toBe("lumine-dev.svg");
    expect(AboutView.resolveLogoFile({ devMode: false, safeMode: true })).toBe("lumine-safe.svg");
    expect(AboutView.resolveLogoFile({ devMode: true, safeMode: true })).toBe("lumine-safe.svg");
  });

  describe("when the About view is opened", () => {
    it("shows the About Lumine view", async () => {
      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector(".about")).not.toExist();
      await lumine.workspace.open("lumine://about");

      let aboutElement = workspaceElement.querySelector(".about");
      expect(aboutElement).toBeVisible();
    });
  });

  describe("when the About view is already open in another pane", () => {
    it("activates the existing view instead of adding a duplicate", async () => {
      const item = await lumine.workspace.open("lumine://about", { split: "left" });
      const aboutPane = lumine.workspace.paneForItem(item);
      const otherPane = aboutPane.splitRight();
      expect(lumine.workspace.getActivePane()).toBe(otherPane);

      const reopened = await lumine.workspace.open("lumine://about");
      expect(reopened).toBe(item);
      expect(lumine.workspace.getActivePane()).toBe(aboutPane);
      expect(lumine.workspace.getPaneItems().filter((i) => i === item).length).toBe(1);
    });
  });

  describe("when the About view is reopened after being destroyed", () => {
    it("creates a fresh view", async () => {
      const item = await lumine.workspace.open("lumine://about");
      const pane = lumine.workspace.paneForItem(item);
      pane.destroyItem(item);
      expect(item.isDestroyed()).toBe(true);

      const reopened = await lumine.workspace.open("lumine://about");
      expect(reopened).not.toBe(item);
      expect(reopened.isDestroyed()).toBe(false);
      expect(reopened.getURI()).toBe("lumine://about");
    });
  });

  describe("when the Lumine version number is clicked", () => {
    it("copies the version number to the clipboard", async () => {
      await lumine.workspace.open("lumine://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      let versionContainer = aboutElement.querySelector(".lumine");
      versionContainer.click();
      expect(lumine.clipboard.read()).toBe(lumine.application.getVersion());
    });
  });

  describe("the additional version numbers", () => {
    it("are shown by default", async () => {
      await lumine.workspace.open("lumine://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      expect(aboutElement.querySelector(".electron")).toBeVisible();
      expect(aboutElement.querySelector(".chrome")).toBeVisible();
      expect(aboutElement.querySelector(".node")).toBeVisible();
    });
  });

  describe("when the Electron version number is clicked", () => {
    it("copies the version number to the clipboard", async () => {
      await lumine.workspace.open("lumine://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      let versionContainer = aboutElement.querySelector(".electron");
      versionContainer.click();
      expect(lumine.clipboard.read()).toBe(process.versions.electron);
    });
  });

  describe("when the Chrome version number is clicked", () => {
    it("copies the version number to the clipboard", async () => {
      await lumine.workspace.open("lumine://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      let versionContainer = aboutElement.querySelector(".chrome");
      versionContainer.click();
      expect(lumine.clipboard.read()).toBe(process.versions.chrome);
    });
  });

  describe("when the Node version number is clicked", () => {
    it("copies the version number to the clipboard", async () => {
      await lumine.workspace.open("lumine://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      let versionContainer = aboutElement.querySelector(".node");
      versionContainer.click();
      expect(lumine.clipboard.read()).toBe(process.version);
    });
  });

  describe("check for update appears", () => {
    it('when "lumine-updater" is enabled', async () => {
      lumine.packages.activatePackage("lumine-updater");
      await lumine.workspace.open("lumine://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      let updateContainer = aboutElement.querySelector(".about-update-action-button");
      expect(updateContainer.innerText).toBe("Check for updates");
    });
  });
});
