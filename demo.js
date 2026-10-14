// Authentic package usage. Run with lumine/script/demo.js; fixtures stay in demo/.
module.exports = {
  version: 1,
  dependencies: [],
  viewport: { width: 1200, height: 860 },
  async before() {},
  async prepare(context) {
    const { state, open } = context;
    state.editor = await open("example.txt");
  },
  scenes: [
    {
      id: "scene-1",
      file: "demo.png",
      caption:
        "Open About, focus a version copy control, and view the pane in both light and dark themes.",
      timeout: 60000,
      async run(context) {
        const { lumine, state } = context;
        {
          await lumine.workspace.open("lumine://about");
          await lumine.workspace.paneForItem(state.editor).destroyItem(state.editor, true);
          if (!document.querySelector(".about-version-container"))
            throw new Error("About did not render");
        }
      },
      ready() {
        return Boolean(
          document.querySelector("lumine-workspace")?.getBoundingClientRect().height > 0 &&
          document.body.innerText.trim().length > 0,
        );
      },
    },
    {
      id: "scene-2",
      file: "demo-2.png",
      caption:
        "Open About, focus a version copy control, and view the pane in both light and dark themes.",
      timeout: 60000,
      async run(context) {
        const { lumine } = context;
        {
          document.querySelector(".about-version-container.electron").focus();
        }
        {
          lumine.config.set("theme.mode", "dark");
          await new Promise((resolve) => setTimeout(resolve, 900));
        }
      },
      ready() {
        return Boolean(
          document.querySelector("lumine-workspace")?.getBoundingClientRect().height > 0 &&
          document.body.innerText.trim().length > 0,
        );
      },
    },
  ],
  async cleanup(context) {
    const { lumine } = context;
    {
      lumine.config.set("theme.mode", "light");
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
  },
};
