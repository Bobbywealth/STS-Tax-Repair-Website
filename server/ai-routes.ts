import { Router, Request, Response } from 'express';
import { isAuthenticated } from './replitAuth';
import { requireStaff, type AuthenticatedRequest } from './authorization';
import {
  getChatCompletion,
  getQuickAnswer,
  analyzeDocument,
  extractDocumentText,
  compareDocuments,
} from './ai-service';
import type { AiAnalysisType } from '@shared/mysql-schema';

const router = Router();

// Middleware to check if AI is configured
const requireAIConfig = (req: Request, res: Response, next: Function) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ 
      error: 'AI service not configured',
      message: 'Please configure the OPENAI_API_KEY environment variable.'
    });
  }
  next();
};

// Chat endpoint - send a message and get AI response
router.post('/chat', isAuthenticated, requireStaff, requireAIConfig, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, conversationHistory, documentContext } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const result = await getChatCompletion({
      message,
      conversationHistory: conversationHistory || [],
      documentContext: documentContext || [],
    });
    
    res.json({
      response: result.response,
      tokenCount: result.tokenCount,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to get AI response' });
  }
});

// Quick answer endpoint - single question without conversation context
router.post('/quick-answer', isAuthenticated, requireStaff, requireAIConfig, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { question, documentContext } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    const response = await getQuickAnswer(question, documentContext);
    
    res.json({ response });
  } catch (error: any) {
    console.error('AI quick answer error:', error);
    res.status(500).json({ error: error.message || 'Failed to get AI response' });
  }
});

// Analyze document endpoint
router.post('/analyze-document', isAuthenticated, requireStaff, requireAIConfig, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { documentId, analysisType, extractedText, additionalContext } = req.body;
    
    if (!documentId || !analysisType || !extractedText) {
      return res.status(400).json({ error: 'documentId, analysisType, and extractedText are required' });
    }
    
    const validTypes: AiAnalysisType[] = ['extraction', 'validation', 'comparison', 'summary', 'question'];
    if (!validTypes.includes(analysisType)) {
      return res.status(400).json({ error: `Invalid analysisType. Must be one of: ${validTypes.join(', ')}` });
    }
    
    const analysis = await analyzeDocument(documentId, analysisType, extractedText, additionalContext);
    
    res.json(analysis);
  } catch (error: any) {
    console.error('AI document analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze document' });
  }
});

// Extract text from uploaded document
router.post('/extract-text', isAuthenticated, requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('application/octet-stream') && !contentType.includes('application/pdf') && !contentType.includes('image/')) {
      return res.status(400).json({ error: 'Invalid content type. Send document as binary.' });
    }
    
    const mimeType = req.headers['x-mime-type'] as string || contentType.split(';')[0];
    
    // Collect the raw body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'No document data received' });
    }
    
    const text = await extractDocumentText(buffer, mimeType);
    
    res.json({ text, mimeType });
  } catch (error: any) {
    console.error('Text extraction error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract text from document' });
  }
});

// Compare multiple documents
router.post('/compare-documents', isAuthenticated, requireStaff, requireAIConfig, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { documentTexts, query } = req.body;
    
    if (!documentTexts || !Array.isArray(documentTexts) || documentTexts.length < 2) {
      return res.status(400).json({ error: 'At least 2 document texts are required for comparison' });
    }
    
    const comparison = await compareDocuments(documentTexts, query);
    
    res.json({ comparison });
  } catch (error: any) {
    console.error('Document comparison error:', error);
    res.status(500).json({ error: error.message || 'Failed to compare documents' });
  }
});

// Check AI service status
router.get('/status', isAuthenticated, requireStaff, (req: AuthenticatedRequest, res: Response) => {
  const isConfigured = !!process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  
  res.json({
    configured: isConfigured,
    model: isConfigured ? model : null,
    features: {
      chat: isConfigured,
      documentAnalysis: isConfigured,
      textExtraction: true, // Always available
      documentComparison: isConfigured,
    },
  });
});

export default router;




