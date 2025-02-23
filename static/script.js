// 格式化内容的函数
function formatContent(content) {
    // 直接处理内容，不需要分割
    return `
        <div class="card-container">
            ${generateKnowledgeCard(content)}
        </div>
    `;
}

// 添加相关样式
const style = document.createElement('style');
style.textContent = `
    .knowledge-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin: 20px 0;
    }

    .knowledge-card h3 {
        color: #2c3e50;
        margin: 20px 0 15px 0;
        padding-bottom: 8px;
        border-bottom: 2px solid #eee;
    }

    .knowledge-card p {
        color: #34495e;
        line-height: 1.6;
        margin: 10px 0;
    }

    .list-item {
        display: flex;
        align-items: flex-start;
        margin: 8px 0;
        padding-left: 20px;
    }

    .bullet {
        color: #3498db;
        margin-right: 8px;
    }

    .text {
        color: #34495e;
        line-height: 1.5;
    }

    .section {
        margin: 15px 0;
    }

    .section:first-child h3 {
        margin-top: 0;
    }

    .card-container {
        margin: 20px auto;
        max-width: 850px;
        padding: 0;
    }

    .card-container svg {
        width: 100%;
        height: auto;
        display: block;
    }
`;
document.head.appendChild(style);

// 生成主题的函数（保持不变）
async function generateTopic() {
    const topicInput = document.getElementById('topic');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    
    if (!topicInput.value.trim()) {
        alert('请输入要了解的领域！');
        return;
    }

    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';

    try {
        const response = await fetch('/generate', {  // 更新端口号
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'same-origin',
            body: JSON.stringify({
                topic: topicInput.value
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.result) {
            throw new Error('返回数据格式错误');
        }
        resultDiv.innerHTML = formatContent(data.result);
    } catch (error) {
        console.error('Error details:', error);
        resultDiv.innerHTML = `
            <div class="error" style="color: #e74c3c; padding: 20px; text-align: center; background: #fdf0ed; border-radius: 8px;">
                <div style="font-weight: bold; margin-bottom: 10px;">请求失败</div>
                <div>${error.message || '服务器连接失败，请检查后端服务是否正常运行'}</div>
            </div>
        `;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// 添加事件监听器
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('topic').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            generateTopic();
        }
    });
});

