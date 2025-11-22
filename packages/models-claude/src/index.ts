/**
 * Claude Model Adapter Example
 * 
 * This is a reference implementation showing how to integrate UUICS
 * with Claude AI. Users should adapt this to their needs.
 */

import type { PageContext } from '@uuics/core';

/**
 * Claude adapter configuration
 */
export interface ClaudeAdapterConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  proxyUrl?: string;
}

/**
 * Claude Adapter
 * 
 * Example adapter for integrating UUICS with Claude AI.
 * This demonstrates how to format context for Claude and parse responses.
 */
export class ClaudeAdapter {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private proxyUrl?: string;

  constructor(config: ClaudeAdapterConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens ?? 2048;
    this.proxyUrl = config.proxyUrl;
  }

  /**
   * Format UUICS context for Claude
   */
  formatContext(_context: PageContext, naturalLanguage: string): string {
    // Include current date/time so Claude can calculate relative dates
    const now = new Date();
    const currentDateTime = now.toISOString();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    
    return `You are an AI assistant helping to interact with a web page.

Current Date and Time:
- ISO: ${currentDateTime}
- Date (YYYY-MM-DD format): ${currentDate}
- Time (HH:MM format): ${currentTime}
- Day of week: ${now.toLocaleDateString('en-US', { weekday: 'long' })}

IMPORTANT: Use the date/time above to calculate relative dates like "tomorrow", "next week", etc.
For date inputs, always use YYYY-MM-DD format (e.g., ${currentDate}).
For time inputs, always use HH:MM format (e.g., ${currentTime}).

Current Page Context:
${naturalLanguage}

IMPORTANT NOTES ABOUT THE CONTEXT ABOVE:
- Dropdown/select elements ALREADY show their available options in the context
- Options are shown as: "Label Text" (value: actual_value)
- Example: "Developer" (value: developer) means the label is "Developer" but you must use "developer" in actions
- The options are listed right there - you don't need to click to see them!
- Selects are marked as either [SINGLE-SELECT OPTIONS: ...] or [MULTI-SELECT OPTIONS: ...]

ACTIONS YOU CAN PERFORM:

1. **setValue** - Set text in input fields or textareas
   Example: { "action": "setValue", "target": "#name", "parameters": { "value": "John Doe" } }

2. **select** - Select option(s) from a dropdown (use the VALUE, not the label!)
   
   For SINGLE-SELECT dropdowns:
   { "action": "select", "target": "#role", "parameters": { "value": "developer" } }
   
   For MULTI-SELECT dropdowns (select multiple values):
   { "action": "select", "target": "#skills", "parameters": { "value": ["js", "python"] } }
   
   CRITICAL: 
   - For dropdowns, always use the VALUE from "(value: xxx)" part, NOT the label text!
   - If you see "Designer" (value: designer), use "designer" in the action
   - For MULTI-SELECT, pass an array of values: ["value1", "value2"]
   - For SINGLE-SELECT, pass a single string value: "value1"

3. **click** - Click buttons or links  
   Example: { "action": "click", "target": "button.submit-btn", "parameters": {} }

4. **submit** - Submit a form
   Example: { "action": "submit", "target": "form#contact-form", "parameters": {} }

5. **check/uncheck** - Toggle checkboxes
   Example: { "action": "check", "target": "#terms-checkbox", "parameters": {} }

CRITICAL RULES:
- NEVER use "click" action on dropdowns/selects - use "select" instead!
- When user asks "what options are available?", just read them from the context above
- The context shows all dropdown options - don't say you need to click to see them
- For select actions, ALWAYS use the value from "(value: xxx)", NOT the display label!
- For MULTI-SELECT dropdowns, use an array of values in parameters
- For SINGLE-SELECT dropdowns, use a single string value in parameters
- Always include "parameters": {} even if empty
- Format actions as JSON inside triple backticks with json language tag

HANDLING AMBIGUITY - ASK FOR CLARIFICATION:
When multiple elements have similar labels, it's better to ASK than to guess wrong!

If you find multiple fields that could match the user's request:
  1. List the available options with their locations/context
  2. Ask the user which one they meant
  3. DO NOT execute an action until you're confident

Example response when ambiguous:
"I found multiple fields that could be 'user name':
- Name (#name) - in the Standard Form Elements section
- Username (#username) - in the User Information section  
- User Name (#user-name-state) - in the Proxy-Based Tracking section

Which one would you like me to update?"

ONLY proceed without asking if:
- The user explicitly mentioned a section (e.g., "in Proxy-Based Tracking")
- There's only ONE field that closely matches the user's wording
- The context makes it completely clear which field they mean

When the user specifies a section, ONLY consider elements under that section heading.

HOW TO ANSWER "What are the available options?":
- Look in the context above for the select/combobox element
- Find the option entries with their labels and values
- List the human-readable labels in your response
- Example: "The available roles are: Developer, Designer, and Manager"
- But remember to use the VALUES when performing select actions!

MULTI-SELECT EXAMPLE:
If you see: [MULTI-SELECT OPTIONS: "JavaScript" (value: js), "Python" (value: python), "Java" (value: java)]
To select multiple: { "action": "select", "target": "#skills", "parameters": { "value": ["js", "python"] } }

Respond conversationally and include JSON commands when performing actions.`;
  }

  /**
   * Send request to Claude API (or proxy)
   */
  async chat(prompt: string, _context: PageContext, contextString: string): Promise<string> {
    const systemPrompt = this.formatContext(_context, contextString);

    console.log('\n===========================================');
    console.log('📤 FULL PROMPT SENT TO CLAUDE');
    console.log('===========================================');
    console.log('SYSTEM PROMPT:');
    console.log(systemPrompt);
    console.log('\n-------------------------------------------');
    console.log('USER MESSAGE:');
    console.log(prompt);
    console.log('===========================================\n');

    // Use proxy if configured, otherwise direct API call
    const url = this.proxyUrl 
      ? `${this.proxyUrl}/api/chat`
      : 'https://api.anthropic.com/v1/messages';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add API key for direct calls, proxy handles it server-side
    if (!this.proxyUrl) {
      headers['x-api-key'] = this.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    
    console.log('\n===========================================');
    console.log('📥 FULL RESPONSE FROM CLAUDE');
    console.log('===========================================');
    console.log(responseText);
    console.log('===========================================\n');
    
    return responseText;
  }

  /**
   * Parse Claude response to extract action commands
   * Returns an array of actions (can be empty if no actions found)
   */
  parseResponse(response: string): any[] {
    try {
      const actions: any[] = [];
      // Extract all JSON blocks from code fences or inline
      const jsonBlockRegex = /```json\s*\n?([\s\S]*?)\n?```|\{[\s\S]*?\}/g;
      let match;
      
      while ((match = jsonBlockRegex.exec(response)) !== null) {
        try {
          // Try the code fence content first, then the whole match
          const jsonStr = match[1] || match[0];
          const parsed = JSON.parse(jsonStr);
          // Only add if it looks like an action (has 'action' and 'target' fields)
          if (parsed.action && parsed.target) {
            actions.push(parsed);
          }
        } catch {
          // Skip invalid JSON
          continue;
        }
      }
      
      return actions;
    } catch {
      return [];
    }
  }
}

