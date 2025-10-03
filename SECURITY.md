# Security Configuration

## Environment Variables Required

For production deployment, set these environment variables:

```bash
NODE_ENV=production
TWELVE_DATA_KEY=your_actual_api_key
ALPHA_VANTAGE_KEY=your_actual_api_key
IEX_CLOUD_KEY=your_actual_api_key
PORT=10000
```

## Security Features Implemented

✅ **Password Hashing**: Using Argon2 for secure password storage
✅ **Secure Cookies**: HTTPOnly, Secure (in production), SameSite protection
✅ **Input Validation**: Username/password format validation
✅ **SQL Injection Protection**: Using parameterized queries
✅ **CORS Protection**: Only enabled in development
✅ **Environment Variables**: API keys not hardcoded

## Security Recommendations

1. **Set Environment Variables**: Never commit API keys to code
2. **Use HTTPS**: Always use HTTPS in production
3. **Regular Updates**: Keep dependencies updated
4. **Monitor Logs**: Watch for suspicious activity
5. **Rate Limiting**: Consider adding rate limiting for API endpoints

## Demo Account

- Username: `demo`
- Password: `password123`

**Note**: Change the demo password in production!
