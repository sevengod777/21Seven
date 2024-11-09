// 添加打字机效果函数 - 移到文件开头
async function typeWriter(element, text) {
    element.textContent = ''; // 清空元素内容
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        // 调整打字速度（数字越大越慢）
        await new Promise(resolve => setTimeout(resolve, 30));
    }
}

// 设置固定的API Key
const API_KEY = '1bd6aa413d90ee8d35832debdfe92554.uu8dPZKS8LX4baw0';
let remainingCount = 20;

// 用户相关变量
let currentUser = null;
let isAuthenticated = false;

// 在文件开头添加用户存储相关代码
function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : {};
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// 登录功能
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!username || !password) {
        alert('请输入用户名和密码！');
        return;
    }

    const users = getUsers();
    
    if (users[username] && users[username].password === password) {
        isAuthenticated = true;
        currentUser = username;
        document.getElementById('currentUser').textContent = username;
        document.getElementById('authModal').style.display = 'none';
        document.querySelector('.chat-container').style.display = 'flex';
        loadUserData(username);
    } else {
        alert('用户名或密码错误！');
    }
}

// 注册功能
function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    
    if (!username || !password || !confirmPassword) {
        alert('请填写所有字段！');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致！');
        return;
    }
    
    const users = getUsers();
    
    if (users[username]) {
        alert('用户名已存在！');
        return;
    }
    
    // 保存新用户，添加usedCodes数组
    users[username] = {
        password: password,
        remainingCount: 20,
        registerDate: new Date().toISOString(),
        usedCodes: []  // 添加已使用的激活码数组
    };
    
    saveUsers(users);
    alert('注册成功！请登录');
    showLoginForm();
    
    // 清空注册表单
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// 切换表单显示
function showLoginForm() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

// 退出登录
function logout() {
    isAuthenticated = false;
    currentUser = null;
    document.getElementById('currentUser').textContent = '未登录';
    document.querySelector('.chat-container').style.display = 'none';
    document.getElementById('authModal').style.display = 'flex';
    showLoginForm();
    
    // 清空登录表单
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// 加载用户数据
function loadUserData(username) {
    const users = getUsers();
    if (users[username]) {
        remainingCount = users[username].remainingCount;
        updateRemainingCount();
    }
}

// 修改发送消息函数，添加认证检查
async function sendMessage() {
    if (!isAuthenticated) {
        alert('请先登录！');
        return;
    }
    
    if (remainingCount <= 0) return;
    
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (message === '') return;

    // 添加用户消息
    addMessage(message, 'user');
    
    // 清空输入框
    input.value = '';

    // 减少剩余次数
    remainingCount--;
    updateRemainingCount();

    // 添加加载状态
    const loadingDiv = addMessage('正在思考...', 'loading');
    
    try {
        const token = generateToken(API_KEY);
        if (!token) {
            throw new Error('Token生成失败');
        }

        // 添加系统消息来设定AI身份
        const messages = [
            {
                role: 'system',
                content: '你是Seven的AI小助手。当用户询问你是谁时，请明确表示你是"Seven的AI小助手"。'
            },
            {
                role: 'user',
                content: message
            }
        ];

        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'glm-4',
                messages: messages,  // 使用新的messages数组
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        const data = await response.json();
        
        // 移除加载状态
        loadingDiv.remove();
        
        if (!response.ok) {
            throw new Error(data.error?.message || '请求失败');
        }

        // 创建AI回复消息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';
        const textSpan = document.createElement('span');
        messageDiv.appendChild(textSpan);
        document.getElementById('chatMessages').appendChild(messageDiv);

        // 使用打字机效果显示回复
        await typeWriter(textSpan, data.choices[0].message.content);

    } catch (error) {
        console.error('发送消息失败:', error);
        loadingDiv.remove();
        addMessage(`错误: ${error.message}`, 'ai');
    }
}

function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (sender === 'loading') {
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading';
        messageDiv.appendChild(loadingSpinner);
    } else {
        messageDiv.innerHTML = text; // 使用innerHTML以支持HTML内容
    }
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    return messageDiv;
}

