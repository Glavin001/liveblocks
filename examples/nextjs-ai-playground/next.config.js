/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias.yjs = require.resolve("yjs");
    config.resolve.alias["y-prosemirror"] = require.resolve("y-prosemirror");
    config.resolve.alias["prosemirror-model"] = require.resolve("prosemirror-model");
    config.resolve.alias["prosemirror-state"] = require.resolve("prosemirror-state");
    config.resolve.alias["prosemirror-view"] = require.resolve("prosemirror-view");
    config.resolve.alias["prosemirror-transform"] = require.resolve("prosemirror-transform");
    config.resolve.alias["prosemirror-keymap"] = require.resolve("prosemirror-keymap");
    config.resolve.alias["prosemirror-commands"] = require.resolve("prosemirror-commands");
    return config;
  },
};

module.exports = nextConfig;
