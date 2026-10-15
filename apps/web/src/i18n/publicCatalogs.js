import { mergeCatalogs } from "./core.js";
import * as common from "./messages/common.js";
import * as publicMessages from "./messages/public.js";
import * as discovery from "./messages/publicDiscovery.js";

// No private guide bodies or workspace data enter the public artifact.
export const publicCatalogs = mergeCatalogs(common, publicMessages, discovery);
