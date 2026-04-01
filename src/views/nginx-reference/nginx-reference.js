export const nginxReferenceSections = [
  {
    key: 'command-basic',
    label: '基础命令',
    title: '基础命令',
    description: '版本查看、配置检查和自定义配置入口最常用的一组命令。',
    items: [
      {
        id: 'command-version',
        category: 'command-basic',
        type: 'command',
        name: 'nginx -v',
        example: 'nginx -v',
        desc: '查看当前 Nginx 的版本号。',
        scene: '确认环境版本或核对线上与预发安装差异时使用。',
        options: [
          { key: '-v', desc: '仅输出版本号，适合快速检查。' },
          { key: '-V', desc: '输出版本、编译参数和已启用模块，排查能力差异时更有用。' }
        ]
      },
      {
        id: 'command-test',
        category: 'command-basic',
        type: 'command',
        name: 'nginx -t',
        example: 'nginx -t',
        desc: '检测配置文件语法和引用关系是否正确。',
        scene: '修改 conf 后正式 reload 前先做一次语法校验。',
        options: [
          { key: '-t', desc: '执行配置测试并输出结果。' },
          { key: '-c', desc: '指定要测试的配置文件路径。' }
        ]
      },
      {
        id: 'command-dump-config',
        category: 'command-basic',
        type: 'command',
        name: 'nginx -T',
        example: 'nginx -T',
        desc: '打印合并后的完整配置，同时执行语法检测。',
        scene: '排查 include 链路、确认最终生效配置时很高效。',
        options: [
          { key: '-T', desc: '输出完整配置，包含所有 include 进来的文件。' },
          { key: '-q', desc: '静默模式，只在报错时输出内容。' }
        ]
      },
      {
        id: 'command-custom-config',
        category: 'command-basic',
        type: 'command',
        name: 'nginx -c',
        example: 'nginx -p /usr/local/nginx/ -c conf/nginx.conf',
        desc: '使用指定配置文件和前缀目录启动 Nginx。',
        scene: '本地调试、自定义安装目录或并行跑多套配置时使用。',
        options: [
          { key: '-c', desc: '指定配置文件位置，不使用默认 nginx.conf。' },
          { key: '-p', desc: '指定前缀目录，日志、临时文件等路径会基于此解析。' }
        ]
      }
    ]
  },
  {
    key: 'command-control',
    label: '进程控制',
    title: '启动与进程控制',
    description: '启动、平滑重载、优雅退出和日志重开这些运维动作的核心命令。',
    items: [
      {
        id: 'command-start',
        category: 'command-control',
        type: 'command',
        name: 'nginx',
        example: 'nginx',
        desc: '按默认配置启动 Nginx 主进程。',
        scene: '服务首次拉起、容器入口命令或手动恢复服务时使用。',
        options: [
          { key: '无参数', desc: '默认读取系统约定的 nginx.conf 并启动服务。' },
          { key: '-g', desc: '临时注入全局指令，例如 daemon off;。' }
        ]
      },
      {
        id: 'command-reload',
        category: 'command-control',
        type: 'command',
        name: 'nginx -s reload',
        example: 'nginx -s reload',
        desc: '平滑重载配置，不中断已有连接。',
        scene: '证书、代理、站点配置更新后最常见的生效方式。',
        options: [
          { key: '-s reload', desc: '向 master 进程发送 HUP 信号，重新加载配置。' },
          { key: '-c', desc: '配合自定义配置文件时一起使用。' }
        ]
      },
      {
        id: 'command-quit',
        category: 'command-control',
        type: 'command',
        name: 'nginx -s quit',
        example: 'nginx -s quit',
        desc: '优雅退出，等待 worker 处理完当前请求。',
        scene: '发布切换或维护窗口需要平滑下线实例时使用。',
        options: [
          { key: '-s quit', desc: '发送 QUIT 信号，优雅停止进程。' },
          { key: 'master pid', desc: '命令会通过 pid 文件定位当前 master 进程。' }
        ]
      },
      {
        id: 'command-stop',
        category: 'command-control',
        type: 'command',
        name: 'nginx -s stop',
        example: 'nginx -s stop',
        desc: '快速停止 Nginx 进程。',
        scene: '需要立刻释放端口或故障实例应急下线时使用。',
        options: [
          { key: '-s stop', desc: '发送 TERM 信号，直接停止服务。' },
          { key: '谨慎使用', desc: '可能中断正在处理中的请求。' }
        ]
      },
      {
        id: 'command-reopen',
        category: 'command-control',
        type: 'command',
        name: 'nginx -s reopen',
        example: 'nginx -s reopen',
        desc: '重新打开日志文件句柄。',
        scene: '日志切割后让 Nginx 接管新的 access.log 和 error.log 文件。',
        options: [
          { key: '-s reopen', desc: '发送 USR1 信号，重新打开日志文件。' },
          { key: '配合 logrotate', desc: '常与系统日志轮转策略一起使用。' }
        ]
      }
    ]
  },
  {
    key: 'command-diagnose',
    label: '日志排障',
    title: '日志与排障',
    description: '围绕访问日志、错误日志和监听状态的高频排障命令。',
    items: [
      {
        id: 'diagnose-access-log',
        category: 'command-diagnose',
        type: 'command',
        name: 'tail -f access.log',
        example: 'tail -f /var/log/nginx/access.log',
        desc: '实时跟踪访问日志。',
        scene: '验证请求是否到达、观察状态码和流量模式时使用。',
        options: [
          { key: '-f', desc: '持续输出新增日志内容。' },
          { key: '/var/log/nginx/access.log', desc: '默认访问日志路径，实际位置以配置为准。' }
        ]
      },
      {
        id: 'diagnose-error-log',
        category: 'command-diagnose',
        type: 'command',
        name: 'tail -f error.log',
        example: 'tail -f /var/log/nginx/error.log',
        desc: '实时查看错误日志和 upstream 异常。',
        scene: '502、配置错误、权限问题和证书错误排查时最常用。',
        options: [
          { key: '-f', desc: '持续跟踪错误日志输出。' },
          { key: 'error.log', desc: '日志级别和路径由 error_log 指令决定。' }
        ]
      },
      {
        id: 'diagnose-journalctl',
        category: 'command-diagnose',
        type: 'command',
        name: 'journalctl -u nginx -f',
        example: 'journalctl -u nginx -f',
        desc: '查看 systemd 管理下的 Nginx 服务日志。',
        scene: '使用 systemctl 启动的服务器上排查启动失败或重载异常时使用。',
        options: [
          { key: '-u nginx', desc: '聚焦 nginx 服务单元日志。' },
          { key: '-f', desc: '实时跟踪最新日志输出。' }
        ]
      },
      {
        id: 'diagnose-port',
        category: 'command-diagnose',
        type: 'command',
        name: 'ss -lntp | grep nginx',
        example: 'ss -lntp | grep nginx',
        desc: '查看 Nginx 当前监听的端口和进程信息。',
        scene: '确认 80/443 是否监听成功，或排查端口冲突时使用。',
        options: [
          { key: '-lntp', desc: '显示监听中的 TCP 端口、地址和关联进程。' },
          { key: 'grep nginx', desc: '过滤出与 nginx 相关的监听项。' }
        ]
      }
    ]
  },
  {
    key: 'conf-main',
    label: '主配置',
    title: '主配置与进程模型',
    description: '全局级别的基础指令，决定 worker 数量、连接能力和配置装配方式。',
    items: [
      {
        id: 'conf-user-worker',
        category: 'conf-main',
        type: 'config',
        name: 'user / worker_processes',
        example: `user nginx;
worker_processes auto;
pid /run/nginx.pid;`,
        desc: '定义运行用户、worker 数量和主进程 pid 文件位置。',
        scene: '部署到 Linux 主机或容器时，这是最先调整的一组全局参数。',
        options: [
          { key: 'user', desc: '指定 worker 进程以哪个系统用户运行。' },
          { key: 'worker_processes', desc: '通常设为 auto，让 Nginx 按 CPU 核数分配。' },
          { key: 'pid', desc: '指定 master pid 文件路径，便于 reload 和 stop 定位进程。' }
        ]
      },
      {
        id: 'conf-events',
        category: 'conf-main',
        type: 'config',
        name: 'events',
        example: `events {
  worker_connections 10240;
  use epoll;
  multi_accept on;
}`,
        desc: '控制单 worker 连接上限和事件模型。',
        scene: '高并发站点、网关或静态资源服务调优时经常调整。',
        options: [
          { key: 'worker_connections', desc: '单个 worker 可同时处理的连接数上限。' },
          { key: 'use epoll', desc: 'Linux 下常用的高性能事件模型。' },
          { key: 'multi_accept', desc: '一次尽量接收更多新连接，适合高连接场景。' }
        ]
      },
      {
        id: 'conf-include',
        category: 'conf-main',
        type: 'config',
        name: 'include',
        example: `http {
  include /etc/nginx/mime.types;
  include /etc/nginx/conf.d/*.conf;
  default_type application/octet-stream;
}`,
        desc: '把零散站点配置拆分后统一装配到主配置中。',
        scene: '多站点、多环境或需要模块化维护 conf 文件时使用。',
        options: [
          { key: 'include mime.types', desc: '加载 MIME 类型映射，保证静态文件响应头正确。' },
          { key: 'include conf.d/*.conf', desc: '批量加载拆分后的站点配置。' },
          { key: 'default_type', desc: '兜底的内容类型，通常保留默认值。' }
        ]
      },
      {
        id: 'conf-error-log',
        category: 'conf-main',
        type: 'config',
        name: 'error_log',
        example: `error_log /var/log/nginx/error.log warn;
worker_rlimit_nofile 65535;`,
        desc: '设置错误日志级别，并提升可用文件句柄上限。',
        scene: '高流量服务或大量 upstream 连接场景下常一起配置。',
        options: [
          { key: 'error_log', desc: '指定错误日志文件和记录级别。' },
          { key: 'warn', desc: '常用日志级别，兼顾可读性和信息量。' },
          { key: 'worker_rlimit_nofile', desc: '提高 worker 可打开的最大文件描述符数量。' }
        ]
      }
    ]
  },
  {
    key: 'conf-server',
    label: 'Server',
    title: 'HTTP 与 Server 基础',
    description: '站点监听、静态目录、单页应用回退和上传大小限制这些基础配置。',
    items: [
      {
        id: 'conf-listen-server-name',
        category: 'conf-server',
        type: 'config',
        name: 'listen / server_name',
        example: `server {
  listen 80;
  server_name example.com www.example.com;
}`,
        desc: '声明站点监听端口和匹配域名。',
        scene: '新增站点入口或多域名绑定到同一服务时使用。',
        options: [
          { key: 'listen', desc: '定义监听端口、IP 或 SSL 参数。' },
          { key: 'server_name', desc: '定义当前 server 块要匹配的域名列表。' }
        ]
      },
      {
        id: 'conf-root-index',
        category: 'conf-server',
        type: 'config',
        name: 'root / index',
        example: `location / {
  root /usr/share/nginx/html;
  index index.html index.htm;
}`,
        desc: '配置静态站点根目录和默认首页。',
        scene: '部署纯前端页面、下载站点或静态文档服务时使用。',
        options: [
          { key: 'root', desc: '定义请求路径映射到磁盘上的根目录。' },
          { key: 'index', desc: '请求命中目录时尝试返回的默认文件。' }
        ]
      },
      {
        id: 'conf-try-files',
        category: 'conf-server',
        type: 'config',
        name: 'try_files',
        example: `location / {
  try_files $uri $uri/ /index.html;
}`,
        desc: '按顺序尝试静态文件，失败后回退到指定资源。',
        scene: 'Vue、React 等前端单页应用刷新 404 时最常用。',
        options: [
          { key: '$uri', desc: '先尝试按原请求路径查找实际文件。' },
          { key: '$uri/', desc: '再尝试作为目录访问。' },
          { key: '/index.html', desc: '最终兜底回退到前端入口文件。' }
        ]
      },
      {
        id: 'conf-upload-size',
        category: 'conf-server',
        type: 'config',
        name: 'client_max_body_size',
        example: `server {
  client_max_body_size 20m;
}`,
        desc: '限制客户端请求体大小。',
        scene: '文件上传接口返回 413 时通常先检查这个配置。',
        options: [
          { key: 'client_max_body_size', desc: '支持 k、m、g 等单位。' },
          { key: 'server/location', desc: '可按站点或接口单独覆盖更细粒度的限制。' }
        ]
      }
    ]
  },
  {
    key: 'conf-proxy',
    label: '反向代理',
    title: '反向代理与负载均衡',
    description: 'Nginx 作为 API 网关、反向代理和 upstream 负载均衡器时的核心配置。',
    items: [
      {
        id: 'conf-proxy-pass',
        category: 'conf-proxy',
        type: 'config',
        name: 'proxy_pass',
        example: `location /api/ {
  proxy_pass http://127.0.0.1:8080/;
}`,
        desc: '把匹配到的请求转发到后端服务。',
        scene: '前后端分离、网关转发或统一入口代理时使用。',
        options: [
          { key: 'location /api/', desc: '匹配指定前缀路径后走代理。' },
          { key: 'proxy_pass', desc: '定义目标上游地址或 upstream 名称。' }
        ]
      },
      {
        id: 'conf-proxy-header',
        category: 'conf-proxy',
        type: 'config',
        name: 'proxy_set_header',
        example: `location /api/ {
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_pass http://backend;
}`,
        desc: '为后端补齐真实请求头和协议来源。',
        scene: '后端需要拿到真实 Host、IP 或判断 HTTPS 来源时使用。',
        options: [
          { key: 'Host', desc: '保留原始域名，方便后端做多租户或路由判断。' },
          { key: 'X-Real-IP', desc: '传递客户端真实来源 IP。' },
          { key: 'X-Forwarded-For', desc: '维护完整的代理链路 IP 信息。' }
        ]
      },
      {
        id: 'conf-upstream',
        category: 'conf-proxy',
        type: 'config',
        name: 'upstream',
        example: `upstream backend {
  least_conn;
  server 10.0.0.11:8080 weight=3;
  server 10.0.0.12:8080;
}`,
        desc: '定义一组上游服务并指定负载均衡策略。',
        scene: '多实例部署、灰度发布或提升 API 可用性时使用。',
        options: [
          { key: 'least_conn', desc: '优先把新请求分配给当前连接数更少的节点。' },
          { key: 'server', desc: '定义上游节点，可附带 weight、max_fails 等参数。' }
        ]
      },
      {
        id: 'conf-proxy-timeout',
        category: 'conf-proxy',
        type: 'config',
        name: 'proxy_*_timeout',
        example: `location /report/ {
  proxy_connect_timeout 5s;
  proxy_read_timeout 60s;
  proxy_send_timeout 60s;
  proxy_pass http://backend;
}`,
        desc: '控制代理连接建立、读取和发送的超时时间。',
        scene: '慢接口、大文件导出或偶发 504 超时场景下常要调整。',
        options: [
          { key: 'proxy_connect_timeout', desc: '连接 upstream 的超时时间。' },
          { key: 'proxy_read_timeout', desc: '等待 upstream 响应数据的超时时间。' },
          { key: 'proxy_send_timeout', desc: '向 upstream 发送请求体的超时时间。' }
        ]
      }
    ]
  },
  {
    key: 'conf-https-security',
    label: 'HTTPS/安全',
    title: 'HTTPS 与安全配置',
    description: '证书、TLS 协议、安全响应头和限流是生产站点最常见的安全配置。',
    items: [
      {
        id: 'conf-ssl-cert',
        category: 'conf-https-security',
        type: 'config',
        name: 'ssl_certificate',
        example: `server {
  listen 443 ssl http2;
  server_name example.com;
  ssl_certificate /etc/nginx/cert/fullchain.pem;
  ssl_certificate_key /etc/nginx/cert/privkey.pem;
}`,
        desc: '为 HTTPS 站点配置证书和私钥。',
        scene: '站点开启 TLS 或续签证书后更新配置时使用。',
        options: [
          { key: 'listen 443 ssl http2', desc: '监听 HTTPS 并启用 HTTP/2。' },
          { key: 'ssl_certificate', desc: '指定完整证书链文件路径。' },
          { key: 'ssl_certificate_key', desc: '指定私钥文件路径。' }
        ]
      },
      {
        id: 'conf-ssl-policy',
        category: 'conf-https-security',
        type: 'config',
        name: 'ssl_protocols / ssl_ciphers',
        example: `ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;`,
        desc: '约束 TLS 协议与加密套件，平衡安全性和兼容性。',
        scene: '安全加固、满足扫描要求或统一 TLS 策略时使用。',
        options: [
          { key: 'ssl_protocols', desc: '建议只保留 TLSv1.2 与 TLSv1.3。' },
          { key: 'ssl_ciphers', desc: '定义允许的加密套件集合。' },
          { key: 'ssl_session_timeout', desc: '控制会话缓存时长，减少重复握手开销。' }
        ]
      },
      {
        id: 'conf-security-headers',
        category: 'conf-https-security',
        type: 'config',
        name: 'add_header',
        example: `add_header X-Frame-Options SAMEORIGIN always;
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;`,
        desc: '增加常用安全响应头。',
        scene: '后台管理系统或对安全基线有要求的站点通常都会配置。',
        options: [
          { key: 'X-Frame-Options', desc: '限制页面被嵌入 iframe，降低点击劫持风险。' },
          { key: 'X-Content-Type-Options', desc: '禁止浏览器 MIME 猜测。' },
          { key: 'always', desc: '确保非 200 响应也会返回这些响应头。' }
        ]
      },
      {
        id: 'conf-limit-req',
        category: 'conf-https-security',
        type: 'config',
        name: 'limit_req',
        example: `limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;

location /api/ {
  limit_req zone=api_limit burst=40 nodelay;
  proxy_pass http://backend;
}`,
        desc: '按客户端维度进行简单限流。',
        scene: '对登录、短信、公开 API 等高风险接口做削峰限流时使用。',
        options: [
          { key: 'limit_req_zone', desc: '定义共享内存区和基础限速规则。' },
          { key: 'burst', desc: '允许的瞬时突发请求数。' },
          { key: 'nodelay', desc: '突发请求不排队，超过阈值直接拒绝。' }
        ]
      }
    ]
  },
  {
    key: 'conf-performance',
    label: '性能缓存',
    title: '压缩、缓存与静态资源优化',
    description: '围绕压缩、浏览器缓存、代理缓存和连接传输的常用性能配置。',
    items: [
      {
        id: 'conf-gzip',
        category: 'conf-performance',
        type: 'config',
        name: 'gzip',
        example: `gzip on;
gzip_comp_level 5;
gzip_min_length 1k;
gzip_types text/plain text/css application/json application/javascript application/xml;`,
        desc: '开启文本资源压缩，减少带宽占用。',
        scene: '前端静态资源、接口 JSON 响应较多的站点通常都会启用。',
        options: [
          { key: 'gzip on', desc: '开启 gzip 压缩。' },
          { key: 'gzip_comp_level', desc: '压缩级别，数值越大 CPU 开销越高。' },
          { key: 'gzip_types', desc: '指定参与压缩的 MIME 类型。' }
        ]
      },
      {
        id: 'conf-expires',
        category: 'conf-performance',
        type: 'config',
        name: 'expires / Cache-Control',
        example: `location ~* \\.(js|css|png|jpg|svg)$ {
  expires 7d;
  add_header Cache-Control "public, max-age=604800, immutable";
}`,
        desc: '为静态资源设置浏览器缓存策略。',
        scene: '前端静态资源带 hash 文件名时适合配置更激进的缓存。',
        options: [
          { key: 'expires 7d', desc: '设置浏览器缓存过期时间。' },
          { key: 'Cache-Control', desc: '补充更明确的缓存控制策略。' },
          { key: 'immutable', desc: '资源带指纹时可提示浏览器无需重复校验。' }
        ]
      },
      {
        id: 'conf-proxy-cache',
        category: 'conf-performance',
        type: 'config',
        name: 'proxy_cache',
        example: `proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=page_cache:100m inactive=30m max_size=2g;

location / {
  proxy_cache page_cache;
  proxy_cache_valid 200 10m;
  proxy_pass http://backend;
}`,
        desc: '为代理结果建立缓存，降低后端压力。',
        scene: '对公共页面、只读接口或热点内容做边缘缓存时使用。',
        options: [
          { key: 'proxy_cache_path', desc: '定义缓存目录、共享内存区和大小限制。' },
          { key: 'proxy_cache', desc: '在 location 中启用指定缓存区。' },
          { key: 'proxy_cache_valid', desc: '定义不同状态码的缓存时间。' }
        ]
      },
      {
        id: 'conf-sendfile-keepalive',
        category: 'conf-performance',
        type: 'config',
        name: 'sendfile / keepalive_timeout',
        example: `sendfile on;
tcp_nopush on;
keepalive_timeout 65;
keepalive_requests 1000;`,
        desc: '优化静态文件发送和长连接行为。',
        scene: '提供大量静态资源或高频短连接请求时可明显受益。',
        options: [
          { key: 'sendfile', desc: '启用零拷贝式文件传输。' },
          { key: 'tcp_nopush', desc: '配合 sendfile 优化网络包发送效率。' },
          { key: 'keepalive_timeout', desc: '控制连接保持时间，平衡复用率与资源占用。' }
        ]
      }
    ]
  }
]
