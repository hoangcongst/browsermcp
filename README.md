# Chrome MCP: Give Your AI the Keys to Your Browser 🔑

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://developer.chrome.com/docs/extensions/)

**Unleash your AI's full potential by giving it direct, secure control over your personal Chrome browser. `chromemcp` transforms your browser from a simple tool into an active, intelligent partner for any task.**

---

## 🚀 Core Philosophy: Speed and Simplicity

`chromemcp` is built on a simple but powerful idea: **the best tools are the ones you don't notice.** Our focus is on creating a seamless, lightweight, and incredibly fast bridge between your AI and your browser.

-   **No Heavy Dependencies**: We use a minimal set of well-vetted libraries to keep the footprint small.
-   **Instant Startup**: By hooking into your existing browser, we eliminate the slow, resource-intensive process of launching new browser instances.
-   **Zero-Clutter Setup**: The configuration is designed to be completed in minutes, getting you from clone to command as quickly as possible.

This project is for developers who value performance and want a tool that just works, without the bloat.

## The Problem: Your AI is Trapped in a Chatbox

Large Language Models are incredibly powerful, but they are fundamentally disconnected from your most important workspace: the web browser. Traditional automation tools like Playwright or Puppeteer are clunky, run in isolated environments, and constantly struggle with logins, CAPTCHAs, and bot detection. They don't know who you are.

## The Solution: Seamless, Context-Aware Automation

`chromemcp` bridges this gap. It's a **Model Context Protocol (MCP)** server that acts as a secure bridge between any AI agent and **your own Chrome browser**. It doesn't launch a new, empty browser; it connects to the one you're already using, complete with your logins, history, and cookies.

This means your AI can:
- ✅ Operate on websites that require a login.
- ✅ Leverage your existing session data for context.
- ✅ Avoid bot detection by using your genuine browser fingerprint.
- ✅ Work alongside you, in your environment.

## How `chromemcp` Redefines AI Interaction

| Advantage | The Old Way (Playwright, etc.) | The `chromemcp` Way | 
| :--- | :--- | :--- | 
| **Integration** | ❌ Runs in a sterile, separate browser instance. | ✅ **Seamlessly integrates** with your live browser session. | 
| **Authentication** | ❌ Constant re-logins and brittle session management. | ✅ **Stays logged in.** Uses your existing cookies and sessions. | 
| **Privacy** | ⚠️ Can involve cloud services or complex setups. | 🔒 **100% Local and Private.** Your data never leaves your machine. | 
| **Speed & Resources** | 🐢 Slow to start, heavy on resources. | ⚡ **Instantaneous and Lightweight.** No new browser process needed. | 
| **Stealth** | 🤖 Easily flagged as a bot. | 🥷 **Human-like.** Uses your real browser fingerprint. | 

## From Zero to AI-Powered in 5 Minutes

1.  **Clone & Install**
    ```bash
    git clone https://github.com/hoangcongst/chromemcp.git
    cd chromemcp
    pnpm install && pnpm build
    ```

2.  **Load the Extension**
    - Go to `chrome://extensions`, enable **Developer Mode**.
    - Click **Load unpacked** and select the `extension` folder.

3.  **Configure Your AI Client**
    Once the extension is loaded, you don't need to manually start the server. Your AI client will do it for you. Here’s how to set it up:

    #### For Cursor, Claude, or other `stdio`-based clients:

    1.  Find the absolute path to the `chromemcp` startup script. In your terminal, navigate to the project directory and run:
        ```bash
        # This will print the full path, e.g., /Users/you/projects/chromemcp
        pwd
        ```
        The path to the script will be `/path/from/pwd/dist/index.js`.

    2.  In your AI client's settings, add a new MCP server configuration:

        - **Name**: `ChromeMCP` (or your preferred name)
        - **Type**: `stdio`
        - **Command**: `node`
        - **Arguments**: `["/path/to/your/chromemcp/dist/index.js"]`

    Here is an example configuration snippet:
    ```json
    {
      "name": "ChromeMCP",
      "command": "node",
      "args": [
        "/Users/your_username/path/to/chromemcp/dist/index.js"
      ],
      "type": "stdio"
    }
    ```

    3.  Save the configuration. Your AI client is now connected and will start the server automatically whenever you use a browser tool.

## The Toolkit: Your AI's Senses and Hands

Equip your AI with a powerful set of tools to see, understand, and interact with the web.

<details>
<summary><strong>👀 Vision & Understanding</strong></summary>

- `snapshot`: Perceive the structure and content of a webpage.
- `screenshot`: See the visual layout of the page or specific elements.
- `get_inner_html`: Read the raw content or text of any element.
- `get_console_logs`: Debug by checking for errors and messages.

</details>

<details>
<summary><strong>🦾 Action & Interaction</strong></summary>

- `click`, `hover`, `type`: Interact with any element on the page.
- `navigate`, `go_back`, `go_forward`: Control the browser's navigation.
- `execute_javascript`: Inject custom logic or modify the page on the fly.
- `press_key`, `select_option`: Handle complex forms and keyboard shortcuts.

</details>

## Join the Revolution

This is more than just a project; it's a step towards a future where AI agents are truly helpful assistants that can work with us in our digital environments. 

**Contributions are highly encouraged!** Whether you want to add new tools, improve performance, or fix bugs, your input is valuable. Check out the issues or open a pull request to get started.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

