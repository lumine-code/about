const path = require("path");

const PACKAGE_NAME = "about";
const PACKAGE_PATH = path.join(__dirname, "..");

describe("about bootstrap activation", () => {
  let pack;
  let previousShowOnStartup;

  beforeEach(async () => {
    if (lumine.packages.isPackageLoaded(PACKAGE_NAME)) {
      await lumine.packages.unloadPackage(PACKAGE_NAME);
    }
    previousShowOnStartup = lumine.config.get("about.showOnStartup");
    lumine.config.set("about.showOnStartup", false);
    pack = await lumine.packages.startPackage(PACKAGE_PATH);
  });

  afterEach(async () => {
    if (lumine.packages.isPackageLoaded(PACKAGE_NAME)) {
      await lumine.packages.unloadPackage(PACKAGE_NAME);
    }
    lumine.config.set("about.showOnStartup", previousShowOnStartup);
  });

  it("activates its lightweight facade before workspace restore", () => {
    expect(lumine.packages.getPackageLifecycleState(PACKAGE_NAME)).toBe("active");
    expect(pack.mainModule).not.toBeNull();
    expect(pack.mainActivated).toBe(true);
  });

  it("activates through the cold About URI opener", async () => {
    lumine.config.set("about.showOnStartup", true);
    const item = await lumine.workspace.open("lumine://about");

    expect(lumine.packages.getPackageLifecycleState(PACKAGE_NAME)).toBe("active");
    expect(item.getURI()).toBe("lumine://about");
    expect(pack.mainActivated).toBe(true);
  });
});
