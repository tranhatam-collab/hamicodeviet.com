import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { createLogger } from '../lib/observability';

const ai = new Hono<AppBindings>();
const aiLogger = createLogger('ai');

// Auth middleware
ai.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  c.set('user', { id: payload.sub, email: payload.email });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');

  await next();
});

// GET /ai/agents — list all active AI agents
ai.get('/agents', async (c) => {
  const sql = getDb(c.env);
  const agents = await sql`
    SELECT id, name, name_vi, description, description_vi, agent_type,
           capabilities, safety_level, age_restriction
    FROM ai_agents
    WHERE active = true
    ORDER BY agent_type, name
  `;
  return c.json({ agents });
});

// GET /ai/agents/:id — get single agent details
ai.get('/agents/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'missing_agent_id' }, 400);
  const sql = getDb(c.env);
  const [agent] = await sql`
    SELECT * FROM ai_agents WHERE id = ${id} AND active = true
  `;
  if (!agent) return c.json({ error: 'agent_not_found' }, 404);
  return c.json({ agent });
});

// POST /ai/conversations — create a new conversation
ai.post('/conversations', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const agentId = body.agentId || 'tutor';
  const title = body.title || 'New Conversation';
  const user = c.get('user') as any;

  const sql = getDb(c.env);

  // Verify agent exists
  const [agent] = await sql`
    SELECT id, name, agent_type, endpoint, model, safety_level, age_restriction
    FROM ai_agents WHERE id = ${agentId} AND active = true
  `;
  if (!agent) return c.json({ error: 'agent_not_found' }, 404);

  // Create conversation
  const [conversation] = await sql`
    INSERT INTO ai_conversations (user_id, agent_id, title, status)
    VALUES (${user.id}, ${agentId}, ${title}, 'active')
    RETURNING *
  `;

  aiLogger.info('Conversation created', {
    userId: user.id,
    conversationId: conversation.id,
    agentId,
  });

  return c.json({ conversation, agent }, 201);
});

