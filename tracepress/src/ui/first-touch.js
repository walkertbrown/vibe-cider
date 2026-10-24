// Loaded by every page that is not the tool itself, so a visitor's first
// page records where they came from (source.js). A visitor who lands on a
// guide page and only then opens the tool would otherwise be tagged
// via-<that page>, losing Google or the ?ref= on the link we posted.
import { source } from "./source.js";

source();
