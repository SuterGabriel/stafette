import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Font loading can exceed the default 28 s when many tabs render in parallel on Windows
Config.setDelayRenderTimeoutInMilliseconds(120000);
Config.setConcurrency(4);
