import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

    if (!clientId) {
        return NextResponse.json({
            error: 'GitHub Client ID is not configured in environment variables. Please add NEXT_PUBLIC_GITHUB_CLIENT_ID to your .env.local file.'
        }, { status: 500 });
    }

    // Generate a random state string for CSRF protection
    const state = Math.random().toString(36).substring(7);

    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.append('client_id', clientId);
    githubAuthUrl.searchParams.append('scope', 'repo workflow');
    githubAuthUrl.searchParams.append('state', state);

    return NextResponse.redirect(githubAuthUrl.toString());
}
