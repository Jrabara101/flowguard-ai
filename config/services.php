<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'vertex' => [
        'project' => env('GOOGLE_CLOUD_PROJECT'),
        'location' => env('VERTEX_LOCATION', 'global'),
        // Optional fixed token for quick local tests: `gcloud auth print-access-token`. Never needed on Cloud Run.
        'access_token' => env('VERTEX_ACCESS_TOKEN'),
        'flash_model' => env('GEMINI_FLASH_MODEL', 'gemini-3.8-flash'),
        // 'low' or 'high'. Lower is faster; leave empty for the model default.
        'flash_thinking' => env('GEMINI_FLASH_THINKING'),
        'pro_model' => env('GEMINI_PRO_MODEL', 'gemini-3.1-pro-preview'),
        'pro_fallback_model' => env('GEMINI_PRO_FALLBACK_MODEL', 'gemini-2.5-pro'),
    ],

    'demo' => [
        'admin_email' => env('DEMO_ADMIN_EMAIL', 'admin@flowguard.test'),
        'admin_password' => env('DEMO_ADMIN_PASSWORD', 'password'),
    ],

];
