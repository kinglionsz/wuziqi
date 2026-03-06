@echo off
chcp 65001 >nul

REM Set environment variables and start Claude Code
set ANTHROPIC_BASE_URL=https://aigw-gzgy2.cucloud.cn:8443
set ANTHROPIC_AUTH_TOKEN=sk-sp-GlFIEBdN6Al43TQ3xfAjocXae3pwE9oU
set API_TIMEOUT_MS=3000000
set CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
set ANTHROPIC_MODEL=Qwen3.5-397B-A17B
set ANTHROPIC_SMALL_FAST_MODEL=Qwen3-235B-A22B
set ANTHROPIC_DEFAULT_SONNET_MODEL=DeepSeek-V3.1
set ANTHROPIC_DEFAULT_OPUS_MODEL=glm-5
set ANTHROPIC_DEFAULT_HAIKU_MODEL=MiniMax-M2.5

echo Starting Claude Code with custom config...
claude %*
