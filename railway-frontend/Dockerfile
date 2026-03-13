# 五子棋前端 - 静态网站
FROM nginx:alpine

# 复制静态文件到 nginx 目录
COPY dist /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
