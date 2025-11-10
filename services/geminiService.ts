import { GoogleGenAI } from "@google/genai";
import { ImageFile, Model, ProjectType, GeneratedFile, GenerationResult, LogEntry } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "PLACEHOLDER_API_KEY";

if (apiKey === "PLACEHOLDER_API_KEY") {
    console.warn("VITE_GEMINI_API_KEY environment variable not set. Please set your Google Gemini API key.");
}

const ai = new GoogleGenAI({ apiKey });

const getSystemInstruction = (projectType: ProjectType, isSearchEnabled: boolean): string => {
  const searchInstruction = isSearchEnabled 
    ? "You have the ability to search Google for up-to-date information, find relevant image URLs, and incorporate them into the code."
    : "You must generate the code based only on your existing knowledge. Do not use external information.";

  let projectInstruction = "";
  switch (projectType) {
    case 'react':
      projectInstruction = "For a 'react' project, you MUST generate a single file named `App.tsx`. ALL code, including CSS styles, must be contained within this single file. Do NOT generate any other files like `index.css`. CSS should be implemented directly within the TSX file, for example, by creating a `<style>` tag as a string and rendering it, or by using inline style objects. The final output must be 100% self-contained in one file.";
      break;
    case 'html-css-js-complex':
      projectInstruction = "For an 'html-css-js-complex' project, you MUST generate a more complex, multi-file application. It is expected that you create at least 5 files (e.g., index.html, multiple CSS files for layout/components, multiple JS files for different functionalities like API handling, UI logic, etc.). This is for creating sophisticated projects, potentially with multiple views or tabs that are managed via JavaScript.";
      break;
    case 'html-css-js':
    default:
      projectInstruction = "For an 'html-css-js' project, you are not limited to a specific number of files. Generate all necessary files, including a primary index.html. Feel free to create multiple CSS and JavaScript files to ensure the codebase is well-organized and maintainable. This is suitable for simpler, standard web pages.";
      break;
  }

  return `
You are a world-class senior frontend engineer. Your task is to generate a complete and functional web application codebase based on the user's request.
${searchInstruction}
The project type is: ${projectType}.

${projectInstruction}

The code should be modern, clean, and visually appealing using best practices.

IMPORTANT: You MUST ONLY respond with a single, valid JSON array of file objects. Do not include any other text or markdown formatting like \`\`\`json.
Each object in the JSON array represents a file and must have three string keys: "fileName", "language", and "code".
Example of a valid file object: {"fileName": "style.css", "language": "css", "code": "body { font-family: sans-serif; }"}
`;
}

const parseGenerativeResponse = (responseText: string): GeneratedFile[] => {
    let jsonString;

    // Priority 1: Look for a markdown JSON block. This is the most reliable method.
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = responseText.match(jsonBlockRegex);
    
    if (match && match[1]) {
        jsonString = match[1];
    } else {
        // Priority 2: If no markdown, find the last potential JSON array.
        // This version is smarter than the previous one by checking for key properties ("fileName", "code")
        // that should exist in our file list JSON but not in random data arrays inside the code.
        const lastArrayStart = responseText.lastIndexOf('[');
        const lastArrayEnd = responseText.lastIndexOf(']');

        if (lastArrayStart !== -1 && lastArrayEnd !== -1 && lastArrayEnd > lastArrayStart) {
            const potentialJson = responseText.substring(lastArrayStart, lastArrayEnd + 1);
            if (potentialJson.includes('"fileName"') && potentialJson.includes('"code"')) {
                jsonString = potentialJson;
            }
        }
    }
    
    // As a final fallback, if we still haven't found a specific block, maybe the whole response is the JSON.
    if (!jsonString) {
        const trimmedResponse = responseText.trim();
        if (trimmedResponse.startsWith('[') && trimmedResponse.endsWith(']')) {
             jsonString = trimmedResponse;
        }
    }

    if (!jsonString) {
        console.error("Could not extract a valid JSON string from the AI's response. Full response:", responseText);
        throw new Error("The AI returned a response that did not contain a recognizable code structure. Please try again.");
    }
    
    try {
        const parsedResponse = JSON.parse(jsonString);
        if (!Array.isArray(parsedResponse)) {
            throw new Error("The parsed response is not a valid array of files.");
        }
        if (parsedResponse.length > 0 && (typeof parsedResponse[0].fileName === 'undefined' || typeof parsedResponse[0].code === 'undefined')) {
             throw new Error("The parsed array does not appear to contain valid file objects.");
        }
        return parsedResponse as GeneratedFile[];
    } catch(parseError) {
        console.error("Failed to parse extracted JSON string. String was:", jsonString);
        console.error("Original response was:", responseText);
        throw new Error("The AI returned a malformed code structure.");
    }
};