// 添加回车发送功能
document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 初始化剩余次数显示
updateRemainingCount();

// 页面加载时显示登录框
window.onload = function() {
    document.getElementById('authModal').style.display = 'flex';
    document.querySelector('.chat-container').style.display = 'none';
};

// 修改更新剩余次数的函数
function updateRemainingCount() {
    document.getElementById('remainingCount').textContent = remainingCount;
    const textarea = document.getElementById('userInput');
    textarea.placeholder = `请输入您的问题...（剩余${remainingCount}次对话机会）`;
    
    if (remainingCount <= 0) {
        textarea.disabled = true;
        document.querySelector('.chat-input button').disabled = true;
        addMessage(`
            <div class="usage-expired">
                对话次数已用完！请点击"充值次数"按钮购买激活码。
                <br>
                如需帮助，请点击"联系客服"。
            </div>
        `, 'ai');
    }
    
    if (currentUser) {
        const users = getUsers();
        if (users[currentUser]) {
            users[currentUser].remainingCount = remainingCount;
            saveUsers(users);
        }
    }
}

// 添加表单验证
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.getElementsByTagName('input');
    for (let input of inputs) {
        if (!input.value.trim()) {
            alert(`请输入${input.placeholder}！`);
            input.focus();
            return false;
        }
    }
    return true;
}

// 添加激活码相关函数
function showActivateModal() {
    document.getElementById('activateModal').style.display = 'flex';
}

function closeActivateModal() {
    document.getElementById('activateModal').style.display = 'none';
    document.getElementById('activationCode').value = '';
}

// 修改激活码验证函数
function activateCode() {
    const code = document.getElementById('activationCode').value.trim();
    if (!code) {
        alert('请输入激活码！');
        return;
    }

    // 验证激活码格式（1355144670ZWJ + 1-99的数字）
    const codePattern = /^1355144670ZWJ([1-9]|[1-9][0-9])$/;
    if (!codePattern.test(code)) {
        alert('激活码格式不正确！');
        return;
    }

    // 获取已使用的激活码
    const users = getUsers();
    const currentUserData = users[currentUser];
    
    // 检查激活码是否已被使用
    if (!currentUserData.usedCodes) {
        currentUserData.usedCodes = [];
    }
    
    if (currentUserData.usedCodes.includes(code)) {
        alert('该激活码已被使用！');
        return;
    }

    // 记录使用的激活码
    currentUserData.usedCodes.push(code);
    currentUserData.remainingCount += 20; // 增加20次对话机会
    remainingCount = currentUserData.remainingCount;
    
    // 保存用户数据
    saveUsers(users);
    updateRemainingCount();
    
    // 添加成功提示消息
    addMessage('激活成功！已增加20次对话机会。', 'ai');
    
    // 重新启用输入框和发送按钮
    const textarea = document.getElementById('userInput');
    const sendButton = document.querySelector('.chat-input button');
    textarea.disabled = false;
    sendButton.disabled = false;
    
    closeActivateModal();
}

// 添加微信相关函数
function showWechatModal() {
    document.getElementById('wechatModal').style.display = 'flex';
}

function closeWechatModal() {
    document.getElementById('wechatModal').style.display = 'none';
}

function copyWechat() {
    const wechatId = 'BbyNo7s';
    navigator.clipboard.writeText(wechatId).then(() => {
        // 显示复制成功提示
        const successTip = document.createElement('div');
        successTip.className = 'copy-success';
        successTip.textContent = '微信号已复制到剪贴板';
        document.body.appendChild(successTip);
        
        // 2秒后移除提示
        setTimeout(() => {
            successTip.remove();
        }, 2000);
    }).catch(err => {
        alert('复制失败，请手动复制微信号：BbyNo7s');
    });
}