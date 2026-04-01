export const dockerCommandSections = [
  {
    key: 'image',
    label: '镜像',
    title: '镜像 Image',
    description: '拉取、构建、打标与清理镜像时最常用的一组命令。',
    commands: [
      {
        id: 'image-pull',
        category: 'image',
        name: 'docker pull',
        command: 'docker pull nginx:latest',
        desc: '从远程仓库拉取镜像到本地。',
        scene: '初始化环境或同步某个基础镜像版本时最常用。',
        options: [
          { key: 'IMAGE[:TAG]', desc: '镜像名称与标签，不写标签时默认使用 latest。' },
          { key: '--platform', desc: '按指定平台拉取镜像，例如 linux/amd64。' }
        ]
      },
      {
        id: 'image-list',
        category: 'image',
        name: 'docker images',
        command: 'docker images',
        desc: '查看当前主机上的本地镜像列表。',
        scene: '确认镜像是否已拉取、查看标签或排查磁盘占用时使用。',
        options: [
          { key: '-a', desc: '显示所有镜像，包括中间层镜像。' },
          { key: '--digests', desc: '额外显示镜像摘要，便于和仓库内容核对。' }
        ]
      },
      {
        id: 'image-build',
        category: 'image',
        name: 'docker build',
        command: 'docker build -t my-app:1.0 .',
        desc: '根据 Dockerfile 构建自定义镜像。',
        scene: '应用打包、发布前本地验证镜像构建流程时使用。',
        options: [
          { key: '-t', desc: '为生成的镜像打标签，便于后续运行或推送。' },
          { key: '.', desc: '构建上下文目录，通常为当前项目根目录。' }
        ]
      },
      {
        id: 'image-tag',
        category: 'image',
        name: 'docker tag',
        command: 'docker tag my-app:1.0 registry.example.com/my-app:1.0',
        desc: '为已有镜像打一个新的仓库标签。',
        scene: '推送镜像到私有仓库或区分环境标签时使用。',
        options: [
          { key: 'SOURCE_IMAGE', desc: '原始镜像名或镜像 ID。' },
          { key: 'TARGET_IMAGE', desc: '新的镜像仓库地址与标签。' }
        ]
      },
      {
        id: 'image-remove',
        category: 'image',
        name: 'docker rmi',
        command: 'docker rmi nginx:latest',
        desc: '删除本地不再需要的镜像。',
        scene: '清理旧版本镜像、释放磁盘空间时使用。',
        options: [
          { key: '-f', desc: '强制删除，即使镜像仍有关联标签。' },
          { key: 'IMAGE', desc: '要删除的镜像名、标签或镜像 ID。' }
        ]
      },
      {
        id: 'image-save',
        category: 'image',
        name: 'docker save',
        command: 'docker save -o nginx.tar nginx:latest',
        desc: '将镜像导出为归档文件。',
        scene: '离线传输镜像或做镜像备份时很实用。',
        options: [
          { key: '-o', desc: '指定导出文件名，例如 nginx.tar。' },
          { key: 'IMAGE', desc: '要导出的镜像名、标签或镜像 ID。' }
        ]
      }
    ]
  },
  {
    key: 'container',
    label: '容器',
    title: '容器 Container',
    description: '容器创建、查看、调试、停止与删除的核心命令。',
    commands: [
      {
        id: 'container-run',
        category: 'container',
        name: 'docker run',
        command: 'docker run -d --name web -p 8080:80 nginx',
        desc: '基于镜像创建并启动一个新容器。',
        scene: '本地快速启动服务或验证镜像可运行性时最常见。',
        options: [
          { key: '-d', desc: '后台运行容器，不占用当前终端。' },
          { key: '--name', desc: '指定容器名称，方便后续管理。' },
          { key: '-p', desc: '将宿主机端口映射到容器端口。' }
        ]
      },
      {
        id: 'container-ps',
        category: 'container',
        name: 'docker ps',
        command: 'docker ps -a',
        desc: '查看正在运行或历史创建过的容器。',
        scene: '排查容器状态、确认名称或 ID 时经常使用。',
        options: [
          { key: '-a', desc: '显示所有容器，包括已退出的容器。' },
          { key: '--format', desc: '自定义输出格式，适合脚本化查看。' }
        ]
      },
      {
        id: 'container-logs',
        category: 'container',
        name: 'docker logs',
        command: 'docker logs -f --tail 100 web',
        desc: '查看容器标准输出日志。',
        scene: '排查服务启动失败、实时跟踪应用日志时使用。',
        options: [
          { key: '-f', desc: '持续跟踪日志输出，相当于 follow。' },
          { key: '--tail', desc: '只查看最近若干行日志，减少噪音。' }
        ]
      },
      {
        id: 'container-exec',
        category: 'container',
        name: 'docker exec',
        command: 'docker exec -it web /bin/sh',
        desc: '进入已运行容器执行命令。',
        scene: '在线排查、查看容器内文件或执行临时命令时使用。',
        options: [
          { key: '-it', desc: '开启交互式终端，便于直接进入 shell。' },
          { key: '/bin/sh', desc: '容器内要执行的命令，可换成 bash 或其他命令。' }
        ]
      },
      {
        id: 'container-stop',
        category: 'container',
        name: 'docker stop',
        command: 'docker stop web',
        desc: '优雅停止一个正在运行的容器。',
        scene: '发布切换、故障隔离或准备删除容器前使用。',
        options: [
          { key: '-t', desc: '设置容器接收 SIGKILL 前的等待秒数。' },
          { key: 'CONTAINER', desc: '容器名称或容器 ID。' }
        ]
      },
      {
        id: 'container-remove',
        category: 'container',
        name: 'docker rm',
        command: 'docker rm -f web',
        desc: '删除一个或多个容器。',
        scene: '清理测试容器、重建环境时常和 docker stop 配合使用。',
        options: [
          { key: '-f', desc: '强制停止后再删除容器。' },
          { key: '-v', desc: '同时删除匿名挂载卷，避免残留。' }
        ]
      }
    ]
  },
  {
    key: 'network',
    label: '网络',
    title: '网络 Network',
    description: '容器网络查看、创建、连接和清理的常见命令。',
    commands: [
      {
        id: 'network-list',
        category: 'network',
        name: 'docker network ls',
        command: 'docker network ls',
        desc: '列出当前 Docker 主机上的网络。',
        scene: '查看 bridge、自定义网络或排查容器互通问题时使用。',
        options: [
          { key: '--filter', desc: '按网络名、驱动等条件过滤输出。' },
          { key: '--format', desc: '按自定义模板输出网络信息。' }
        ]
      },
      {
        id: 'network-create',
        category: 'network',
        name: 'docker network create',
        command: 'docker network create app-net',
        desc: '创建一个用户自定义网络。',
        scene: '让一组容器加入同一网络并通过名称互相访问时使用。',
        options: [
          { key: '--driver', desc: '指定网络驱动，默认通常为 bridge。' },
          { key: 'NETWORK', desc: '要创建的网络名称。' }
        ]
      },
      {
        id: 'network-inspect',
        category: 'network',
        name: 'docker network inspect',
        command: 'docker network inspect app-net',
        desc: '查看网络详情、已连接容器和网段信息。',
        scene: '排查服务发现、IP 分配或网络配置错误时使用。',
        options: [
          { key: 'NETWORK', desc: '目标网络名称或网络 ID。' },
          { key: '--verbose', desc: '显示更详细的诊断信息。' }
        ]
      },
      {
        id: 'network-connect',
        category: 'network',
        name: 'docker network connect',
        command: 'docker network connect app-net web',
        desc: '把一个运行中的容器接入指定网络。',
        scene: '需要临时让容器访问新服务或补充网络连通性时使用。',
        options: [
          { key: 'NETWORK', desc: '要加入的网络名称。' },
          { key: 'CONTAINER', desc: '要接入网络的容器名称或 ID。' }
        ]
      },
      {
        id: 'network-disconnect',
        category: 'network',
        name: 'docker network disconnect',
        command: 'docker network disconnect app-net web',
        desc: '将容器从某个网络中移除。',
        scene: '隔离故障容器或调整网络拓扑时使用。',
        options: [
          { key: 'NETWORK', desc: '要断开的网络名称。' },
          { key: 'CONTAINER', desc: '要移除的容器名称或 ID。' }
        ]
      },
      {
        id: 'network-remove',
        category: 'network',
        name: 'docker network rm',
        command: 'docker network rm app-net',
        desc: '删除不再使用的自定义网络。',
        scene: '环境回收或清理测试网络资源时使用。',
        options: [
          { key: 'NETWORK', desc: '要删除的网络名称或 ID。' },
          { key: '-f', desc: '网络不存在时不报错，适合脚本批量删除。' }
        ]
      }
    ]
  },
  {
    key: 'volume',
    label: '数据卷',
    title: '数据卷 Volume',
    description: '卷的创建、挂载、查看与清理命令，适合持久化数据。',
    commands: [
      {
        id: 'volume-list',
        category: 'volume',
        name: 'docker volume ls',
        command: 'docker volume ls',
        desc: '查看当前主机上的所有数据卷。',
        scene: '盘点卷资源或确认卷是否已创建时使用。',
        options: [
          { key: '--filter', desc: '按名称、驱动等条件过滤卷列表。' },
          { key: '--format', desc: '按模板输出卷信息，便于脚本处理。' }
        ]
      },
      {
        id: 'volume-create',
        category: 'volume',
        name: 'docker volume create',
        command: 'docker volume create app-data',
        desc: '创建一个新的持久化数据卷。',
        scene: '为数据库、缓存等有状态服务准备存储时使用。',
        options: [
          { key: '--driver', desc: '指定卷驱动，不写时默认 local。' },
          { key: 'VOLUME', desc: '要创建的数据卷名称。' }
        ]
      },
      {
        id: 'volume-inspect',
        category: 'volume',
        name: 'docker volume inspect',
        command: 'docker volume inspect app-data',
        desc: '查看卷的挂载点与驱动详情。',
        scene: '排查数据目录、权限或卷驱动配置时使用。',
        options: [
          { key: 'VOLUME', desc: '目标卷名称。' },
          { key: '--format', desc: '按模板输出字段，便于精确查看。' }
        ]
      },
      {
        id: 'volume-mount',
        category: 'volume',
        name: 'docker run -v',
        command: 'docker run -d --name mysql -v app-data:/var/lib/mysql mysql:8',
        desc: '运行容器时将数据卷挂载到容器目录。',
        scene: '启动数据库、日志服务等需要持久化数据的容器时使用。',
        options: [
          { key: '-v', desc: '指定卷挂载，格式为 卷名:容器路径。' },
          { key: '--name', desc: '为容器指定固定名称，便于运维。' }
        ]
      },
      {
        id: 'volume-remove',
        category: 'volume',
        name: 'docker volume rm',
        command: 'docker volume rm app-data',
        desc: '删除不再需要的数据卷。',
        scene: '测试环境回收、释放无用卷占用空间时使用。',
        options: [
          { key: '-f', desc: '强制删除卷，适合自动化清理流程。' },
          { key: 'VOLUME', desc: '要删除的数据卷名称。' }
        ]
      },
      {
        id: 'volume-prune',
        category: 'volume',
        name: 'docker volume prune',
        command: 'docker volume prune',
        desc: '批量清理未被使用的数据卷。',
        scene: '定期清理残留卷、防止磁盘被无效卷持续占满时使用。',
        options: [
          { key: '-f', desc: '跳过确认直接执行清理。' },
          { key: '--filter', desc: '仅清理满足条件的卷。' }
        ]
      }
    ]
  },
  {
    key: 'system',
    label: '系统',
    title: '系统 System',
    description: '查看 Docker 系统信息、资源占用与全局清理的命令。',
    commands: [
      {
        id: 'system-info',
        category: 'system',
        name: 'docker info',
        command: 'docker info',
        desc: '查看 Docker 引擎、存储驱动和系统概要信息。',
        scene: '环境巡检、排查驱动或资源限制配置时使用。',
        options: [
          { key: '-f, --format', desc: '按模板或 JSON 输出系统信息，便于脚本读取。' }
        ]
      },
      {
        id: 'system-version',
        category: 'system',
        name: 'docker version',
        command: 'docker version',
        desc: '查看客户端与服务端版本信息。',
        scene: '确认版本兼容性或排查 API 行为差异时使用。',
        options: [
          { key: '-f, --format', desc: '按模板输出客户端或服务端版本字段。' }
        ]
      },
      {
        id: 'system-df',
        category: 'system',
        name: 'docker system df',
        command: 'docker system df',
        desc: '统计镜像、容器、卷和构建缓存的磁盘占用。',
        scene: '定位磁盘空间被哪类 Docker 资源占满时使用。',
        options: [
          { key: '-v', desc: '显示更细粒度的占用明细。' },
          { key: '--format', desc: '按模板输出磁盘占用结果。' }
        ]
      },
      {
        id: 'system-stats',
        category: 'system',
        name: 'docker stats',
        command: 'docker stats',
        desc: '实时查看容器 CPU、内存与网络 IO 使用情况。',
        scene: '排查性能瓶颈或观察容器运行负载时使用。',
        options: [
          { key: '--no-stream', desc: '只输出一次统计结果，不持续刷新。' },
          { key: 'CONTAINER', desc: '仅查看指定容器的资源使用。' }
        ]
      },
      {
        id: 'system-prune',
        category: 'system',
        name: 'docker system prune',
        command: 'docker system prune -a',
        desc: '清理未使用的镜像、容器、网络和构建缓存。',
        scene: '测试机或开发机磁盘紧张时最常见的全局清理命令。',
        options: [
          { key: '-a', desc: '连未被容器使用的镜像也一并清理。' },
          { key: '--volumes', desc: '额外清理未被使用的匿名卷。' }
        ]
      },
      {
        id: 'system-events',
        category: 'system',
        name: 'docker events',
        command: 'docker events --since 10m',
        desc: '实时输出 Docker 守护进程事件流。',
        scene: '排查容器重启、删除或网络变更等动态事件时使用。',
        options: [
          { key: '--since', desc: '从指定时间点之后开始查看事件。' },
          { key: '--filter', desc: '按容器、镜像或事件类型过滤输出。' }
        ]
      }
    ]
  },
  {
    key: 'docker-compose',
    label: 'Docker Compose',
    title: 'Docker Compose',
    description: '面向多容器编排的常用命令，适合本地开发和服务编组管理。',
    commands: [
      {
        id: 'compose-up',
        category: 'docker-compose',
        name: 'docker compose up',
        command: 'docker compose up -d --build',
        desc: '启动 compose.yaml 中定义的服务。',
        scene: '本地拉起整套依赖服务或重新构建后启动环境时使用。',
        options: [
          { key: '-d', desc: '后台启动所有服务。' },
          { key: '--build', desc: '启动前先重新构建镜像。' }
        ]
      },
      {
        id: 'compose-down',
        category: 'docker-compose',
        name: 'docker compose down',
        command: 'docker compose down',
        desc: '停止并删除 Compose 管理的服务资源。',
        scene: '关闭当前编排环境或准备切换配置时使用。',
        options: [
          { key: '--volumes', desc: '同时删除编排创建的数据卷。' },
          { key: '--remove-orphans', desc: '删除当前配置之外的孤立服务容器。' }
        ]
      },
      {
        id: 'compose-ps',
        category: 'docker-compose',
        name: 'docker compose ps',
        command: 'docker compose ps',
        desc: '查看当前编排中各服务实例的状态。',
        scene: '确认服务是否启动成功或查看映射端口时使用。',
        options: [
          { key: '-a', desc: '显示所有服务容器，包括已停止实例。' },
          { key: '--format', desc: '自定义输出字段，方便脚本化处理。' }
        ]
      },
      {
        id: 'compose-logs',
        category: 'docker-compose',
        name: 'docker compose logs',
        command: 'docker compose logs -f web',
        desc: '查看某个服务或整套编排的日志输出。',
        scene: '本地联调多服务时，快速追踪某个服务日志很常用。',
        options: [
          { key: '-f', desc: '持续跟踪日志输出。' },
          { key: 'SERVICE', desc: '指定要查看的服务名称，例如 web。' }
        ]
      },
      {
        id: 'compose-exec',
        category: 'docker-compose',
        name: 'docker compose exec',
        command: 'docker compose exec web sh',
        desc: '进入 Compose 管理的服务容器执行命令。',
        scene: '查看容器内部状态、执行调试脚本或临时操作时使用。',
        options: [
          { key: 'SERVICE', desc: '目标服务名称。' },
          { key: 'COMMAND', desc: '要执行的命令，例如 sh、bash 或 node。' }
        ]
      },
      {
        id: 'compose-pull',
        category: 'docker-compose',
        name: 'docker compose pull',
        command: 'docker compose pull',
        desc: '为 Compose 中定义的服务拉取最新镜像。',
        scene: '更新基础镜像版本或准备启动前提前拉取依赖时使用。',
        options: [
          { key: '--ignore-buildable', desc: '跳过本地可构建的服务镜像。' },
          { key: 'SERVICE', desc: '只拉取指定服务对应的镜像。' }
        ]
      },
      {
        id: 'compose-restart',
        category: 'docker-compose',
        name: 'docker compose restart',
        command: 'docker compose restart web',
        desc: '重启 Compose 中的一个或多个服务。',
        scene: '修改配置后快速重启服务、无需整套环境重建时使用。',
        options: [
          { key: '-t', desc: '设置停止服务前的等待秒数。' },
          { key: 'SERVICE', desc: '需要重启的服务名称。' }
        ]
      },
      {
        id: 'compose-config',
        category: 'docker-compose',
        name: 'docker compose config',
        command: 'docker compose config',
        desc: '校验并输出合并后的 Compose 配置。',
        scene: '检查 compose.yaml 语法、变量替换结果或多文件合并效果时使用。',
        options: [
          { key: '--services', desc: '仅列出配置中定义的服务名称。' },
          { key: '--profiles', desc: '查看当前可用的 profile 列表。' }
        ]
      }
    ]
  }
]
