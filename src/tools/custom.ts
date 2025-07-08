import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { GetConsoleLogsTool, ScreenshotTool } from "../types";
import { Tool } from "./tool";

const GetInnerHTMLTool = z.object({
  name: z.literal("get_inner_html"),
  description: z.literal(
    "Gets the content of element(s) specified by a CSS selector.",
  ),
  arguments: z.object({
    selector: z.string().describe("The CSS selector of the element(s)."),
    getAll: z.boolean().optional().describe("If true, returns all matching elements instead of just the first one."),
    getTextContent: z.boolean().optional().describe("If true, returns textContent instead of innerHTML."),
  }),
});

export const getConsoleLogs: Tool = {
  schema: {
    name: GetConsoleLogsTool.shape.name.value,
    description: GetConsoleLogsTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetConsoleLogsTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const consoleLogs = await context.sendSocketMessage(
      "browser_get_console_logs",
      {},
    );
    const text: string = consoleLogs
      .map((log: any) => JSON.stringify(log))
      .join("\n");
    return {
      content: [{ type: "text", text }],
    };
  },
};

export const screenshot: Tool = {
  schema: {
    name: ScreenshotTool.shape.name.value,
    description: ScreenshotTool.shape.description.value,
    inputSchema: zodToJsonSchema(ScreenshotTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const screenshot = await context.sendSocketMessage(
      "capture_screenshot",
      {},
    );
    return {
      content: [
        {
          type: "image",
          data: screenshot,
          mimeType: "image/png",
        },
      ],
    };
  },
};

export const getInnerHTML: Tool = {
  schema: {
    name: GetInnerHTMLTool.shape.name.value,
    description: GetInnerHTMLTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetInnerHTMLTool.shape.arguments),
  },
  handle: async (context, params) => {
    const { selector, getAll, getTextContent } = GetInnerHTMLTool.shape.arguments.parse(params);
    const response = await context.sendSocketMessage(
      "browser_get_inner_html",
      { selector, getAll, getTextContent },
    );
    
    // Handle the response based on the options
    let resultText = '';
    
    if (response && response.content) {
      if (Array.isArray(response.content) && getAll) {
        // Format array of contents for readability
        resultText = response.content.map((item: string, index: number) => 
          `[${index}]: ${item}`
        ).join('\n');
      } else {
        // Single content result
        resultText = response.content.toString();
      }
    } else {
      resultText = JSON.stringify(response, null, 2);
    }
    
    return {
      content: [{ type: "text", text: resultText }],
    };
  },
};