export const generateCode = async (
  prompt: string,
  imageFile: ImageFile | null,
  contextFiles: GeneratedFile[],
  model: Model,
  projectType: ProjectType,
  isSearchEnabled: boolean
): Promise<GenerationResult> => {
  try {
    let fullPrompt = prompt;

    if (contextFiles.length > 0) {
      const contextString = contextFiles.map(file =>
        `--- START FILE: ${file.fileName} ---\n${file.code}\n--- END FILE: ${file.fileName} ---`
      ).join('\n\n');
      
      fullPrompt = `Please use the following files as context for your response. The user may ask you to modify them, or use them as a reference for style, logic, or structure when generating new files.\n\n**CONTEXT FILES:**\n${contextString}\n\n**USER REQUEST:**\n${prompt}`;
    }

    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: fullPrompt }];

    if (imageFile) {
      parts.unshift({
        inlineData: {
          mimeType: imageFile.mimeType,
          data: imageFile.base64,
        },
      });
      parts.push({ text: "\nUse the attached image as a visual reference for the design, layout, and color scheme." });
    }

    const config: any = {
      systemInstruction: getSystemInstruction(projectType, isSearchEnabled),
      temperature: 0.7,
    };

    if (isSearchEnabled) {
      config.tools = [{googleSearch: {}}];
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: config,
    });

    const responseText = response.text.trim();
    const files = parseGenerativeResponse(responseText);
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata ?? null;

    return { files, groundingMetadata };

  } catch (error) {
    console.error("Error in generateCode service:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred during code generation.";
    throw new Error(`Failed to generate code. ${message}`);
  }
};

export const enhancePrompt = async (prompt: string): Promise<string> => {
  if (!prompt.trim()) {
    return prompt;
  }
  try {
    const systemInstruction = `You are a creative and expert prompt engineer. Your task is to rewrite and enhance the user's prompt to make it more descriptive, detailed, and clear for an AI code generation model.
Focus on adding visual details, specifying layout, suggesting color palettes, and clarifying functionality.
The goal is to transform a simple idea into a rich, actionable prompt.
IMPORTANT: You MUST ONLY respond with the enhanced prompt text. Do not include any conversational phrases, explanations, or markdown formatting. Just the new prompt.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error in enhancePrompt service:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred during prompt enhancement.";
    throw new Error(`Failed to enhance prompt. ${message}`);
  }
};

export const fixCode = async (
  files: GeneratedFile[],
  logs: LogEntry[],
  model: Model,
  projectType: ProjectType,
): Promise<GenerationResult> => {
  try {
    const errorLogs = logs.filter(log => log.level === 'error').map(log => log.message).join('\n');
    const filesString = JSON.stringify(files, null, 2);

    const fixPrompt = `
You are an expert debugger. The following code has produced errors in the browser console. 
Your task is to analyze the code and the errors, fix all the issues, and return the complete, corrected codebase.

**Current Codebase (JSON array of file objects):**
\`\`\`json
${filesString}
\`\`\`

**Console Errors:**
\`\`\`
${errorLogs}
\`\`\`

Please fix the bugs. Adhere to the original project goal and structure. The project type is '${projectType}'.
Return ONLY a single valid JSON array of file objects with the corrected code, just like the input format. Do not add any conversational text or markdown formatting.
`;
    
    const config: any = {
      // A simpler system instruction for the fix-it task
      systemInstruction: `You are an expert programmer specializing in debugging web applications. You will receive a codebase and a list of console errors. Your sole purpose is to fix the code and return it in the specified JSON format.`,
      temperature: 0.5, // Lower temperature for more predictable fixes
    };
    
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: fixPrompt }] },
      config: config,
    });

    const responseText = response.text.trim();
    const correctedFiles = parseGenerativeResponse(responseText);
    
    return { files: correctedFiles, groundingMetadata: null }; // No grounding metadata for fix-it tasks

  } catch (error) {
    console.error("Error in fixCode service:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred during code fixing.";
    throw new Error(`Failed to fix code. ${message}`);
  }
};
