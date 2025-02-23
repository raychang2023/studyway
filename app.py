from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import openai
import os
import logging

# ✅ 1. 设置日志，方便调试
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ 2. 加载环境变量
load_dotenv()

# ✅ 3. 读取 API Key（更规范的变量名）
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
if not DASHSCOPE_API_KEY:
    raise ValueError("❌ ERROR: DASHSCOPE_API_KEY 环境变量未设置，请检查 .env 配置！")

# ✅ 4. 初始化 OpenAI 客户端
client = openai.OpenAI(
    api_key=DASHSCOPE_API_KEY,
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

# ✅ 5. 初始化 Flask 应用
app = Flask(
    __name__,
    static_folder="static",
    template_folder="templates"
)
CORS(app)

# ✅ 6. 主页路由
@app.route("/")
def home():
    return render_template("index.html")

# ✅ 7. 处理 AI 生成请求
@app.route("/generate", methods=["POST"])
def generate():
    try:
        data = request.json
        if not data or "topic" not in data:
            return jsonify({"error": "请输入要学习的领域"}), 400

        topic = data["topic"].strip()
        if not topic:
            return jsonify({"error": "主题不能为空"}), 400

        logger.info(f"开始生成: {topic}")

        # 生成内容
        prompt = create_prompt(topic)
        result = generate_content(prompt)

        return jsonify({"result": result})

    except openai.OpenAIError as e:  # 处理 OpenAI 相关错误
        logger.error(f"❌ OpenAI API 错误: {str(e)}")
        return jsonify({"error": "AI 生成失败，请稍后再试"}), 500

    except Exception as e:
        logger.error(f"❌ 服务器错误: {str(e)}")
        return jsonify({"error": "服务器异常"}), 500

# ✅ 8. 生成 Prompt
def create_prompt(topic: str) -> str:
    return f"""
    你是一位擅长教学的专家，请为主题 "{topic}" 生成以下两部分内容：

    ### **📌 第一部分：五分钟扫盲**
    1. 它是什么？
    - 简单介绍
    2. 它为什么重要？
    - 价值和影响
    3. 它有哪些主要类型？
    - 分类或组成部分
    4. 它基本是怎么运作的？
    - 运行原理
    5. 用一个比喻/例子来理解
    - 生活化的类比

    ### **📌 第二部分：学习框架**
    1. 学习目标
    - 入门 / 进阶 / 专家
    2. 核心知识点
    - 关键概念
    3. 学习路径
    - 逐步学习顺序
    4. 推荐资源
    - 课程 / 书籍 / 工具
    5. 实践项目
    - 练习 / 案例分析 / 高级应用

    请用 **清晰、简洁** 的中文回答，确保通俗易懂！
    """

# ✅ 9. 生成 AI 内容
def generate_content(prompt: str) -> str:
    try:
        response = client.chat.completions.create(
            model="qwen-max",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"调用 OpenAI API 失败: {str(e)}")
        raise Exception("AI 生成失败，请检查 API Key 是否正确")

# ✅ 10. 运行 Flask
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
