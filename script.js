/**
 * 生成学习主题的函数
 * @async
 * @returns {Promise<void>}
 */
async function generateTopic() {
    const topicInput = document.getElementById('topic');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    
    // 检查输入是否为空
    if (!topicInput.value.trim()) {
        alert('请输入要了解的领域！');
        return;
    }

    // 显示加载状态
    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';

    try {
        const response = await fetch('http://localhost:5000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',  // 添加 CORS 模式
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
        // 隐藏加载状态
        loadingDiv.style.display = 'none';
    }
}

/**
 * 添加回车键监听器
 * @param {Event} event - 键盘事件
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('topic').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            generateTopic();
        }
    });

    document.querySelector('button').addEventListener('click', generateTopic);
});

// 格式化主要内容
function formatContent(content) {
    const parts = content.split('# 深入学习框架');
    const quickLearn = parts[0].replace('# 五分钟扫盲', '').trim();
    const deepLearn = parts[1] ? parts[1].trim() : '';

    return `
        <div class="section">
            ${generateKnowledgeCard(quickLearn, 'quick')}
        </div>
        <div class="section">
            ${generateKnowledgeCard(deepLearn, 'deep')}
        </div>
    `;
}

function generateKnowledgeCard(content, type) {
    if (!content) return '';

    // 清理内容
    content = content.replace(/###\s*\*\*/g, '').replace(/\*\*/g, '').trim();
    const lines = content.split('\n').filter(Boolean);
    
    // 计算高度（每行30px + 额外空间）
    const estimatedHeight = Math.max(600, lines.length * 30 + 100);
    const gradientId = `${type}Gradient`;
    const colors = type === 'quick' 
        ? ['#3498db', '#2980b9']
        : ['#e74c3c', '#c0392b'];

    return `
        <svg width="100%" height="${estimatedHeight}" viewBox="0 0 400 ${estimatedHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="${colors[0]}"/>
                    <stop offset="100%" stop-color="${colors[1]}"/>
                </linearGradient>
                <filter id="cardShadow">
                    <feDropShadow dx="3" dy="3" stdDeviation="4" flood-opacity="0.2"/>
                </filter>
            </defs>

            <!-- 背景卡片 -->
            <rect x="10" y="10" width="380" height="${estimatedHeight - 20}" 
                rx="15" ry="15" 
                fill="url(#${gradientId})"
                filter="url(#cardShadow)"
            />

            <!-- 内容 -->
            ${formatLinesForSVG(lines)}
        </svg>
    `;
}

function formatLinesForSVG(lines) {
    let y = 50;
    let svg = '';
    let currentSection = '';

    lines.forEach(line => {
        // 处理标题行（数字开头）
        if (line.match(/^\d+\./)) {
            y += 20;
            svg += `
                <text x="30" y="${y}" font-size="18" font-weight="bold" fill="white">
                    ${line.trim()}
                </text>
            `;
            currentSection = line;
            y += 30;
        }
        // 处理列表项
        else if (line.trim().startsWith('-')) {
            const text = line.trim().substring(1).trim();
            if (text.includes('**')) {
                // 处理带强调的文本
                const parts = text.split('**').filter(Boolean);
                svg += `
                    <text x="45" y="${y}" font-size="14" fill="white">
                        <tspan>•</tspan>
                        <tspan dx="8" font-weight="bold">${parts[0]}</tspan>
                        <tspan dx="4">${parts[1] || ''}</tspan>
                    </text>
                `;
            } else {
                svg += `
                    <text x="45" y="${y}" font-size="14" fill="white">
                        <tspan>•</tspan>
                        <tspan dx="8">${text}</tspan>
                    </text>
                `;
            }
            y += 25;
        }
        // 处理普通文本
        else {
            svg += `
                <text x="30" y="${y}" font-size="14" fill="white">
                    ${line.trim()}
                </text>
            `;
            y += 25;
        }
    });

    return svg;
}

function generateDeepLearnSVG(content) {
    if (!content) return '';
    
    // 移除多余的符号和空格
    content = content.replace(/###\s*\*\*/g, '').replace(/\*\*/g, '').trim();
    
    // 分析内容获取实际高度
    const lines = content.split('\n').filter(Boolean);
    const estimatedHeight = lines.length * 40 + 100;

    return `
        <svg width="100%" height="${estimatedHeight}" viewBox="0 0 800 ${estimatedHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="deepLearnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#e74c3c;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#c0392b;stop-opacity:1" />
                </linearGradient>
            </defs>

            <!-- 背景卡片 -->
            <rect x="10" y="10" width="780" height="${estimatedHeight - 20}" 
                rx="15" ry="15" 
                fill="url(#deepLearnGradient)"
                filter="url(#shadow)"
            />

            ${formatContentToSVG(lines)}
        </svg>
    `;
}

// 格式化每个部分
function formatSection(content) {
    if (!content) return '';
    
    content = content.trim().replace(/#+\s*/g, '');
    const sections = content.split(/📌\s*/).filter(Boolean);

    return sections.map(section => {
        const [title, ...items] = section.split('\n').filter(Boolean);

        // 处理普通列表项
        if (items.length > 0) {
            return items.map(item => {
                const [type, desc] = item.split(/[：:]/);
                return type && desc ? `
                    <div class="item">
                        <span class="item-title">- ${type.trim()}</span>
                        ${desc.trim()}
                    </div>
                ` : '';
            }).join('');
        }

        // 如果只有标题，直接显示
        return `<div class="item">${title}</div>`;
    }).join('\n');
} 