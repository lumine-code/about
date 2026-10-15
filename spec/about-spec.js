const AboutView = require("../lib/about-view");

describe("About", () => {
  let workspaceElement;

  beforeEach(async () => {
    workspaceElement = lumine.views.getView(lumine.workspace);
    lumine.config.set("about.showOnStartup", false);
    await lumine.packages.activatePackage("about");
    lumine.config.unset("about.showIntroduction");
  });

  describe("introduction", () => {
    it("opens projects and the command palette through workspace commands", async () => {
      const item = await lumine.workspace.open("lumine://about");
      spyOn(lumine.commands, "dispatch");
      const actions = item.element.querySelectorAll(".about-introduction-action");
      expect(actions.length).toBe(4);
      actions[0].click();
      actions[1].click();
      expect(lumine.commands.dispatch.calls.allArgs()).toEqual([
        [workspaceElement, "application:open-folder"],
        [workspaceElement, "command-palette:toggle"],
      ]);
    });

    it("opens the package installer and themes without requesting pane splits", async () => {
      const item = await lumine.workspace.open("lumine://about");
      spyOn(lumine.workspace, "open").and.returnValue(Promise.resolve());
      const actions = item.element.querySelectorAll(".about-introduction-action");
      actions[2].click();
      actions[3].click();
      expect(lumine.workspace.open.calls.allArgs()).toEqual([
        ["lumine://config/install"],
        ["lumine://config/themes"],
      ]);
    });

    it("remembers collapsing across reopening and follows preference changes", async () => {
      let item = await lumine.workspace.open("lumine://about");
      jasmine.attachToDOM(workspaceElement);
      const button = item.element.querySelector(".about-introduction-toggle");
      expect(button.getAttribute("aria-expanded")).toBe("true");
      button.click();
      await item.update({});
      expect(lumine.config.get("about.showIntroduction")).toBe(false);
      expect(item.element.querySelector(".about-introduction-actions")).not.toBeVisible();
      expect(button.getAttribute("aria-expanded")).toBe("false");
      await lumine.workspace.paneForItem(item).destroyItem(item);
      item = await lumine.workspace.open("lumine://about");
      expect(item.element.querySelector(".about-introduction-actions").hidden).toBe(true);
      lumine.config.set("about.showIntroduction", true);
      await item.update({});
      expect(item.element.querySelector(".about-introduction-actions")).toBeVisible();
    });

    it("explains disabled packages and releases its configuration observer", async () => {
      const item = await lumine.workspace.open("lumine://about");
      spyOn(lumine.packages, "isPackageDisabled").and.callFake(
        (name) => name === "command-palette",
      );
      spyOn(lumine.notifications, "addWarning");
      spyOn(lumine.commands, "dispatch");
      item.element.querySelectorAll(".about-introduction-action")[1].click();
      expect(lumine.notifications.addWarning).toHaveBeenCalled();
      expect(lumine.commands.dispatch).not.toHaveBeenCalled();
      await lumine.workspace.paneForItem(item).destroyItem(item);
      spyOn(item, "update");
      lumine.config.set("about.showIntroduction", false);
      expect(item.update).not.toHaveBeenCalled();
    });
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

  it("reuses the model created for restore when activation follows", async () => {
    await lumine.packages.deactivatePackage("about");
    const main = lumine.packages.getLoadedPackage("about").mainModule;
    const restored = main.deserializeAboutView({ uri: "lumine://about" });
    const restoredModel = main.model;

    await main.activate();

    expect(main.model).toBe(restoredModel);
    expect(main.model.views.aboutView).toBe(restored);
    main.deactivate();
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

  it("makes every version copy control focusable and names the version it copies", async () => {
    const item = await lumine.workspace.open("lumine://about");
    jasmine.attachToDOM(workspaceElement);
    const controls = item.element.querySelectorAll(".about-version-container");
    expect(controls.length).toBe(4);
    for (const control of controls) {
      expect(control.tagName).toBe("BUTTON");
      expect(control.getAttribute("aria-label")).toContain(
        control.querySelector(".about-version").textContent,
      );
      control.focus();
      expect(document.activeElement).toBe(control);
      control.click();
      expect(lumine.clipboard.read()).toBe(control.querySelector(".about-version").textContent);
    }
  });

  it("keeps the full view within a narrow split pane", async () => {
    const item = await lumine.workspace.open("lumine://about");
    const root = item.element;
    root.style.cssText = "width: 320px; height: 700px; flex: none;";
    jasmine.attachToDOM(root);
    expect(root.getBoundingClientRect().width).toBe(320);
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    expect(
      getComputedStyle(root.querySelector(".about-introduction-actions")).gridTemplateColumns.split(
        " ",
      ).length,
    ).toBe(1);
    expect(
      getComputedStyle(root.querySelector(".about-header-info")).gridTemplateColumns.split(" ")
        .length,
    ).toBe(2);
    expect(
      root.querySelector(".about-startup-label").getBoundingClientRect().right,
    ).toBeLessThanOrEqual(root.getBoundingClientRect().right);
  });

  it("aligns the logo divider with the version and resource columns", async () => {
    const item = await lumine.workspace.open("lumine://about");
    const root = item.element;
    jasmine.attachToDOM(root);
    for (const [width, column] of [
      [1200, 3],
      [680, 1],
    ]) {
      root.style.cssText = `width: ${width}px; height: 1000px; flex: none;`;
      const logo = root.querySelector(".about-homepage").getBoundingClientRect().left;
      for (const selector of [".about-version-container", ".about-actions > *"]) {
        const cell = root.querySelectorAll(selector)[column].getBoundingClientRect().left;
        expect(Math.abs(logo - cell)).toBeLessThan(1);
      }
    }
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
