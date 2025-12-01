export default async function handler(req, res) {
  // 允许跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: '请提供图片数据' });
    }

    // ⚠️ 注意：这里要换成你的DeepSeek API密钥！
    const DEEPSEEK_API_KEY = 'sk-你的API密钥放在这里';
    
    // 调用DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请分析这张消费截图，提取金额、时间、商户、支付方式、分类信息，返回纯JSON格式'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    // 简化处理，直接返回AI的响应
    const content = data.choices[0].message.content;
    
    // 尝试解析JSON
    try {
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = content.substring(jsonStart, jsonEnd + 1);
        const result = JSON.parse(jsonStr);
        return res.status(200).json(result);
      }
    } catch (e) {
      // 如果解析失败，返回原始文本
      return res.status(200).json({
        text: content,
        parsed: false
      });
    }
    
    return res.status(200).json({ text: content });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: '服务器错误',
      message: error.message 
    });
  }
}
