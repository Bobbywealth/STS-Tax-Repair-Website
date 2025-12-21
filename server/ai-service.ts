import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { mysqlDb } from './mysql-db';
import { aiDocumentAnalysis } from '@shared/mysql-schema';
import type { AiDocumentAnalysis, AiAnalysisType } from '@shared/mysql-schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Initialize OpenAI client only if API key is provided
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('[AI] OPENAI_API_KEY is missing. AI features will be disabled.');
}

// Helper to ensure OpenAI is configured
function ensureOpenAI() {
  if (!openai) {
    throw new Error('AI service not configured. Please add OPENAI_API_KEY to environment variables.');
  }
  return openai;
}

// Default model to use
// NOTE: Prefer a currently-available default; can be overridden via OPENAI_MODEL.
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Tax-specific system prompt for the AI assistant
const TAX_ASSISTANT_SYSTEM_PROMPT = `You are an expert AI Tax Assistant for STS TaxRepair, a professional tax preparation service. You help tax office agents and staff with:

1. **Tax Knowledge**: IRS tax code interpretation, form explanations (W-2, 1099, 1040, etc.), deduction eligibility, filing status recommendations, and deadline tracking.

2. **Document Analysis**: When provided with document content, extract key information, identify potential issues, and explain fields clearly.

3. **Client Support**: Help agents answer client questions, explain tax concepts in simple terms, and provide accurate guidance.

4. **Form Guidance**: Explain form fields, requirements, and common mistakes to avoid.

Guidelines:
- Always provide accurate, up-to-date tax information
- When unsure, recommend consulting IRS publications or a licensed tax professional
- Use clear, professional language suitable for tax professionals
- Reference specific IRS forms, publications, or tax code sections when applicable
- For complex situations, suggest escalation to a senior tax preparer
- Never provide specific tax advice that requires knowing all of a taxpayer's circumstances
- When analyzing documents, highlight important figures and potential red flags

Current tax year context: ${new Date().getFullYear()}`;

// Generate a unique ID
function generateId(): string {
  return randomUUID();
}

// Document text extraction
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error('Failed to extract text from image');
  }
}

export async function extractDocumentText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(buffer);
  } else if (mimeType.startsWith('image/')) {
    return extractTextFromImage(buffer);
  }
  throw new Error(`Unsupported document type: ${mimeType}`);
}

// Document analysis
export async function analyzeDocument(
  documentId: string,
  analysisType: AiAnalysisType,
  extractedText: string,
  additionalContext?: string
): Promise<AiDocumentAnalysis> {
  // Check for cached analysis
  const [existingAnalysis] = await mysqlDb.select()
    .from(aiDocumentAnalysis)
    .where(and(
      eq(aiDocumentAnalysis.documentId, documentId),
      eq(aiDocumentAnalysis.analysisType, analysisType)
    ));
  
  if (existingAnalysis) {
    return existingAnalysis;
  }
  
  let prompt: string;
  
  switch (analysisType) {
    case 'extraction':
      prompt = `Extract all key tax-related information from this document. Identify the document type (W-2, 1099, etc.) and list all relevant fields with their values in a structured format.

Document content:
${extractedText}`;
      break;
    
    case 'validation':
      prompt = `Validate this tax document for completeness and potential issues. Check for:
- Missing required fields
- Inconsistent information
- Mathematical errors
- Common mistakes or red flags

Document content:
${extractedText}`;
      break;
    
    case 'comparison':
      prompt = `Compare and analyze the following documents, identifying:
- Key differences between documents
- Potential discrepancies that need attention
- Trends or changes over time

Documents:
${extractedText}

${additionalContext || ''}`;
      break;
    
    case 'summary':
      prompt = `Provide a clear, concise summary of this tax document including:
- Document type and purpose
- Key figures (income, withholding, etc.)
- Important dates
- Any notable items requiring attention

Document content:
${extractedText}`;
      break;
    
    default:
      prompt = `Analyze this tax document and provide relevant insights:

Document content:
${extractedText}`;
  }
  
  try {
    const ai = ensureOpenAI();
    const completion = await ai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: TAX_ASSISTANT_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 2000,
    });
    
    const result = completion.choices[0]?.message?.content || 'Analysis could not be completed.';
    
    // Detect document type from analysis
    const metadata: Record<string, unknown> = {
      documentType: detectDocumentType(extractedText),
      analyzedAt: new Date().toISOString(),
      model: DEFAULT_MODEL,
      tokenUsage: completion.usage,
    };
    
    // Save analysis to cache
    const id = generateId();
    await mysqlDb.insert(aiDocumentAnalysis).values({
      id,
      documentId,
      analysisType,
      result: { analysis: result },
      extractedText,
      metadata,
    });
    
    const [savedAnalysis] = await mysqlDb.select()
      .from(aiDocumentAnalysis)
      .where(eq(aiDocumentAnalysis.id, id));
    
    return savedAnalysis;
  } catch (error) {
    console.error('Document analysis error:', error);
    throw new Error('Failed to analyze document');
  }
}

