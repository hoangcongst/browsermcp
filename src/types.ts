import { z } from "zod";

// A helper to create a basic tool schema
const createToolSchema = (name: string, description: string, args: any) => {
  return z.object({
    name: z.literal(name),
    description: z.literal(description),
    arguments: z.object(args),
  });
};

// Common Tools
export const NavigateTool = createToolSchema(
  "navigate",
  "Navigate to a URL",
  { url: z.string() }
);
export const GoBackTool = createToolSchema("go_back", "Go back to the previous page", {});
export const GoForwardTool = createToolSchema("go_forward", "Go forward to the next page", {});
export const PressKeyTool = createToolSchema("press_key", "Press a key on the keyboard", { key: z.string() });
export const WaitTool = createToolSchema("wait", "Wait for a specified time", { time: z.number() });

// Custom Tools
export const GetConsoleLogsTool = createToolSchema("get_console_logs", "Get console logs from the browser", {});
export const ScreenshotTool = createToolSchema("screenshot", "Take a screenshot of the current page", {});

// Snapshot Tools
export const SnapshotTool = createToolSchema("snapshot", "Capture accessibility snapshot of the current page", {});
export const ClickTool = createToolSchema("click", "Perform click on a web page", { element: z.string(), ref: z.string() });
export const HoverTool = createToolSchema("hover", "Hover over element on page", { element: z.string(), ref: z.string() });
export const TypeTool = createToolSchema("type", "Type text into editable element", { element: z.string(), ref: z.string(), text: z.string(), submit: z.boolean() });
export const SelectOptionTool = createToolSchema("select_option", "Select an option in a dropdown", { element: z.string(), ref: z.string(), values: z.array(z.string()) });
export const DragTool = createToolSchema("drag", "Drag an element", { startElement: z.string(), endElement: z.string() });
