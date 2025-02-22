from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import openai

app = Flask(__name__, 
    static_url_path='',
    static_folder='static',
    template_folder='templates'
)
CORS(app)

# 设置 OpenAI 配置
client = openai.OpenAI(
    api_key="sk-422f2f8e12fb4319993b78542bd9f00b",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

# 添加路由来服务主页
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "无效的请求数据"}), 400
            
        topic = data.get('topic')
        if not topic:
            return jsonify({"error": "请输入要学习的领域"}), 400

        # 构建提示词
        prompt = f"""请为主题"{topic}"生成以下两部分内容：

第一部分：五分钟扫盲
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

第二部分：学习框架
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

请用清晰、专业但易懂的语言回答，确保内容准确且有深度。对于资源推荐，请尽量推荐具体的、高质量的学习材料。"""

        # 调用 API
        response = client.chat.completions.create(
            model="qwen-max",  # 使用通义千问模型
            messages=[{
                "role": "user",
                "content": prompt
            }],
            temperature=0.7,
            max_tokens=2000
        )

        # 获取生成的内容
        result = response.choices[0].message.content
        return jsonify({
            "result": result
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True) 