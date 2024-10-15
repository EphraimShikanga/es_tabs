// vite.config.ts
import { defineConfig } from "file:///run/media/ephraim/codage/es_tabs/node_modules/vite/dist/node/index.js";
import react from "file:///run/media/ephraim/codage/es_tabs/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";

// public/manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "es_tabs",
  version: "1.0.5",
  description: "An extension that solves the problem of too many tabs",
  action: {
    default_popup: "index.html",
    default_icon: {
      "16": "icon16.png",
      "32": "icon32.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  permissions: [
    "storage",
    "unlimitedStorage",
    "tabs",
    "tabGroups"
  ],
  background: {
    service_worker: "./src/background/background2.ts"
  }
};

// vite.config.ts
import { crx } from "file:///run/media/ephraim/codage/es_tabs/node_modules/@crxjs/vite-plugin/dist/index.mjs";
var __vite_injected_original_dirname = "/run/media/ephraim/codage/es_tabs";
var vite_config_default = defineConfig({
  build: {
    chunkSizeWarningLimit: 1500
    // rollupOptions: {
    //   input: {
    //     popup: resolve(__dirname, 'index.html'), // Include popup.html or index.html for the default popup
    //     background: resolve(__dirname, 'src/background/background2.ts'), // Background script
    //   },
    //   output: {
    //     entryFileNames: '[name].js', // Ensures consistent file names
    //   }
    // }
  },
  plugins: [crx({ manifest: manifest_default }), react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    hmr: {
      port: 5173
    },
    port: 5173
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicHVibGljL21hbmlmZXN0Lmpzb24iXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvcnVuL21lZGlhL2VwaHJhaW0vY29kYWdlL2VzX3RhYnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ydW4vbWVkaWEvZXBocmFpbS9jb2RhZ2UvZXNfdGFicy92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vcnVuL21lZGlhL2VwaHJhaW0vY29kYWdlL2VzX3RhYnMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG4vLyBpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiXG5pbXBvcnQgbWFuaWZlc3QgZnJvbSAnLi9wdWJsaWMvbWFuaWZlc3QuanNvbidcbmltcG9ydCB7IGNyeCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbidcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDE1MDAsXG4gICAgLy8gcm9sbHVwT3B0aW9uczoge1xuICAgIC8vICAgaW5wdXQ6IHtcbiAgICAvLyAgICAgcG9wdXA6IHJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXguaHRtbCcpLCAvLyBJbmNsdWRlIHBvcHVwLmh0bWwgb3IgaW5kZXguaHRtbCBmb3IgdGhlIGRlZmF1bHQgcG9wdXBcbiAgICAvLyAgICAgYmFja2dyb3VuZDogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvYmFja2dyb3VuZC9iYWNrZ3JvdW5kMi50cycpLCAvLyBCYWNrZ3JvdW5kIHNjcmlwdFxuICAgIC8vICAgfSxcbiAgICAvLyAgIG91dHB1dDoge1xuICAgIC8vICAgICBlbnRyeUZpbGVOYW1lczogJ1tuYW1lXS5qcycsIC8vIEVuc3VyZXMgY29uc2lzdGVudCBmaWxlIG5hbWVzXG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9LFxuICBwbHVnaW5zOiBbY3J4KHsgbWFuaWZlc3QgfSkscmVhY3QoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG1yOiB7XG4gICAgICBwb3J0OiA1MTczLFxuICAgIH0sXG4gICAgcG9ydDogNTE3MyxcbiAgfSxcbn0pO1xuIiwgIntcbiAgXCJtYW5pZmVzdF92ZXJzaW9uXCI6IDMsXG4gIFwibmFtZVwiOiBcImVzX3RhYnNcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMS4wLjVcIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIGV4dGVuc2lvbiB0aGF0IHNvbHZlcyB0aGUgcHJvYmxlbSBvZiB0b28gbWFueSB0YWJzXCIsXG4gIFwiYWN0aW9uXCI6IHtcbiAgICBcImRlZmF1bHRfcG9wdXBcIjogXCJpbmRleC5odG1sXCIsXG4gICAgXCJkZWZhdWx0X2ljb25cIjoge1xuICAgICAgXCIxNlwiOiBcImljb24xNi5wbmdcIixcbiAgICAgIFwiMzJcIjogXCJpY29uMzIucG5nXCIsXG4gICAgICBcIjQ4XCI6IFwiaWNvbjQ4LnBuZ1wiLFxuICAgICAgXCIxMjhcIjogXCJpY29uMTI4LnBuZ1wiXG4gICAgfVxuICB9LFxuICBcInBlcm1pc3Npb25zXCI6IFtcbiAgICBcInN0b3JhZ2VcIixcbiAgICBcInVubGltaXRlZFN0b3JhZ2VcIixcbiAgICBcInRhYnNcIixcbiAgICBcInRhYkdyb3Vwc1wiXG4gIF0sXG4gIFwiYmFja2dyb3VuZFwiOiB7XG4gICAgXCJzZXJ2aWNlX3dvcmtlclwiOiBcIi4vc3JjL2JhY2tncm91bmQvYmFja2dyb3VuZDIudHNcIlxuICB9XG59Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFxUixTQUFTLG9CQUFvQjtBQUNsVCxPQUFPLFdBQVc7QUFFbEIsT0FBTyxVQUFVOzs7QUNIakI7QUFBQSxFQUNFLGtCQUFvQjtBQUFBLEVBQ3BCLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLGFBQWU7QUFBQSxFQUNmLFFBQVU7QUFBQSxJQUNSLGVBQWlCO0FBQUEsSUFDakIsY0FBZ0I7QUFBQSxNQUNkLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUFBLEVBQ0EsYUFBZTtBQUFBLElBQ2I7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQUEsRUFDQSxZQUFjO0FBQUEsSUFDWixnQkFBa0I7QUFBQSxFQUNwQjtBQUNGOzs7QURsQkEsU0FBUyxXQUFXO0FBTHBCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxJQUNMLHVCQUF1QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVXpCO0FBQUEsRUFDQSxTQUFTLENBQUMsSUFBSSxFQUFFLDJCQUFTLENBQUMsR0FBRSxNQUFNLENBQUM7QUFBQSxFQUNuQyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
