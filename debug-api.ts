
async function testApi() {
    try {
        const response = await fetch('http://localhost:3000/api/verifyai/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Hello, testing API' }
                ],
                firecrawlApiKey: process.env.FIRECRAWL_API_KEY || 'test-key'
            })
        });

        console.log('Status:', response.status);

        if (!response.body) {
            console.log('No response body');
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            console.log('Chunk:', decoder.decode(value));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testApi();
