describe("About scrollbar navigation", () => {
  let view, bind;

  beforeEach(() => {
    bind = spyOn(lumine.scrollbars, "bindNavigation").and.callThrough();
    const AboutView = require("../lib/about-view");
    view = new AboutView({
      uri: "lumine://about",
      currentLumineVersion: "1.0.0",
      currentElectronVersion: process.versions.electron,
      currentChromeVersion: process.versions.chrome,
      currentNodeVersion: process.versions.node,
    });
    jasmine.attachToDOM(view.element);
  });

  afterEach(() => {
    if (view && !view.isDestroyed()) view.destroy();
  });

  it("owns navigation on its actual scrollport and leaves action buttons native", async () => {
    expect(bind).toHaveBeenCalledOnceWith(view.element);
    const reveal = spyOn(lumine.scrollbars, "reveal");
    lumine.commands.dispatch(view.element, "core:page-down");
    expect(reveal).toHaveBeenCalledOnceWith(view.element);
    reveal.calls.reset();
    lumine.commands.dispatch(view.element.querySelector("button"), "core:page-down");
    await view.update({ currentLumineVersion: "1.0.1" });
    expect(reveal).not.toHaveBeenCalled();
    expect(bind).toHaveBeenCalledTimes(1);
  });

  it("releases its navigation binding when the view closes", () => {
    const binding = bind.calls.mostRecent().returnValue;
    view.destroy();
    expect(binding.disposed).toBeTrue();
    expect(view.element.hasAttribute("data-lumine-scroll-navigation")).toBeFalse();
  });
});
