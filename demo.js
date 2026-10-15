// Authentic package usage. Run with lumine/script/demo.js; fixtures stay in demo/.
module.exports = {
  version: 1,
  dependencies: [],
  viewport: { width: 1200, height: 1280 },
  async before() {},
  async prepare(context) {
    const { state, open } = context;
    state.editor = await open("example.txt");
  },
  scenes: [
    {
      id: "scene-1",
      file: "demo.png",
      caption: "Start working and personalize the editor with the About quick actions.",
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
          document.querySelectorAll(".about-introduction-action").length === 12 &&
          !document.querySelector(".about-introduction-actions").hidden,
        );
      },
    },
    {
      id: "scene-2",
      file: "demo-2.png",
      caption: "Inspect versions, resources and quick actions in the dark theme.",
      timeout: 60000,
      async run(context) {
        const { lumine } = context;
        {
          lumine.config.set("theme.mode", "dark");
          await new Promise((resolve) => setTimeout(resolve, 900));
        }
      },
      ready() {
        return Boolean(
          document.querySelectorAll(".about-introduction-action").length === 12 &&
          lumine.config.get("theme.mode") === "dark",
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
