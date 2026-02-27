import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    const baseUrl = new URL('/', request.url).toString();

    if (error) {
        return NextResponse.redirect(`${baseUrl}?github_error=${error}`);
    }

    if (!code) {
        return NextResponse.redirect(`${baseUrl}?github_error=no_code`);
    }

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${baseUrl}?github_error=missing_env`);
    }

    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        const data = await response.json();

        if (data.error) {
            return NextResponse.redirect(`${baseUrl}?github_error=${data.error}`);
        }

        if (data.access_token) {
            // Redirect back to the frontend with the token
            // We use a query parameter that the frontend will catch, store securely, and immediately erase from the URL.
            return NextResponse.redirect(`${baseUrl}?github_token=${data.access_token}`);
        } else {
            return NextResponse.redirect(`${baseUrl}?github_error=no_token`);
        }

    } catch (err) {
        console.error('GitHub OAuth Error:', err);
        return NextResponse.redirect(`${baseUrl}?github_error=server_error`);
    }
}
