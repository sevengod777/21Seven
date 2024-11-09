function generateToken(apiKey) {
    try {
        const [id, secret] = apiKey.split('.');
        
        const header = {
            alg: 'HS256',
            sign_type: 'SIGN'
        };
        
        const payload = {
            api_key: id,
            exp: Math.floor(Date.now() / 1000) + 3600, // 使用秒级时间戳
            timestamp: Math.floor(Date.now() / 1000)    // 使用秒级时间戳
        };

        // Base64Url 编码函数
        const base64UrlEncode = (str) => {
            return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        };

        // 创建签名
        const headerStr = base64UrlEncode(JSON.stringify(header));
        const payloadStr = base64UrlEncode(JSON.stringify(payload));
        
        // 使用原始字符串进行签名
        const signatureInput = `${headerStr}.${payloadStr}`;
        const signature = CryptoJS.HmacSHA256(signatureInput, secret);
        const signatureBase64 = CryptoJS.enc.Base64.stringify(signature)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // 组合JWT
        return `${headerStr}.${payloadStr}.${signatureBase64}`;
    } catch (e) {
        console.error('生成token失败:', e);
        return null;
    }
} 