// Detect document type from content
function detectDocumentType(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('w-2') || lowerText.includes('wage and tax statement')) {
    return 'W-2';
  }
  if (lowerText.includes('1099-nec') || lowerText.includes('nonemployee compensation')) {
    return '1099-NEC';
  }
  if (lowerText.includes('1099-misc') || lowerText.includes('miscellaneous income')) {
    return '1099-MISC';
  }
  if (lowerText.includes('1099-int') || lowerText.includes('interest income')) {
    return '1099-INT';
  }
  if (lowerText.includes('1099-div') || lowerText.includes('dividends and distributions')) {
    return '1099-DIV';
  }
  if (lowerText.includes('1099-r') || lowerText.includes('distributions from pensions')) {
    return '1099-R';
  }
  if (lowerText.includes('1098') || lowerText.includes('mortgage interest')) {
    return '1098';
  }
  if (lowerText.includes('1040') || lowerText.includes('u.s. individual income tax return')) {
    return '1040';
  }
  if (lowerText.includes('form 8879') || lowerText.includes('irs e-file signature authorization')) {
    return 'Form 8879';
  }
  
  return 'Unknown';
}

// Chat completion with context (no message persistence)
export interface ChatCompletionOptions {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  documentContext?: string[];
}

export async function getChatCompletion(options: ChatCompletionOptions): Promise<{
  response: string;
  tokenCount: number;
}> {
  const { message, conversationHistory, documentContext } = options;
  
  // Build messages array for OpenAI
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: TAX_ASSISTANT_SYSTEM_PROMPT }
  ];
  
  // Add conversation history from client (last 10 messages)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }
  
  // Build user message with optional document context
  let userMessage = message;
  if (documentContext && documentContext.length > 0) {
    userMessage = `[The user has provided the following document(s) for context:]

${documentContext.map((doc, i) => `--- Document ${i + 1} ---\n${doc}\n`).join('\n')}

[User's question:]
${message}`;
  }
  
  messages.push({ role: 'user', content: userMessage });
  
  try {
    const ai = ensureOpenAI();
    const completion = await ai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const response = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';
    const tokenCount = completion.usage?.total_tokens || 0;
    
    return { response, tokenCount };
  } catch (error: unknown) {
    console.error('Chat completion error:', error);
    
    // Handle rate limiting
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
    }
    
    // Handle API key issues
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 401) {
      throw new Error('AI service authentication error. Please contact support.');
    }
    
    throw new Error('Failed to get AI response. Please try again.');
  }
}

// Quick question mode
export async function getQuickAnswer(question: string, documentContext?: string): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: TAX_ASSISTANT_SYSTEM_PROMPT }
  ];
  
  let userMessage = question;
  if (documentContext) {
    userMessage = `[Document context:]
${documentContext}

[Question:]
${question}`;
  }
  
  messages.push({ role: 'user', content: userMessage });
  
  try {
    const ai = ensureOpenAI();
    const completion = await ai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    return completion.choices[0]?.message?.content || 'Unable to provide an answer. Please try again.';
  } catch (error) {
    console.error('Quick answer error:', error);
    throw new Error('Failed to get AI response');
  }
}

// Batch document comparison
export async function compareDocuments(documentTexts: string[], query?: string): Promise<string> {
  const prompt = query 
    ? `Compare the following documents and answer this specific question: ${query}

Documents:
${documentTexts.map((text, i) => `--- Document ${i + 1} ---\n${text}\n`).join('\n')}`
    : `Compare the following documents, highlighting:
1. Key differences between them
2. Inconsistencies or discrepancies
3. Trends or changes if from different years
4. Any items requiring attention

Documents:
${documentTexts.map((text, i) => `--- Document ${i + 1} ---\n${text}\n`).join('\n')}`;

  try {
    const ai = ensureOpenAI();
    const completion = await ai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: TAX_ASSISTANT_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2500,
    });
    
    return completion.choices[0]?.message?.content || 'Unable to compare documents.';
  } catch (error) {
    console.error('Document comparison error:', error);
    throw new Error('Failed to compare documents');
  }
}

// Export types for use in routes
export type { AiDocumentAnalysis };

