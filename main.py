from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from fastapi.responses import FileResponse
import logging
import os
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化 OpenAI 客户端
client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),  # 改为从环境变量获取
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

# 检查 API Key 是否成功获取
if not client.api_key:
    raise ValueError("❌ ERROR: DASHSCOPE_API_KEY 环境变量未设置，请检查 Render 配置！")

# 初始化 FastAPI
app = FastAPI()

# 获取当前目录路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 设置静态文件目录
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# 设置模板目录
templates = Jinja2Templates(directory="templates")

# 允许跨域请求 (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有域名，简化测试
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 统一的 "/" 入口
@app.get("/")
async def serve_index(request):
    return templates.TemplateResponse("index.html", {"request": request})

class Topic(BaseModel):
    topic: str
    
    class Config:
        from_attributes = True

class TopicResponse(BaseModel):
    result: str
    
    class Config:
        from_attributes = True

def create_quick_intro_prompt(topic: str) -> str:
    return f"""
    你是一位擅长用简单易懂的方式讲解复杂概念的专家。
    你的目标是让一个完全不懂 {topic} 这个领域的人 **在5分钟内明白它的核心概念**，就像在和朋友聊天一样！
    请使用 **简单、直白、生活化的语言**，避免生硬的专业术语，并在最后提供一个贴近生活的比喻。

    ### **📌 1. 它是什么？（What is it?）**
    - 用最简单的方式解释 {topic}，**不要长篇大论**，直接说重点。

    ### **📌 2. 它为什么重要？（Why is it important?）**
    - **换个角度思考**，它为什么值得关心？它对你/公司/社会有什么影响？  

    ### **📌 3. 它有哪些主要类型/构成？（Types/Classifications）**
    - 这个东西有不同的种类吗？它的组成部分是什么？

    ### **📌 4. 它基本是怎么运作/处理的？（How does it work?）**
    - **它的运行方式**、基本逻辑是什么？

    ### **📌 5. 用一个比喻/例子来理解？（Analogy/Example）**
    - **用一个日常生活的例子**，让人一听就懂。

    请用中文回答，确保内容通俗易懂。
    """

def create_detailed_prompt(topic: str) -> str:
    return f"""
    ## 2️⃣ **深入学习框架**
    现在请为想要深入学习 {topic} 的用户提供一个完整的学习框架：

    ### **📌 学习目标**
    - 入门级：掌握哪些基础知识和技能
    - 进阶级：需要深入理解的核心概念
    - 专家级：需要达到的专业水平

    ### **📌 核心知识点**
    - 列出必须掌握的关键概念
    - 重点难点分析

    ### **📌 学习路径**
    - 推荐的学习顺序
    - 重点书籍和课程推荐
    - 实战项目建议

    ### **📌 推荐资源**
    - 优质的在线课程（MOOC）
    - 实用工具和平台
    - 学习社区和论坛

    ### **📌 实践项目**
    - 入门级实践项目
    - 进阶案例分析
    - 高级实战建议

    请用中文回答，确保内容具体且实用。
    """

@app.post("/generate", response_model=TopicResponse)
async def generate_learning_plan(topic: Topic):
    try:
        # 先生成快速介绍
        quick_intro = generate_content(create_quick_intro_prompt(topic.topic))
        # 再生成详细学习框架
        detailed_plan = generate_content(create_detailed_prompt(topic.topic))
        
        # 组合两部分内容
        complete_result = f"""
# 五分钟扫盲
{quick_intro}

# 深入学习框架
{detailed_plan}
"""
        return TopicResponse(result=complete_result)
            
    except Exception as e:
        logger.error(f"处理请求时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_content(prompt: str) -> str:
    try:
        completion = client.chat.completions.create(
            model="qwen-max",
            messages=[
                {"role": "system", "content": "你是一位擅长用简单易懂的方式讲解复杂概念的专家。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        return completion.choices[0].message.content
    except Exception as e:
        logger.error(f"调用 API 时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成过程中出现错误: {str(e)}")

# ✅ 确保 `uvicorn.run()` 只在本地运行
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)