function generateKnowledgeCard(content) {
    // 清理内容，移除所有 ** 符号
    content = content.replace(/\*\*/g, '').trim();
    const lines = content.split('\n').filter(Boolean);
    
    const cardWidth = 850;
    const lineHeight = 45;
    const padding = 20;
    const titleSpacing = 60;
    const leftPadding = 40;   // 左侧留白
    const rightPadding = 40;  // 右侧留白
    
    // 计算实际可用宽度（考虑两侧留白和安全边距）
    const usableWidth = cardWidth - leftPadding - rightPadding - 20; // 额外减少20px作为安全边距
    
    // 预计算高度
    let totalHeight = padding * 2;
    lines.forEach(line => {
        if (line.startsWith('###')) {
            totalHeight += titleSpacing + 40;
        } else if (line.startsWith('####')) {
            totalHeight += titleSpacing + 30;
        } else {
            const textLength = line.length;
            const charsPerLine = Math.floor(usableWidth / 16); // 使用相同的字符宽度估算
            const linesNeeded = Math.ceil(textLength / charsPerLine);
            totalHeight += lineHeight * linesNeeded + 20;
        }
    });
    
    // 设置初始预估高度
    const estimatedHeight = Math.max(2000, totalHeight + 400);
    
    let svg = `
        <svg width="${cardWidth}" height="${estimatedHeight}" viewBox="0 0 ${cardWidth} ${estimatedHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- 主渐变背景 -->
                <linearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#1a365d"/>
                    <stop offset="100%" stop-color="#2c5282"/>
                </linearGradient>
                
                <!-- 装饰性渐变 -->
                <linearGradient id="accentGradient" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#4299e1" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#2b6cb0" stop-opacity="0.1"/>
                </linearGradient>

                <!-- 卡片阴影 -->
                <filter id="cardShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                    <feOffset dx="0" dy="4" result="offsetblur"/>
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>

                <!-- 星星图案 -->
                <pattern id="stars" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                    <circle cx="25" cy="25" r="1" fill="white" opacity="0.3"/>
                    <circle cx="10" cy="10" r="0.5" fill="white" opacity="0.2"/>
                    <circle cx="40" cy="40" r="0.7" fill="white" opacity="0.2"/>
                    <circle cx="10" cy="40" r="0.5" fill="white" opacity="0.2"/>
                    <circle cx="40" cy="10" r="0.7" fill="white" opacity="0.2"/>
                </pattern>

                <!-- 文本阴影 -->
                <filter id="textShadow">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3" flood-color="#000"/>
                </filter>

                <!-- 添加文本换行支持 -->
                <style type="text/css">
                    text { white-space: pre-wrap; }
                </style>
            </defs>

            <!-- 主背景 -->
            <rect x="20" y="20" width="${cardWidth - 40}" height="${estimatedHeight - 40}" 
                rx="20" ry="20" 
                fill="url(#cardGradient)"
                filter="url(#cardShadow)"
            />

            <!-- 装饰背景 -->
            <rect x="20" y="20" width="${cardWidth - 40}" height="${estimatedHeight - 40}" 
                rx="20" ry="20" 
                fill="url(#stars)"
            />

            <!-- 装饰性曲线 -->
            <path d="M 15 120 Q ${cardWidth/2} 80, ${cardWidth - 15} 120" 
                stroke="url(#accentGradient)" 
                stroke-width="2" 
                fill="none"
            />
    `;

    let y = 120;
    
    function wrapText(text, maxWidth, x, y, fontSize) {
        const chars = text.split('');
        let currentLine = '';
        let lines = [];
        
        // 调整字符宽度估算，确保文本不会超出右边界
        const averageCharWidth = 20;  // 增加字符宽度估算值以强制更频繁换行
        const charsPerLine = Math.floor((maxWidth) / averageCharWidth);
        
        for (let i = 0; i < chars.length; i++) {
            currentLine += chars[i];
            // 当前行达到最大长度时换行
            if (currentLine.length >= charsPerLine) {
                lines.push(currentLine);
                currentLine = '';
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        
        let result = '';
        let currentY = y;
        lines.forEach(line => {
            // 确保每行文本都在可用宽度内
            result += `<text x="${x}" y="${currentY}" font-size="${fontSize}" fill="white" opacity="0.9">${line.trim()}</text>`;
            currentY += lineHeight;
        });
        
        return {
            svg: result,
            endY: currentY
        };
    }

    // 修改文本渲染部分
    lines.forEach(line => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('###')) {  // 主标题
            const title = trimmedLine.replace(/^###\s*/, '').trim();
            svg += `<text x="${cardWidth/2}" y="${y}" font-size="32" font-weight="bold" fill="white" filter="url(#textShadow)" text-anchor="middle">${title}</text>`;
            y += 60;
        } else if (trimmedLine.startsWith('####')) {  // 子标题
            const title = trimmedLine.replace(/^####\s*/, '').trim();
            svg += `<text x="${leftPadding}" y="${y}" font-size="28" font-weight="bold" fill="white" filter="url(#textShadow)">${title}</text>`;
            y += 50;
        } else if (trimmedLine.startsWith('•')) {  // 列表项
            const text = trimmedLine.substring(1).trim();
            const wrapped = wrapText(text, usableWidth, leftPadding, y, 20);
            svg += wrapped.svg;
            y = wrapped.endY + 20;
        } else {  // 普通文本
            const wrapped = wrapText(trimmedLine, usableWidth, leftPadding, y, 20);
            svg += wrapped.svg;
            y = wrapped.endY + 20;
        }
    });

    // 确保有足够的底部空间
    const finalHeight = y + padding * 3;  // 增加更多底部空间
    svg = svg.replace(
        `height="${estimatedHeight}" viewBox="0 0 ${cardWidth} ${estimatedHeight}"`,
        `height="${finalHeight}" viewBox="0 0 ${cardWidth} ${finalHeight}"`
    );
    
    svg += '</svg>';
    return svg;
} 