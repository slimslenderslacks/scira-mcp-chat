import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { url, maxAttempts = 20, timeout = 3000 } = body;

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`Checking server readiness at ${url}, will try ${maxAttempts} times`);
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.status === 200) {
                console.log(`Server ready at ${url} after ${i + 1} attempts`);
                return NextResponse.json({ ready: true });
            }
            console.log(`Server not ready yet (attempt ${i + 1}), status: ${response.status}`);
        } catch (error) {
            console.log(`Server connection failed (attempt ${i + 1}): ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Wait before next attempt with progressive backoff
        const waitTime = Math.min(1000 * (i + 1), 5000); // Start with 1s, increase each time, max 5s
        console.log(`Waiting ${waitTime}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    console.log(`Server failed to become ready after ${maxAttempts} attempts`);
    return NextResponse.json({ ready: false });
} 