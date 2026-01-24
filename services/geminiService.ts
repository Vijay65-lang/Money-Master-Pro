
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Initialize Gemini AI client with named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (
  query: string,
  contextData: string
): Promise<string> => {
  if (!process.env.API_KEY) return "API Key is missing. Please configure your environment variables in Vercel.";

  try {
    // Using gemini-3-flash-preview for financial advice summary as per guidelines
    const model = "gemini-3-flash-preview";
    const systemInstruction = `You are 'Money Master Brain', an elite financial strategist for the 'Money Master Pro' app.

    YOUR STYLE:
    - **Concise & Punchy:** No fluff. Get straight to the numbers.
    - **Structured:** Use formatting like **Bold** headers and lists.
    - **Realistic:** Always account for inflation and realistic market conditions.
    - **Emoji Use:** Use 1-2 relevant emojis to make it engaging but professional.

    YOUR TASK:
    Analyze the user's data and answer their question.
    
    IF ASKED FOR A SUMMARY:
    Provide a "Financial Health Card":
    1. **Net Flow:** (Income - Expense) status.
    2. **Spending Alert:** Identify the biggest expense category.
    3. **Action Item:** One specific thing they should do today.

    DATA CONTEXT provided by app:
    ${contextData}
    
    Keep the response under 150 words. Use the user's specific currency symbol.`;

    const response = await ai.models.generateContent({
      model,
      contents: `User Question: ${query}`,
      config: {
        systemInstruction,
      },
    });

    // Access .text property directly
    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the financial brain right now.";
  }
};

export const categorizeExpense = async (title: string): Promise<string> => {
  if (!process.env.API_KEY) return "Others";

  try {
    // Using gemini-3-flash-preview for categorization tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Categorize this expense title into one of these exact categories: Food, Travel, Shopping, Bills & EMI, Movies/Fun, Groceries, Medical, Others. Return ONLY the category name. Title: "${title}"`,
    });
    // Access .text property directly
    return response.text?.trim() || "Others";
  } catch (e) {
    return "Others";
  }
};