// GET /ai/conversations — list user's conversations
ai.get('/conversations', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const page = Number(c.req.query('page')) || 1;
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const offset = (page - 1) * limit;

  const conversations = await sql`
    SELECT c.id, c.title, c.status, c.agent_id, c.created_at, c.updated_at,
           a.name as agent_name, a.name_vi as agent_name_vi,
           (SELECT count(*) FROM ai_messages WHERE conversation_id = c.id) as message_count
    FROM ai_conversations c
    JOIN ai_agents a ON c.agent_id = a.id
    WHERE c.user_id = ${user.id}
    ORDER BY c.updated_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const [count] = await sql`
    SELECT count(*) as total FROM ai_conversations WHERE user_id = ${user.id}
  `;

  return c.json({ conversations, total: count.total, page, limit });
});

// GET /ai/conversations/:id — get conversation with messages
ai.get('/conversations/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'missing_conversation_id' }, 400);
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [conversation] = await sql`
    SELECT c.*, a.name as agent_name, a.name_vi as agent_name_vi,
           a.agent_type, a.model, a.capabilities
    FROM ai_conversations c
    JOIN ai_agents a ON c.agent_id = a.id
    WHERE c.id = ${id} AND c.user_id = ${user.id}
  `;
  if (!conversation) return c.json({ error: 'conversation_not_found' }, 404);

  const messages = await sql`
    SELECT id, role, content, metadata, created_at
    FROM ai_messages
    WHERE conversation_id = ${id}
    ORDER BY created_at ASC
  `;

  return c.json({ conversation, messages });
});

// POST /ai/conversations/:id/messages — send a message and get AI response
ai.post('/conversations/:id/messages', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'missing_conversation_id' }, 400);
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  // Verify conversation belongs to user
  const [conversation] = await sql`
    SELECT c.*, a.endpoint, a.model, a.agent_type, a.safety_level
    FROM ai_conversations c
    JOIN ai_agents a ON c.agent_id = a.id
    WHERE c.id = ${id} AND c.user_id = ${user.id} AND c.status = 'active'
  `;
  if (!conversation) return c.json({ error: 'conversation_not_found' }, 404);

  // Save user message
  const [userMessage] = await sql`
    INSERT INTO ai_messages (conversation_id, role, content)
    VALUES (${id}, 'user', ${body.message})
    RETURNING *
  `;

  // Update conversation timestamp
  await sql`
    UPDATE ai_conversations SET updated_at = now() WHERE id = ${id}
  `;

  // Get conversation history for context
  const history = await sql`
    SELECT role, content FROM ai_messages
    WHERE conversation_id = ${id}
    ORDER BY created_at ASC
    LIMIT 50
  `;

  // Call Cloudflare Workers AI (built-in, no external API key needed)
  let aiResponse: string;
  let metadata: any = { model: 'llama-3.3-70b-instruct-fp8-fast' };

  // Build system prompt based on agent type
  const systemPrompts: Record<string, string> = {
    tutor: 'Bạn là AI Gia sư, một trợ lý học tập cá nhân hóa cho nền tảng giáo dục HaMi Code Việt. Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt hoặc tiếng Anh tùy người dùng. Giúp người học hiểu khái niệm, giải bài tập, và viết code.',
    mentor: 'Bạn là AI Mentor, hướng dẫn nghề nghiệp và phát triển kỹ năng. Cung cấp lời khuyên thực tế về con đường sự nghiệp trong lĩnh vực công nghệ.',
    code_reviewer: 'Bạn là Code Reviewer. Review code, gợi ý cải thiện, và giải thích best practices. Luôn đưa ra ví dụ code cụ thể.',
    quiz_generator: 'Bạn là Quiz Generator. Tạo câu hỏi trắc nghiệm và bài tập đánh giá kiến thức. Đưa ra câu hỏi + đáp án + giải thích.',
    content_creator: 'Bạn là Content Creator. Tạo nội dung học tập song ngữ Việt-Anh, giải thích khái niệm phức tạp một cách đơn giản.',
    translator: 'Bạn là Translator. Dịch thuật Việt-Anh và Anh-Việt, giữ nguyên ngữ cảnh văn hóa và kỹ thuật.',
    analyzer: 'Bạn là Learning Analyzer. Phân tích tiến độ học tập, xác định điểm yếu, và đề xuất kế hoạch cải thiện.',
    safety_monitor: 'Bạn là Safety Monitor. Đảm bảo nội dung an toàn cho trẻ em, lọc nội dung không phù hợp.',
    accessibility: 'Bạn là Accessibility Helper. Giúp người dùng sử dụng tính năng khả năng truy cập, giải thích đơn giản hóa.',
    project_helper: 'Bạn là Project Helper. Hỗ trợ phát triển dự án: lập kế hoạch, viết code, debug.',
    community_moderator: 'Bạn là Community Moderator. Hướng dẫn quy tắc cộng đồng, giải quyết xung đột.',
  };

  const systemPrompt = systemPrompts[conversation.agent_type] || systemPrompts.tutor;

  // Build messages array for Workers AI
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map((h: any) => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content,
    })),
  ];

  try {
    const aiResult = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages,
      max_tokens: 512,
    });

    aiResponse = (aiResult as any).response || 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại.';
    metadata.tokens = (aiResult as any).usage?.total_tokens || 0;
    metadata.provider = 'cloudflare-workers-ai';
  } catch (error) {
    aiLogger.error('Workers AI call failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    aiResponse = 'Có lỗi xảy ra khi xử lý AI. Vui lòng thử lại sau.';
    metadata.error = error instanceof Error ? error.message : String(error);
  }

  // Save AI response
  const [aiMessage] = await sql`
    INSERT INTO ai_messages (conversation_id, role, content, metadata)
    VALUES (${id}, 'assistant', ${aiResponse}, ${JSON.stringify(metadata)}::jsonb)
    RETURNING *
  `;

  // Track usage if ai_usage table exists
  try {
    await sql`
      INSERT INTO ai_usage (user_id, tokens_used, model)
      VALUES (${user.id}, ${metadata.tokens || 0}, ${conversation.model})
    `;
  } catch {
    // ai_usage table might not exist — ignore
  }

  return c.json({
    userMessage,
    aiMessage,
  });
});

// DELETE /ai/conversations/:id — delete a conversation
ai.delete('/conversations/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'missing_conversation_id' }, 400);
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [deleted] = await sql`
    DELETE FROM ai_conversations
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id
  `;
  if (!deleted) return c.json({ error: 'conversation_not_found' }, 404);

  return c.json({ success: true });
});

// GET /ai/usage — get user's AI usage stats
ai.get('/usage', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  try {
    const [stats] = await sql`
      SELECT count(*) as total_requests,
             coalesce(sum(tokens_used), 0) as total_tokens,
             max(created_at) as last_used
      FROM ai_usage
      WHERE user_id = ${user.id}
    `;
    return c.json({ usage: stats });
  } catch {
    return c.json({ usage: { total_requests: 0, total_tokens: 0, last_used: null } });
  }
});

export default ai;
