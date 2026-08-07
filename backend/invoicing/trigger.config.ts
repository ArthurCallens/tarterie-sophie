import { defineConfig } from "@trigger.dev/sdk/v3";
import { additionalFiles } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  // Find this under Project Settings in the trigger.dev dashboard for the
  // existing "tarterie sophie" project — looks like "proj_xxxxxxxxxxxx".
  project: "proj_bpviemutpfjolozquhby",
  // node-22+ has native WebSocket, which @supabase/supabase-js needs just to
  // construct a client (even though we never use realtime features).
  runtime: "node-22",
  logLevel: "log",
  maxDuration: 60,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
  build: {
    extensions: [
      // pdfkit reads its standard-font metrics from `<bundle dir>/data/*.afm`
      // at runtime (via __dirname), which the bundler doesn't copy by default.
      // ./data here is a checked-in copy of node_modules/pdfkit/js/data.
      additionalFiles({ files: ["data/**"] }),
    ],
  },
});
