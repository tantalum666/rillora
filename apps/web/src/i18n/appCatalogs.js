import { mergeCatalogs } from "./core.js";
import * as common from "./messages/common.js";
import * as publicMessages from "./messages/public.js";
import * as forms from "./messages/forms.js";
import * as workspace from "./messages/workspace.js";
import * as sharing from "./messages/sharing.js";

export const appCatalogs = mergeCatalogs(common, publicMessages, forms, workspace, sharing);
