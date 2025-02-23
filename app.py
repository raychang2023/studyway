from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import openai
import os
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化 Flask
app = Flask(__name__,
    static_url_path='',
    static_folder='static',
    template_folder='templates'
)
CORS(app)

# 设置 OpenAI 配置（从环境变量获取 API Key）
OPENAI_API_KEY = os.getenv("DASHSCOPE_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("❌ ERROR: DASHSCOPE_API_KEY 环境变量未设置，请检查配置！")

client = openai.OpenAI(
    api_key=OPENAI_API_KEY,
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

# 首页路由
@app.route('/')
def home():
    return render_template('index.html')

# 处理 API 生成请求
@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        if not data or 'topic' not in data:
            return jsonify({"error": "请输入要学习的领域"}), 400
        
        topic = data['topic'].strip()
        if not topic:
            return jsonify({"error": "主题不能为空"}), 400

        logger.info(f"生成学习内容: {topic}")
        
        # 生成 prompt
        prompt = create_prompt(topic)
        
        # 生成内容
        result = generate_content(prompt)

        return jsonify({"result": result})
    except Exception as e:
        logger.error(f"处理请求时发生错误: {str(e)}")
        return jsonify({"error": str(e)}), 500

def create_prompt(topic: str) -> str:
    return f"""
    请为主题 "{topic}" 生成以下两部分内容：

    ### 第一部分：五分钟扫盲
    1. 它是什么？
    - 给出准确、简洁的定义
    - 解释其基本概念和核心特征
    
    2. 它为什么重要？
    - 说明其实际价值和意义
    - 描述其影响和应用领域
    
    3. 它有哪些主要类型？
    - 列举主要分类或种类
    - 简要说明各类型的特点
    
    4. 它基本是怎么运作的？
    - 解释其基本工作原理
    - 描述关键的运作机制
    
    5. 用一个比喻/例子来理解
    - 提供一个生动的类比
    - 举一个具体的实际例子
    
    ### 第二部分：学习框架
    1. 学习目标
    - 入门级：掌握基础概念和常用操作
    - 进阶级：深入理解原理和最佳实践
    - 专家级：掌握高级特性和行业前沿
    
    2. 核心知识点
    - 列出必须掌握的关键概念
    - 指出重点和难点
    
    3. 学习路径
    - 按照循序渐进的顺序列出学习步骤
    - 说明每个阶段的重点内容
    
    4. 推荐资源
    - 入门教程和文档
    - 进阶书籍和课程
    - 实用工具和平台
    
    5. 实践项目
    - 入门级练习项目
    - 进阶实战项目
    - 高级综合项目
    
    请用清晰、专业但易懂的语言回答，确保内容准确且有深度。
    """

def generate_content(prompt: str) -> str:
    try:
        completion = client.chat.completions.create(
            model="qwen-max",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000
        )
        return completion.choices[0].message.content
    except Exception as e:
        logger.error(f"调用 OpenAI API 发生错误: {str(e)}")
        raise Exception("API 调用失败")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)

